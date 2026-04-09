import {useOptionalAddonDatasetRuntime} from '@sanity-labs/sdk-addon-dataset-runtime'
import {useClient} from '@sanity/sdk-react'
import {useMemo} from 'react'

interface RuntimeOverrides {
  addonDataset?: string
  contentDataset?: string
  projectId?: string
  workspaceId?: string
  workspaceTitle?: string
}

export function useResolvedAddonRuntime(overrides: RuntimeOverrides) {
  const runtime = useOptionalAddonDatasetRuntime()

  return {
    addonDataset: overrides.addonDataset ?? runtime?.addonDataset,
    contentDataset: overrides.contentDataset ?? runtime?.contentDataset,
    projectId: overrides.projectId ?? runtime?.projectId,
    workspaceId: overrides.workspaceId ?? runtime?.workspaceId,
    workspaceTitle: overrides.workspaceTitle ?? runtime?.workspaceTitle,
  }
}

export function requireRuntimeValue(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`${label} is not configured`)
  }

  return value
}

type AddonDocument = Record<string, unknown> & {_id: string; _type: string}

export type AddonPatchOperation =
  | {type: 'insert'; items: unknown[]; position: 'after' | 'before' | 'replace'; selector: string}
  | {type: 'set'; value: Record<string, unknown>}
  | {type: 'setIfMissing'; value: Record<string, unknown>}
  | {type: 'unset'; paths: string[]}

export interface AddonCreateMutation<TDocument extends AddonDocument = AddonDocument> {
  document: TDocument
  mutationType: 'create'
}

export interface AddonDeleteMutation {
  documentId: string
  mutationType: 'delete'
}

export interface AddonPatchMutation {
  documentId: string
  mutationType: 'patch'
  operations: AddonPatchOperation[]
}

export type AddonMutation<TDocument extends AddonDocument = AddonDocument> =
  | AddonCreateMutation<TDocument>
  | AddonDeleteMutation
  | AddonPatchMutation

interface AddonMutationClient {
  execute: (mutationOrMutations: AddonMutation | AddonMutation[]) => Promise<unknown>
}

interface AddonPatchBuilder {
  insert: (
    position: 'after' | 'before' | 'replace',
    selector: string,
    items: unknown[],
  ) => AddonPatchBuilder
  set: (value: Record<string, unknown>) => AddonPatchBuilder
  setIfMissing: (value: Record<string, unknown>) => AddonPatchBuilder
  unset: (paths: string[]) => AddonPatchBuilder
}

interface AddonPatchCommitBuilder extends AddonPatchBuilder {
  commit: () => Promise<unknown>
}

interface AddonTransactionBuilder {
  commit: () => Promise<unknown>
  create: (document: AddonDocument) => AddonTransactionBuilder
  delete: (documentId: string) => AddonTransactionBuilder
  patch: (
    documentId: string,
    builder: (patch: AddonPatchBuilder) => AddonPatchBuilder,
  ) => AddonTransactionBuilder
}

interface UseAddonMutationClientOptions {
  addonDataset?: string
  apiVersion?: string
  projectId?: string
}

type AddonClient = ReturnType<typeof useClient>

export function useAddonMutationClient({
  addonDataset: addonDatasetOverride,
  apiVersion = '2025-05-06',
  projectId: projectIdOverride,
}: UseAddonMutationClientOptions = {}): AddonMutationClient {
  const {addonDataset, projectId} = useResolvedAddonRuntime({
    addonDataset: addonDatasetOverride,
    projectId: projectIdOverride,
  })
  const client = useClient({apiVersion})

  return useMemo(() => {
    const scopedClient = client.withConfig({
      dataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
      projectId: requireRuntimeValue(projectId, 'Project ID'),
      useCdn: false,
    })

    return {
      execute: async (mutationOrMutations: AddonMutation | AddonMutation[]) =>
        await executeAddonMutations(scopedClient, mutationOrMutations),
    }
  }, [addonDataset, client, projectId])
}

export async function executeAddonMutations(
  client: AddonClient,
  mutationOrMutations: AddonMutation | AddonMutation[],
) {
  const mutations = Array.isArray(mutationOrMutations) ? mutationOrMutations : [mutationOrMutations]

  if (mutations.length === 0) {
    return undefined
  }

  if (mutations.length === 1) {
    return await executeSingleAddonMutation(client, mutations[0])
  }

  let transaction = client.transaction() as unknown as AddonTransactionBuilder

  for (const mutation of mutations) {
    transaction = addMutationToTransaction(transaction, mutation)
  }

  return await transaction.commit()
}

function addMutationToTransaction(
  transaction: AddonTransactionBuilder,
  mutation: AddonMutation,
): AddonTransactionBuilder {
  switch (mutation.mutationType) {
    case 'create':
      return transaction.create(mutation.document)
    case 'delete':
      return transaction.delete(mutation.documentId)
    case 'patch':
      if (mutation.operations.length === 0) {
        return transaction
      }

      return transaction.patch(mutation.documentId, (patch) =>
        applyPatchOperations(patch, mutation.operations),
      )
  }
}

async function executeSingleAddonMutation(client: AddonClient, mutation: AddonMutation) {
  switch (mutation.mutationType) {
    case 'create':
      return await client.create(mutation.document)
    case 'delete':
      return await client.delete(mutation.documentId)
    case 'patch':
      if (mutation.operations.length === 0) {
        return undefined
      }

      return await applyPatchOperations(
        client.patch(mutation.documentId) as unknown as AddonPatchCommitBuilder,
        mutation.operations,
      ).commit()
  }
}

function applyPatchOperations<TPatch extends AddonPatchBuilder>(
  patch: TPatch,
  operations: AddonPatchOperation[],
): TPatch {
  let nextPatch = patch

  for (const operation of operations) {
    switch (operation.type) {
      case 'insert':
        nextPatch = nextPatch.insert(operation.position, operation.selector, operation.items) as TPatch
        break
      case 'set':
        if (Object.keys(operation.value).length > 0) {
          nextPatch = nextPatch.set(operation.value) as TPatch
        }
        break
      case 'setIfMissing':
        if (Object.keys(operation.value).length > 0) {
          nextPatch = nextPatch.setIfMissing(operation.value) as TPatch
        }
        break
      case 'unset':
        if (operation.paths.length > 0) {
          nextPatch = nextPatch.unset(operation.paths) as TPatch
        }
        break
    }
  }

  return nextPatch
}
