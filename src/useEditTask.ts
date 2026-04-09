import {useDocument} from '@sanity/sdk-react'
import {useCallback, useMemo} from 'react'

import {patchTask} from './actions.js'
import {isTaskHandle, resolveTaskHandle, type TaskHandle} from './handles.js'
import {type AddonPatchOperation, useResolvedAddonRuntime} from './runtime.js'
import {useApplyTaskActions} from './useApplyTaskActions.js'
import type {TaskDocument} from './types.js'

interface UseEditTaskByIdArgs {
  addonDataset?: string
  path?: string
  projectId?: string
  taskId: string
}

type UseEditTaskArgs = TaskHandle | UseEditTaskByIdArgs

const IGNORED_KEYS = ['_createdAt', '_id', '_rev', '_type', '_updatedAt']

type Updater<TValue> = TValue | ((currentValue: TValue) => TValue)

export function useEditTask<TData = TaskDocument>(args: UseEditTaskArgs) {
  const runtime = useResolvedAddonRuntime({
    addonDataset: isTaskHandle(args) ? args.dataset : args.addonDataset,
    projectId: isTaskHandle(args) ? args.projectId : args.projectId,
  })

  const handle = useMemo(
    () =>
      resolveTaskHandle(args, {
        addonDataset: runtime.addonDataset,
        projectId: runtime.projectId,
      }),
    [args, runtime.addonDataset, runtime.projectId],
  )

  const path = isTaskHandle(args) ? undefined : args.path
  const documentOptions = useMemo(() => (path ? {...handle, path} : handle), [handle, path])
  const {data: currentValue} = useDocument<TData>(documentOptions)
  const applyTaskActions = useApplyTaskActions({
    addonDataset: runtime.addonDataset,
    projectId: runtime.projectId,
  })

  return useCallback(
    async (updater: Updater<TData>) => {
      const nextValue =
        typeof updater === 'function'
          ? (updater as (value: TData) => TData)(currentValue as TData)
          : updater

      if (path) {
        const operations: AddonPatchOperation[] =
          nextValue === undefined
            ? [{paths: [path], type: 'unset'}]
            : [{type: 'set', value: {[path]: nextValue}}]

        return await applyTaskActions(patchTask(handle, operations, {stampLastEditedAt: true}))
      }

      if (typeof nextValue !== 'object' || !nextValue) {
        throw new Error(
          'No path was provided to `useEditTask` and the value provided was not a document object.',
        )
      }

      const currentDocument = currentValue as Record<string, unknown> | null | undefined
      const nextDocument = nextValue as Record<string, unknown>
      const operations: AddonPatchOperation[] = []
      const setValues: Record<string, unknown> = {}
      const unsetPaths: string[] = []

      for (const key of Object.keys({...currentDocument, ...nextDocument})) {
        if (IGNORED_KEYS.includes(key)) continue

        const hasNextValue = key in nextDocument
        const previousValue = currentDocument?.[key]
        const candidateValue = nextDocument[key]

        if (previousValue === candidateValue) continue

        if (hasNextValue) {
          setValues[key] = candidateValue
        } else {
          unsetPaths.push(key)
        }
      }

      if (Object.keys(setValues).length > 0) {
        operations.push({type: 'set', value: setValues})
      }

      if (unsetPaths.length > 0) {
        operations.push({paths: unsetPaths, type: 'unset'})
      }

      if (operations.length === 0) {
        return undefined
      }

      return await applyTaskActions(patchTask(handle, operations, {stampLastEditedAt: true}))
    },
    [applyTaskActions, currentValue, handle, path],
  )
}
