import type {DocumentHandle} from '@sanity/sdk-react'

export type TaskHandle<TDataset extends string = string, TProjectId extends string = string> =
  DocumentHandle<'tasks.task', TDataset, TProjectId>

interface CreateTaskHandleArgs<TDataset extends string = string, TProjectId extends string = string> {
  addonDataset?: TDataset
  projectId?: TProjectId
  taskId: string
}

interface TaskHandleLookupArgs<TDataset extends string = string, TProjectId extends string = string> {
  addonDataset?: TDataset
  projectId?: TProjectId
  taskId: string
}

export function normalizeTaskId(taskId: string) {
  return taskId.replace(/^drafts\./, '')
}

export function createTaskHandle<TDataset extends string = string, TProjectId extends string = string>({
  addonDataset,
  projectId,
  taskId,
}: CreateTaskHandleArgs<TDataset, TProjectId>): TaskHandle<TDataset, TProjectId> {
  return {
    dataset: addonDataset,
    documentId: normalizeTaskId(taskId),
    documentType: 'tasks.task',
    liveEdit: true,
    projectId,
  }
}

export function isTaskHandle(
  value: TaskHandle | TaskHandleLookupArgs,
): value is TaskHandle<string, string> {
  return (
    typeof (value as TaskHandle).documentId === 'string' &&
    (value as TaskHandle).documentType === 'tasks.task'
  )
}

export function resolveTaskHandle(
  value: TaskHandle | TaskHandleLookupArgs,
  fallback?: {addonDataset?: string; projectId?: string},
): TaskHandle<string, string> {
  if (isTaskHandle(value)) {
    return {
      ...value,
      liveEdit: value.liveEdit ?? true,
    }
  }

  return createTaskHandle({
    addonDataset: value.addonDataset ?? fallback?.addonDataset,
    projectId: value.projectId ?? fallback?.projectId,
    taskId: value.taskId,
  })
}
