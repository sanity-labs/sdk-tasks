import {useCallback, useMemo} from 'react'

import {
  createTask as createTaskAction,
  deleteTask as deleteTaskAction,
  editTask as editTaskAction,
  setTaskStatus as setTaskStatusAction,
  type CreateTaskActionArgs,
  type TaskAction,
} from './actions.js'
import {createTaskHandle} from './handles.js'
import {requireRuntimeValue, useAddonMutationClient, useResolvedAddonRuntime} from './runtime.js'
import type {TaskDocument, TaskEditPayload, TaskStatus} from './types.js'

interface CreateTaskArgs extends Omit<CreateTaskActionArgs, 'authorId' | 'contentDataset'> {
  taskId?: string
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

interface ApplyTaskActionsApi {
  (action: TaskAction | TaskAction[]): Promise<unknown>
  createTask: (args: CreateTaskArgs) => Promise<Pick<TaskDocument, '_id'>>
  deleteTask: (taskId: string) => Promise<unknown>
  editTask: (taskId: string, payload: TaskEditPayload) => Promise<unknown>
  setTaskStatus: (taskId: string, status: TaskStatus) => Promise<unknown>
}

export function useApplyTaskActions({
  addonDataset: addonDatasetOverride,
  apiVersion = '2025-05-06',
  contentDataset: contentDatasetOverride,
  currentUserId,
  projectId: projectIdOverride,
  workspaceId: workspaceIdOverride,
  workspaceTitle: workspaceTitleOverride,
}: UseApplyTaskActionsOptions = {}): ApplyTaskActionsApi {
  const {addonDataset, contentDataset, projectId, workspaceId, workspaceTitle} =
    useResolvedAddonRuntime({
      addonDataset: addonDatasetOverride,
      contentDataset: contentDatasetOverride,
      projectId: projectIdOverride,
      workspaceId: workspaceIdOverride,
      workspaceTitle: workspaceTitleOverride,
    })
  const mutationClient = useAddonMutationClient({
    addonDataset,
    apiVersion,
    projectId,
  })

  const dispatch = useCallback(
    async (actionOrActions: TaskAction | TaskAction[]) => {
      const runtime = {
        addonDataset,
        contentDataset,
        currentUserId: currentUserId ?? 'unknown',
        projectId,
        workspaceId,
        workspaceTitle,
      }

      console.debug('[sdk-tasks/useApplyTaskActions] dispatch:start', {
        actions: Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions],
        runtime,
      })

      try {
        const result = await mutationClient.execute(actionOrActions)
        console.debug('[sdk-tasks/useApplyTaskActions] dispatch:success', {
          actions: Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions],
          result,
          runtime,
        })
        return result
      } catch (error) {
        console.error('[sdk-tasks/useApplyTaskActions] dispatch:failed', {
          actions: Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions],
          error,
          runtime,
        })
        throw error
      }
    },
    [
      addonDataset,
      contentDataset,
      currentUserId,
      mutationClient,
      projectId,
      workspaceId,
      workspaceTitle,
    ],
  )

  const createTask = useCallback(
    async ({taskId = crypto.randomUUID(), ...args}: CreateTaskArgs) => {
      const handle = createTaskHandle({
        addonDataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
        projectId: requireRuntimeValue(projectId, 'Project ID'),
        taskId,
      })

      return await dispatch(
        createTaskAction(handle, {
          ...args,
          authorId: currentUserId ?? 'unknown',
          contentDataset: requireRuntimeValue(contentDataset, 'Content dataset'),
          workspaceId,
          workspaceTitle,
        }),
      ).then(() => ({_id: handle.documentId}))
    },
    [addonDataset, contentDataset, currentUserId, dispatch, projectId, workspaceId, workspaceTitle],
  )

  const editTask = useCallback(
    async (taskId: string, payload: TaskEditPayload) =>
      await dispatch(
        editTaskAction(
          createTaskHandle({
            addonDataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
            projectId: requireRuntimeValue(projectId, 'Project ID'),
            taskId,
          }),
          payload,
        ),
      ),
    [addonDataset, dispatch, projectId],
  )

  const setTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) =>
      await dispatch(
        setTaskStatusAction(
          createTaskHandle({
            addonDataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
            projectId: requireRuntimeValue(projectId, 'Project ID'),
            taskId,
          }),
          status,
        ),
      ),
    [addonDataset, dispatch, projectId],
  )

  const deleteTask = useCallback(
    async (taskId: string) =>
      await dispatch(
        deleteTaskAction(
          createTaskHandle({
            addonDataset: requireRuntimeValue(addonDataset, 'Addon dataset'),
            projectId: requireRuntimeValue(projectId, 'Project ID'),
            taskId,
          }),
        ),
      ),
    [addonDataset, dispatch, projectId],
  )

  return useMemo(
    () =>
      Object.assign(dispatch, {
        createTask,
        deleteTask,
        editTask,
        setTaskStatus,
      }),
    [createTask, deleteTask, dispatch, editTask, setTaskStatus],
  ) as ApplyTaskActionsApi
}
