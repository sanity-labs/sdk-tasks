export interface TaskContext {
  notification?: {
    targetContentImageUrl: null | string
    targetContentTitle: null | string
    url: string
    workspaceTitle: string
  }
  payload?: Record<string, unknown>
  tool?: string
}

export type TaskStatus = 'closed' | 'open'

export interface TaskDocument {
  _createdAt: string
  _id: string
  _rev?: string
  _type: 'tasks.task'
  _updatedAt: string
  assignedTo?: string
  authorId: string
  context?: TaskContext
  createdByUser?: string
  description?: Array<{
    _key: string
    _type: 'block'
    children: Array<
      | {_key: string; _type: 'mention'; userId: string}
      | {_key?: string; _type: 'span'; marks?: string[]; text: string}
    >
    markDefs?: Array<{_key: string; _type: string; [key: string]: unknown}>
    style?: string
  }> | null
  dueBy?: string
  lastEditedAt?: string
  status: TaskStatus
  subscribers?: string[]
  target?: {
    document:
      | {
          _dataset: string
          _projectId: string
          _ref: string
          _type: 'crossDatasetReference'
          _weak: boolean
        }
      | {
          _ref: string
          _type: 'reference'
          _weak: boolean
        }
    documentType: string
    path?: {field: string}
  }
  title: string
}

export interface TaskEditPayload {
  assignedTo?: string
  description?: TaskDocument['description']
  dueBy?: string
  lastEditedAt?: string
  status?: TaskStatus
  subscribers?: string[]
  title?: string
}
