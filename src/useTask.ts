import {useDocument} from '@sanity/sdk-react'
import {useMemo} from 'react'

import {isTaskHandle, resolveTaskHandle, type TaskHandle} from './handles.js'
import {useResolvedAddonRuntime} from './runtime.js'
import type {TaskDocument} from './types.js'

interface UseTaskByIdArgs {
  addonDataset?: string
  projectId?: string
  taskId: string
}

type UseTaskArgs = TaskHandle | UseTaskByIdArgs

export function useTask<TData = TaskDocument>(args: UseTaskArgs) {
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

  return useDocument<TData>(handle)
}
