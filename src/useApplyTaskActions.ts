import {useClient} from '@sanity/sdk-react'
import {useCallback, useMemo} from 'react'

import {requireRuntimeValue, useResolvedAddonRuntime} from './runtime'
import type {TaskDocument, TaskEditPayload, TaskStatus} from './types'

interface CreateTaskArgs {
  assignedTo?: string
  description?: TaskDocument['description']
  documentId: string
  documentType: string
  dueBy?: string
  subscribers?: string[]
  title: string
}

interface UseApplyTaskActionsOptions {
  addonDataset?: string
  apiVersion?: string
  contentDataset?: string
  currentUserId?: string
  projectId?: string
  workspaceId?: string
  workspaceTitle?: string
}

export function useApplyTaskActions({
  addonDataset: addonDatasetOverride,
  apiVersion = '2025-05-06',
  contentDataset: contentDatasetOverride,
  currentUserId,
  projectId: projectIdOverride,
  workspaceId: workspaceIdOverride,
  workspaceTitle: workspaceTitleOverride,
}: UseApplyTaskActionsOptions = {}) {
  const {addonDataset, contentDataset, projectId, workspaceId, workspaceTitle} =
    useResolvedAddonRuntime({
      addonDataset: addonDatasetOverride,
      contentDataset: contentDatasetOverride,
      projectId: projectIdOverride,
      workspaceId: workspaceIdOverride,
      workspaceTitle: workspaceTitleOverride,
    })
  const baseClient = useClient({apiVersion})

  const client = useMemo(
    () =>
      baseClient.withConfig({
        dataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
        projectId: requireRuntimeValue(projectId, 'Project ID'),
      }),
    [addonDataset, baseClient, projectId],
  )

  const createTask = useCallback(
    async ({
      assignedTo,
      description,
      documentId,
      documentType,
      dueBy,
      subscribers,
      title,
    }: CreateTaskArgs) => {
      const resolvedContentDataset = requireRuntimeValue(contentDataset, 'Content dataset')
      const resolvedProjectId = requireRuntimeValue(projectId, 'Project ID')
      const authorId = currentUserId ?? 'unknown'
      const now = new Date().toISOString()

      return await client.create({
        _type: 'tasks.task' as const,
        authorId,
        context:
          workspaceId || workspaceTitle
            ? {
                payload: {workspace: workspaceId ?? ''},
                tool: 'sanetti',
              }
            : undefined,
        createdByUser: now,
        description,
        status: 'open',
        subscribers: subscribers ?? (assignedTo ? [authorId, assignedTo] : [authorId]),
        target: {
          document: {
            _dataset: resolvedContentDataset,
            _projectId: resolvedProjectId,
            _ref: documentId.replace('drafts.', ''),
            _type: 'crossDatasetReference' as const,
            _weak: true,
          },
          documentType,
        },
        title,
        ...(assignedTo ? {assignedTo} : {}),
        ...(dueBy ? {dueBy} : {}),
      })
    },
    [client, contentDataset, currentUserId, projectId, workspaceId, workspaceTitle],
  )

  const editTask = useCallback(
    async (taskId: string, payload: TaskEditPayload) => {
      return await client
        .patch(taskId)
        .set({
          ...payload,
          lastEditedAt: new Date().toISOString(),
        })
        .commit()
    },
    [client],
  )

  const setTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      return await client
        .patch(taskId)
        .set({
          lastEditedAt: new Date().toISOString(),
          status,
        })
        .commit()
    },
    [client],
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      return await client.delete(taskId)
    },
    [client],
  )

  return {
    createTask,
    deleteTask,
    editTask,
    setTaskStatus,
  }
}
