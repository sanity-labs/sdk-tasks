import {useQuery} from '@sanity/sdk-react'
import {useMemo} from 'react'

import {TASKS_BY_DOCUMENT_QUERY} from './queries'
import {requireRuntimeValue, useResolvedAddonRuntime} from './runtime'
import type {TaskDocument} from './types'

interface UseDocumentTasksArgs {
  addonDataset?: string
  documentId: string
  projectId?: string
  query?: string
}

export function useDocumentTasks({
  addonDataset: addonDatasetOverride,
  documentId,
  projectId: projectIdOverride,
  query = TASKS_BY_DOCUMENT_QUERY,
}: UseDocumentTasksArgs) {
  const {addonDataset, projectId} = useResolvedAddonRuntime({
    addonDataset: addonDatasetOverride,
    projectId: projectIdOverride,
  })
  const cleanId = documentId.replace('drafts.', '')

  const {data, isPending} = useQuery<TaskDocument[]>({
    dataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
    params: {documentId: cleanId},
    projectId: requireRuntimeValue(projectId, 'Project ID'),
    query,
  })

  const tasks = data ?? []
  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'open' ? -1 : 1
        return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
      }),
    [tasks],
  )

  const openCount = tasks.filter((task) => task.status === 'open').length
  const closedCount = tasks.length - openCount
  const overdueCount = tasks.filter((task) => isTaskOverdue(task)).length
  const unassignedCount = tasks.filter(
    (task) => task.status === 'open' && !task.assignedTo && !isTaskOverdue(task),
  ).length

  return {
    closedCount,
    isPending,
    openCount,
    overdueCount,
    sortedTasks,
    tasks,
    unassignedCount,
  }
}

function isTaskOverdue(task: {dueBy?: string; status: string}) {
  if (task.status !== 'open' || !task.dueBy) return false
  return new Date(task.dueBy).getTime() < Date.now()
}
