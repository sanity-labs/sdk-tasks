import {useOptionalAddonDatasetRuntime} from '@sanity-labs/sdk-addon-dataset-runtime'

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
