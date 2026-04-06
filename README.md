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

- `useDocumentTasks()`
- `useApplyTaskActions()`
- `TaskDocument`
- `TaskEditPayload`
- `TaskStatus`
- `TaskContext`

## Action API

`useApplyTaskActions()` returns the task-domain write API:

- `createTask(args)`
- `editTask(taskId, payload)`
- `setTaskStatus(taskId, status)`
- `deleteTask(taskId)`

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
