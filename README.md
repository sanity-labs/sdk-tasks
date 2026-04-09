# `@sanity-labs/sdk-tasks`

React hooks and action APIs for CRUD actions with Sanity tasks inside of a Sanity SDK app.

> This package owns task reads and writes. Task comments are intentionally not
> re-exported here; import those from `@sanity-labs/sdk-comments`.

## Installation

```bash
pnpm add @sanity-labs/sdk-addon-dataset-runtime @sanity-labs/sdk-tasks
```

## Quick Start

### Provider-Based Runtime

```tsx
import { AddonDatasetRuntimeProvider } from "@sanity-labs/sdk-addon-dataset-runtime";
import { useApplyTaskActions, useDocumentTasks } from "@sanity-labs/sdk-tasks";

function TasksPanel({ documentId }: { documentId: string }) {
  const { sortedTasks } = useDocumentTasks({ documentId });
  const applyTaskActions = useApplyTaskActions({
    currentUserId: "resource-user-1",
  });

  return (
    <button
      onClick={() =>
        applyTaskActions.createTask({
          documentId,
          documentType: "article",
          title: "Review homepage headline",
        })
      }
    >
      {sortedTasks.length} tasks
    </button>
  );
}

<AddonDatasetRuntimeProvider
  addonDataset="production-comments"
  contentDataset="production"
  projectId="myProjectId"
>
  <TasksPanel documentId="article-123" />
</AddonDatasetRuntimeProvider>;
```

### Direct Configuration

The runtime provider is recommended when multiple components share the same addon
runtime values, but it is not required. You can pass runtime values directly to
the hooks instead:

```ts
import { useApplyTaskActions, useDocumentTasks } from "@sanity-labs/sdk-tasks";

const tasks = useDocumentTasks({
  addonDataset: "production-comments",
  documentId: "article-123",
  projectId: "myProjectId",
});

const applyTaskActions = useApplyTaskActions({
  addonDataset: "production-comments",
  contentDataset: "production",
  currentUserId: "resource-user-1",
  projectId: "myProjectId",
});
```

`currentUserId` should be your app's resource-user identifier, not just any
arbitrary string. In an SDK app, you will usually derive it from the current
Sanity user plus the project user memberships exposed by `useUsers()`.

## Primary Exports

- `createTaskHandle()`
- `createTask()`
- `editTask()`
- `setTaskStatus()`
- `deleteTask()`
- `CreateTaskActionArgs`
- `TaskAction`
- `useTasks()`
- `useTaskProjection()`
- `useTask()`
- `useEditTask()`
- `useTasksByDocumentType()`
- `useDocumentTasks()`
- `useApplyTaskActions()`
- `TaskDocument`
- `TaskHandle`
- `TaskEditPayload`
- `TaskStatus`
- `TaskContext`
- `TasksByDocumentSummary`

## Canonical Read Hooks

The preferred SDK-shaped read path is:

- `useTasks()` for lightweight task handles
- `useTaskProjection()` for list or preview metadata
- `useTask()` for one full task document
- `useEditTask()` for scoped task editing

`useDocumentTasks()` and `useTasksByDocumentType()` remain available as compatibility and convenience helpers for document-scoped and grouped task views.

## Scoped Edit Hooks

`useEditTask()` mirrors the SDK edit-hook ergonomics for task documents while
keeping task writes scoped to the addon dataset.

```ts
import {useEditTask} from '@sanity-labs/sdk-tasks'

const editTaskTitle = useEditTask<string>({
  path: 'title',
  taskId: 'task-123',
})

await editTaskTitle('Review homepage headline (updated)')
```

Omit `path` to edit the full task document. The hook diffs top-level task
fields, ignores system keys such as `_id` / `_updatedAt`, stamps
`lastEditedAt`, and unsets the targeted path if you pass `undefined`.

## Action API

`useApplyTaskActions()` returns a callable dispatcher, analogous to
`useApplyDocumentActions()` in `@sanity/sdk-react`, with the existing
imperative helpers attached for convenience and migration.

Canonical usage:

```ts
import {
  createTask,
  createTaskHandle,
  useApplyTaskActions,
} from '@sanity-labs/sdk-tasks'

const applyTaskActions = useApplyTaskActions()

await applyTaskActions(
  createTask(
    createTaskHandle({
      addonDataset: 'production-comments',
      projectId: 'myProjectId',
      taskId: crypto.randomUUID(),
    }),
    {
      authorId: 'resource-user-1',
      contentDataset: 'production',
      documentId: 'article-123',
      documentType: 'article',
      title: 'Review homepage headline',
    },
  ),
)
```

For migration, the hook still exposes the existing imperative helpers:

- `createTask(args)`
- `editTask(taskId, payload)`
- `setTaskStatus(taskId, status)`
- `deleteTask(taskId)`

The dispatcher accepts either one action or an array of actions. The attached
helper methods build the action descriptors for you and then dispatch them.

## SDK Alignment

This package intentionally keeps the same handle-first, projection-first,
dispatcher-style shape as the Sanity SDK. Under the hood, task writes execute
direct live-edit client mutations instead of the SDK draft document action
pipeline, because tasks live in the addon dataset as live-edit records rather
than draftable content documents. That preserves the familiar SDK mental model
while keeping task persistence correct for addon documents.

This hook only covers task lifecycle actions. It does not create or mutate
comments on tasks.

## Task Comments

Comments attached to tasks are still comments-domain APIs. Use
`useTaskComments()` and `useApplyCommentActions()` from `@sanity-labs/sdk-comments`
when the thing you are reading or mutating is a comment.

If your task comments link back into a specific Studio workspace, pass
`workspaceId` / `workspaceTitle` through `AddonDatasetRuntimeProvider` or direct
configuration on the comments hook side. Those values are optional and mainly
matter for workspace-specific Studio URLs.

## What Is Not Included

This package intentionally does not ship:

- task comments hooks
- comment action hooks
- task summary UI
- assign-picker UI
