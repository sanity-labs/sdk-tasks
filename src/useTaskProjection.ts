import {useDocumentProjection} from '@sanity/sdk-react'
import {useMemo, type RefObject} from 'react'

import {isTaskHandle, resolveTaskHandle, type TaskHandle} from './handles.js'
import {useResolvedAddonRuntime} from './runtime.js'

interface UseTaskProjectionByIdArgs {
  addonDataset?: string
  projectId?: string
  taskId: string
}

type UseTaskProjectionArgs = (TaskHandle | UseTaskProjectionByIdArgs) & {
  projection: string
  ref?: RefObject<Element | null>
}

export function useTaskProjection<TData extends object>(args: UseTaskProjectionArgs) {
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

  return useDocumentProjection<TData>({
    ...handle,
    projection: args.projection,
    ref: args.ref,
  })
}
