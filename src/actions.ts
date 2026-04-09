import type {TaskHandle} from './handles.js'
import type {AddonCreateMutation, AddonDeleteMutation, AddonPatchOperation} from './runtime.js'
import type {TaskDocument, TaskEditPayload, TaskStatus} from './types.js'

export interface CreateTaskActionArgs {
  assignedTo?: string
  authorId: string
  contentDataset: string
  description?: TaskDocument['description']
  documentId: string
  documentType: string
  dueBy?: string
  subscribers?: string[]
  title: string
  workspaceId?: string
  workspaceTitle?: string
}

type TaskCreateDocument = Omit<TaskDocument, '_createdAt' | '_rev' | '_updatedAt'>

interface TaskActionBase {
  handle: TaskHandle
}

interface CreateTaskAction extends AddonCreateMutation<TaskCreateDocument>, TaskActionBase {
  actionType: 'createTask'
}

interface DeleteTaskAction extends AddonDeleteMutation, TaskActionBase {
  actionType: 'deleteTask'
}

interface PatchTaskAction extends TaskActionBase {
  actionType: 'patchTask'
  documentId: string
  mutationType: 'patch'
  operations: AddonPatchOperation[]
}

export function createTask(handle: TaskHandle, args: CreateTaskActionArgs) {
  const now = new Date().toISOString()

  return {
    actionType: 'createTask' as const,
    document: {
      _id: handle.documentId,
      _type: 'tasks.task' as const,
      authorId: args.authorId,
      context:
        args.workspaceId || args.workspaceTitle
          ? {
              payload: {workspace: args.workspaceId ?? ''},
              tool: 'sanetti',
            }
          : undefined,
      createdByUser: now,
      description: args.description,
      status: 'open' as const,
      subscribers:
        args.subscribers ?? (args.assignedTo ? [args.authorId, args.assignedTo] : [args.authorId]),
      target: {
        document: {
          _dataset: args.contentDataset,
          _projectId: handle.projectId ?? '',
          _ref: args.documentId.replace(/^drafts\./, ''),
          _type: 'crossDatasetReference' as const,
          _weak: true,
        },
        documentType: args.documentType,
      },
      title: args.title,
      ...(args.assignedTo ? {assignedTo: args.assignedTo} : {}),
      ...(args.dueBy ? {dueBy: args.dueBy} : {}),
    },
    handle,
    mutationType: 'create' as const,
  } satisfies CreateTaskAction
}

export function editTask(handle: TaskHandle, payload: TaskEditPayload) {
  return patchTask(handle, [{type: 'set', value: {...payload}}], {stampLastEditedAt: true})
}

export function patchTask(
  handle: TaskHandle,
  operations: AddonPatchOperation[],
  {stampLastEditedAt = false}: {stampLastEditedAt?: boolean} = {},
) {
  return {
    actionType: 'patchTask' as const,
    documentId: handle.documentId,
    handle,
    mutationType: 'patch' as const,
    operations: stampLastEditedAt
      ? [
          ...operations,
          {
            type: 'set',
            value: {lastEditedAt: new Date().toISOString()},
          },
        ]
      : operations,
  } satisfies PatchTaskAction
}

export function setTaskStatus(handle: TaskHandle, status: TaskStatus) {
  return patchTask(
    handle,
    [
      {
        type: 'set',
        value: {status},
      },
    ],
    {
      stampLastEditedAt: true,
    },
  )
}

export function deleteTask(handle: TaskHandle) {
  return {
    actionType: 'deleteTask' as const,
    documentId: handle.documentId,
    handle,
    mutationType: 'delete' as const,
  } satisfies DeleteTaskAction
}

export type TaskAction = CreateTaskAction | DeleteTaskAction | PatchTaskAction

export function setTaskFields(handle: TaskHandle, fields: TaskEditPayload) {
  return patchTask(
    handle,
    [
      {
        type: 'set',
        value: {...fields},
      },
    ],
    {
      stampLastEditedAt: true,
    },
  )
}

export function unsetTaskFields(handle: TaskHandle, paths: string[]) {
  return patchTask(
    handle,
    [
      {
        paths,
        type: 'unset',
      },
    ],
    {
      stampLastEditedAt: true,
    },
  )
}
