import {useQuery} from '@sanity/sdk-react'
import {useMemo} from 'react'

import {TASKS_BY_DOCUMENT_TYPE_QUERY} from './queries.js'
import {requireRuntimeValue, useResolvedAddonRuntime} from './runtime.js'
import type {TaskDocument} from './types.js'

interface UseTasksByDocumentTypeArgs {
  addonDataset?: string
  documentType: string
  projectId?: string
  query?: string
}

export interface TasksByDocumentSummary {
  closedCount: number
  openCount: number
  overdueCount: number
  sortedTasks: TaskDocument[]
  tasks: TaskDocument[]
  unassignedCount: number
}

const EMPTY_TASKS_BY_DOCUMENT_SUMMARY: TasksByDocumentSummary = {
  closedCount: 0,
  openCount: 0,
  overdueCount: 0,
  sortedTasks: [],
  tasks: [],
  unassignedCount: 0,
}

export function useTasksByDocumentType({
  addonDataset: addonDatasetOverride,
  documentType,
  projectId: projectIdOverride,
  query = TASKS_BY_DOCUMENT_TYPE_QUERY,
}: UseTasksByDocumentTypeArgs) {
  const {addonDataset, projectId} = useResolvedAddonRuntime({
    addonDataset: addonDatasetOverride,
    projectId: projectIdOverride,
  })

  const {data, isPending} = useQuery<TaskDocument[]>({
    dataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
    params: {documentType},
    projectId: requireRuntimeValue(projectId, 'Project ID'),
    query,
  })

  const tasks = data ?? []

  const tasksByDocumentId = useMemo(() => {
    const grouped = new Map<string, TaskDocument[]>()

    for (const task of tasks) {
      const documentRef = task.target?.document?._ref?.replace(/^drafts\./, '')
      if (!documentRef) continue

      const current = grouped.get(documentRef)
      if (current) {
        current.push(task)
      } else {
        grouped.set(documentRef, [task])
      }
    }

    return grouped
  }, [tasks])

  const summariesByDocumentId = useMemo(() => {
    const summaries = new Map<string, TasksByDocumentSummary>()

    for (const [documentId, documentTasks] of tasksByDocumentId.entries()) {
      const sortedTasks = [...documentTasks].sort((left, right) => {
        if (left.status !== right.status) return left.status === 'open' ? -1 : 1
        return new Date(right._createdAt).getTime() - new Date(left._createdAt).getTime()
      })

      const openCount = documentTasks.filter((task) => task.status === 'open').length
      const closedCount = documentTasks.length - openCount
      const overdueCount = documentTasks.filter((task) => isTaskOverdue(task)).length
      const unassignedCount = documentTasks.filter(
        (task) => task.status === 'open' && !task.assignedTo && !isTaskOverdue(task),
      ).length

      summaries.set(documentId, {
        closedCount,
        openCount,
        overdueCount,
        sortedTasks,
        tasks: documentTasks,
        unassignedCount,
      })
    }

    return summaries
  }, [tasksByDocumentId])

  const getSummaryForDocument = (documentId: string): TasksByDocumentSummary => {
    const cleanId = documentId.replace(/^drafts\./, '')
    return summariesByDocumentId.get(cleanId) ?? EMPTY_TASKS_BY_DOCUMENT_SUMMARY
  }

  return {
    getSummaryForDocument,
    isPending,
    summariesByDocumentId,
    tasks,
    tasksByDocumentId,
  }
}

function isTaskOverdue(task: {dueBy?: string; status: string}) {
  if (task.status !== 'open' || !task.dueBy) return false
  return new Date(task.dueBy).getTime() < Date.now()
}
