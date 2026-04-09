export const TASKS_BY_DOCUMENT_QUERY = `*[
  _type == "tasks.task"
  && target.document._ref == $documentId
]{
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  status,
  authorId,
  assignedTo,
  dueBy,
  description,
  context,
  subscribers,
  lastEditedAt,
  createdByUser,
  target
} | order(_createdAt desc)`

export const TASKS_BY_DOCUMENT_TYPE_QUERY = `*[
  _type == "tasks.task"
  && target.documentType == $documentType
]{
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  status,
  authorId,
  assignedTo,
  dueBy,
  description,
  context,
  subscribers,
  lastEditedAt,
  createdByUser,
  target
} | order(_createdAt desc)`
