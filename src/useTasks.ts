import {useDocuments} from '@sanity/sdk-react'
import {useMemo} from 'react'

import {createTaskHandle, type TaskHandle} from './handles.js'
import {requireRuntimeValue, useResolvedAddonRuntime} from './runtime.js'

interface UseTasksArgs {
  addonDataset?: string
  batchSize?: number
  filter?: string
  orderings?: Array<{direction: 'asc' | 'desc'; field: string}>
  params?: Record<string, unknown>
  projectId?: string
  search?: string
}

export function useTasks({
  addonDataset: addonDatasetOverride,
  batchSize,
  filter,
  orderings = [{field: '_createdAt', direction: 'desc'}],
  params,
  projectId: projectIdOverride,
  search,
}: UseTasksArgs = {}) {
  const {addonDataset, projectId} = useResolvedAddonRuntime({
    addonDataset: addonDatasetOverride,
    projectId: projectIdOverride,
  })

  const response = useDocuments({
    batchSize,
    dataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
    documentType: 'tasks.task',
    filter,
    orderings,
    params,
    projectId: requireRuntimeValue(projectId, 'Project ID'),
    search,
  })

  const data = useMemo<TaskHandle[]>(
    () =>
      response.data.map((task) =>
        createTaskHandle({
          addonDataset: task.dataset ?? addonDataset,
          projectId: task.projectId ?? projectId,
          taskId: task.documentId,
        }),
      ),
    [addonDataset, projectId, response.data],
  )

  return {
    ...response,
    data,
  }
}
