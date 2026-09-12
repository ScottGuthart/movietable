"use client"

// This file keeps "use no memo": its own cell/header templates read state
// through builder calls on a stable row/column, which React Compiler cannot
// see. The primitive wraps its own such reads in TanStack's Subscribe; a
// consumer template has to opt out or subscribe itself.
"use no memo"

import { memo, type ComponentProps } from "react"
import { Badge } from "@/components/reui/badge"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { type ColumnDef } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Item, ItemMedia } from "@/components/ui/item"
import {
  TASK_TYPE_DETAILS,
  type RoadmapCategoryId,
  type RoadmapLabel,
  type RoadmapOwner,
  type RoadmapSignal,
  type RoadmapTask,
  type TaskCategoryRow,
  type TaskItemRow,
  type TaskTableRow,
} from "./data"
import { IconChevronRight, IconArrowRight, IconCalendar, IconDots, IconEye, IconCopy, IconPencil } from "@tabler/icons-react"

export type RoadmapTaskAction = "open" | "copy" | "move"

const signalVariant: Record<
  RoadmapSignal,
  ComponentProps<typeof Badge>["variant"]
> = {
  Blocked: "destructive-light",
  "At risk": "warning-light",
  "On track": "success-light",
  Queued: "secondary",
  Done: "success-light",
}

const labelDotClass: Record<RoadmapLabel, string> = {
  Adoption: "bg-primary",
  Revenue: "bg-success",
  Knowledge: "bg-info",
  "AI Quality": "bg-violet-500 dark:bg-violet-400",
  Access: "bg-destructive",
  Messaging: "bg-warning",
  Mobile: "bg-info",
  Insights: "bg-invert",
  Reliability: "bg-success",
  Workflow: "bg-primary",
}

const taskTypeTileClass = "bg-background border-border text-foreground"

const categoryStageDotClass: Record<RoadmapCategoryId, string> = {
  backlog: "bg-muted-foreground/70",
  todo: "bg-yellow-500 dark:bg-yellow-400",
  "in-progress": "bg-sky-500",
  done: "bg-success",
}

function isTaskRow(row: TaskTableRow): row is TaskItemRow {
  return row.kind === "task"
}

function getCategoryTasks(row: TaskCategoryRow) {
  return row.subRows?.map((item) => item.task) ?? []
}

function getCategorySignal(tasks: RoadmapTask[]): RoadmapSignal {
  if (tasks.some((task) => task.signal === "Blocked")) return "Blocked"
  if (tasks.some((task) => task.signal === "At risk")) return "At risk"
  if (tasks.length > 0 && tasks.every((task) => task.signal === "Done")) {
    return "Done"
  }
  if (tasks.length > 0 && tasks.every((task) => task.signal === "Queued")) {
    return "Queued"
  }

  return "On track"
}

function getNextDueTask(tasks: RoadmapTask[]) {
  return tasks.reduce<RoadmapTask | undefined>((next, task) => {
    if (!next || task.dueAt.localeCompare(next.dueAt) < 0) return task
    return next
  }, undefined)
}

function getTaskOwners(task: RoadmapTask) {
  if (task.assignees.length > 0) return task.assignees
  return task.assignee ? [task.assignee] : []
}

function completionRingColor(rate: number) {
  if (rate >= 75) return "text-emerald-500"
  if (rate >= 40) return "text-amber-500"
  return "text-rose-500"
}

const OwnerAvatar = memo(function OwnerAvatar({
  owner,
  className,
}: {
  owner: RoadmapOwner | null
  className?: string
}) {
  return (
    <Avatar className={cn("size-5 shrink-0", className)}>
      {owner?.avatarSrc ? (
        <AvatarImage src={owner.avatarSrc} alt={owner.name} />
      ) : null}
      <AvatarFallback className="text-[9px] font-medium">
        {owner?.initials ?? "--"}
      </AvatarFallback>
    </Avatar>
  )
})

function RoadmapLabelBadge({ label }: { label: RoadmapLabel }) {
  return (
    <Badge variant="outline" className="bg-background gap-1.5">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", labelDotClass[label])}
        aria-hidden="true"
      />
      {label}
    </Badge>
  )
}

function RoadmapSignalBadge({ signal }: { signal: RoadmapSignal }) {
  return <Badge variant={signalVariant[signal]}>{signal}</Badge>
}

function CategoryStageMark({ categoryId }: { categoryId: RoadmapCategoryId }) {
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full",
        categoryStageDotClass[categoryId]
      )}
      aria-hidden="true"
    />
  )
}

function CategoryExpandButton({
  label,
  expanded,
  onToggle,
}: {
  label: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
      aria-expanded={expanded}
      className="text-muted-foreground hover:text-foreground size-6 shrink-0 p-0 shadow-none"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
    >
      <IconChevronRight className={cn(
                    "size-3.5 shrink-0 transition-transform duration-150",
                    expanded && "rotate-90"
                  )} aria-hidden="true" />
    </Button>
  )
}

function CategoryTaskCell({
  row,
  expanded,
  onToggle,
}: {
  row: TaskCategoryRow
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      data-roadmap-row="category"
      className="flex min-w-0 items-center gap-1.5"
    >
      <CategoryExpandButton
        label={row.category.label}
        expanded={expanded}
        onToggle={onToggle}
      />
      <CategoryStageMark categoryId={row.category.id} />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-foreground shrink-0 truncate text-sm font-medium">
          {row.category.label}
        </span>
        <Badge variant="outline" className="shrink-0">
          {row.subRows?.length ?? 0}
        </Badge>
      </div>
    </div>
  )
}

function TaskTypeIcon({ task }: { task: RoadmapTask }) {
  return (
    <Item
      render={<span />}
      className={cn(
        "p-0",
        "flex size-7 shrink-0 items-center justify-center border [&_svg]:opacity-95",
        taskTypeTileClass
      )}
    >
      <ItemMedia variant="icon" className="size-auto">
        {TASK_TYPE_DETAILS[task.type].icon}
      </ItemMedia>
    </Item>
  )
}

function TaskTitleAffordance({ title }: { title: string }) {
  return (
    <span className="group/task-title flex max-w-full min-w-0 items-center gap-1">
      <span
        data-slot="roadmap-task-title"
        className="hover:text-primary text-foreground min-w-0 flex-1 cursor-pointer truncate py-0.25 transition-colors"
        title={title}
      >
        {title}
      </span>
      <IconArrowRight className="size-3 shrink-0 -translate-x-1 opacity-0 transition-[transform,opacity] group-hover/task-title:translate-x-0 group-hover/task-title:opacity-100" aria-hidden="true" />
    </span>
  )
}

function TaskTitleCell({
  task,
  showContext,
}: {
  task: RoadmapTask
  showContext: boolean
}) {
  return (
    <div
      data-roadmap-row="task"
      className="flex min-w-0 items-center gap-3 ps-8"
    >
      <TaskTypeIcon task={task} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="min-w-0 text-sm leading-5 font-medium">
          <TaskTitleAffordance title={task.title} />
        </div>
        {showContext ? (
          <p className="text-muted-foreground truncate text-xs leading-4">
            {task.context}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function WorkItemCell({
  row,
  expanded,
  onToggle,
  showContext,
}: {
  row: TaskTableRow
  expanded: boolean
  onToggle: () => void
  showContext: boolean
}) {
  if (isTaskRow(row)) {
    return <TaskTitleCell task={row.task} showContext={showContext} />
  }

  return <CategoryTaskCell row={row} expanded={expanded} onToggle={onToggle} />
}

function AssigneeCell({ task }: { task: RoadmapTask }) {
  const owners = getTaskOwners(task)
  const visibleOwners = owners.slice(0, 3)
  const overflowCount = Math.max(0, owners.length - visibleOwners.length)

  if (owners.length === 0) {
    return (
      <div className="flex min-w-0 items-center justify-end">
        <OwnerAvatar owner={null} />
        <span className="sr-only">Unassigned owner</span>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 items-center justify-end">
      <AvatarGroup
        aria-label={`Assigned owners for ${task.taskKey}`}
        className="-space-x-1"
      >
        {visibleOwners.map((owner) => (
          <OwnerAvatar
            key={owner.id}
            owner={owner}
            className="ring-background ring-2"
          />
        ))}
        {overflowCount > 0 ? (
          <AvatarGroupCount className="bg-background size-5 border text-[9px] tabular-nums">
            +{overflowCount}
          </AvatarGroupCount>
        ) : null}
      </AvatarGroup>
      <span className="sr-only">
        {owners.map((owner) => owner.name).join(",")}
      </span>
    </div>
  )
}

function DueDateCell({ task }: { task: RoadmapTask }) {
  return (
    <Badge variant="outline" className="bg-background gap-1.5 font-normal">
      <IconCalendar className="text-muted-foreground size-3.5" aria-hidden="true" />
      <span className="tabular-nums">{task.dueLabel}</span>
    </Badge>
  )
}

function CompletionCell({ task }: { task: RoadmapTask }) {
  if (task.completionRate === null) {
    return (
      <div className="flex justify-end">
        <span className="text-muted-foreground text-sm tabular-nums">-</span>
      </div>
    )
  }

  const rate = task.completionRate
  const radius = 9
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (rate / 100) * circumference

  return (
    <div
      className="flex items-center justify-end gap-2"
      aria-label={`${rate}% complete`}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn("size-5 shrink-0", completionRingColor(rate))}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          className="stroke-border"
          strokeWidth="2.5"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          className="stroke-current"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 12 12)"
        />
      </svg>
      <span className="text-foreground text-sm tabular-nums">{rate}%</span>
    </div>
  )
}

function CategorySummaryCell({ row }: { row: TaskCategoryRow }) {
  return (
    <div className="relative h-4 min-w-0">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-0 w-80 max-w-[calc(100vw-8rem)] -translate-y-1/2 truncate text-right text-sm leading-4">
        {row.category.summary}
      </span>
    </div>
  )
}

function TaskActionsCell({
  task,
  onAction,
}: {
  task: RoadmapTask
  onAction: (action: RoadmapTaskAction, task: RoadmapTask) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={`Actions for ${task.taskKey}`}
          />
        }
      >
        <IconDots aria-hidden="true" />
      </DropdownMenuTrigger>
      {/* Content */}
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAction("open", task)}>
            <IconEye aria-hidden="true" />
            Open task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("copy", task)}>
            <IconCopy aria-hidden="true" />
            Copy key
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction("move", task)}>
            <IconPencil aria-hidden="true" />
            Update status
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function createRoadmapColumns({
  showContext,
  onAction,
}: {
  showContext: boolean
  onAction: (action: RoadmapTaskAction, task: RoadmapTask) => void
}): ColumnDef<DataGridFeatures, TaskTableRow>[] {
  return [
    {
      accessorFn: (row) =>
        isTaskRow(row) ? row.task.title : row.category.label,
      id: "task",
      header: ({ column }) => (
        <DataGridColumnHeader title="Work item" column={column} />
      ),
      cell: ({ row }) => (
        <WorkItemCell
          row={row.original}
          expanded={row.getIsExpanded()}
          onToggle={row.getToggleExpandedHandler()}
          showContext={showContext}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      minSize: 300,
      meta: {
        headerTitle: "Work item",
        autoSize: true,
      },
    },
    {
      accessorFn: (row) =>
        isTaskRow(row)
          ? getTaskOwners(row.task)
              .map((owner) => owner.name)
              .join(",") || "Unassigned"
          : row.category.focus,
      id: "assignee",
      header: ({ column }) => (
        <DataGridColumnHeader title="Owner" column={column} />
      ),
      cell: ({ row }) =>
        isTaskRow(row.original) ? (
          <AssigneeCell task={row.original.task} />
        ) : (
          <span className="sr-only">{row.original.category.focus}</span>
        ),
      size: 120,
      enableSorting: false,
      meta: {
        headerTitle: "Owner",
      },
    },
    {
      accessorFn: (row) =>
        isTaskRow(row) ? row.task.label : row.category.focus,
      id: "label",
      header: ({ column }) => (
        <DataGridColumnHeader title="Label" column={column} />
      ),
      cell: ({ row }) =>
        isTaskRow(row.original) ? (
          <div className="flex justify-end">
            <RoadmapLabelBadge label={row.original.task.label} />
          </div>
        ) : (
          <span className="sr-only">{row.original.category.focus}</span>
        ),
      size: 96,
      enableSorting: false,
      meta: {
        headerTitle: "Label",
      },
    },
    {
      accessorFn: (row) =>
        isTaskRow(row)
          ? row.task.dueAt
          : (getNextDueTask(getCategoryTasks(row))?.dueAt ?? ""),
      id: "dueDate",
      header: ({ column }) => (
        <DataGridColumnHeader title="Due" column={column} />
      ),
      cell: ({ row }) => {
        if (isTaskRow(row.original)) {
          return (
            <div className="flex justify-end">
              <DueDateCell task={row.original.task} />
            </div>
          )
        }

        return (
          <span className="sr-only">
            Next {getNextDueTask(getCategoryTasks(row.original))?.dueLabel}
          </span>
        )
      },
      size: 92,
      enableSorting: false,
      meta: {
        headerTitle: "Due",
      },
    },
    {
      accessorFn: (row) =>
        isTaskRow(row)
          ? (row.task.completionRate ?? -1)
          : Math.round(
              getCategoryTasks(row).reduce(
                (sum, task) => sum + (task.completionRate ?? 0),
                0
              ) / Math.max(getCategoryTasks(row).length, 1)
            ),
      id: "completion",
      header: ({ column }) => (
        <DataGridColumnHeader title="Completion" column={column} />
      ),
      cell: ({ row }) => {
        if (isTaskRow(row.original)) {
          return <CompletionCell task={row.original.task} />
        }

        return null
      },
      size: 84,
      enableSorting: false,
      meta: {
        headerTitle: "Completion",
      },
    },
    {
      accessorFn: (row) =>
        isTaskRow(row)
          ? row.task.signal
          : getCategorySignal(getCategoryTasks(row)),
      id: "signal",
      header: ({ column }) => (
        <DataGridColumnHeader title="Signal" column={column} />
      ),
      cell: ({ row }) =>
        isTaskRow(row.original) ? (
          <div className="flex justify-end">
            <RoadmapSignalBadge signal={row.original.task.signal} />
          </div>
        ) : (
          <span className="sr-only">
            {getCategorySignal(getCategoryTasks(row.original))}
          </span>
        ),
      size: 80,
      enableSorting: false,
      meta: {
        headerTitle: "Signal",
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        isTaskRow(row.original) ? (
          <div className="flex justify-end">
            <TaskActionsCell task={row.original.task} onAction={onAction} />
          </div>
        ) : (
          <CategorySummaryCell row={row.original} />
        ),
      size: 60,
      enableHiding: false,
      enableSorting: false,
    },
  ]
}