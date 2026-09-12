"use client"

import { useCallback, useMemo, useState, type ComponentProps } from "react"
import { Badge } from "@/components/reui/badge"
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import {
  useTable,
  type ColumnVisibilityState,
  type ExpandedState,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createRoadmapColumns, type RoadmapTaskAction } from "./columns"
import {
  ROADMAP_CATEGORIES,
  ROADMAP_TASKS,
  TASK_SIGNAL_OPTIONS,
  type RoadmapCategory,
  type RoadmapSignal,
  type RoadmapTask,
  type TaskCategoryRow,
  type TaskItemRow,
  type TaskTableRow,
} from "./data"
import { IconSearch, IconX, IconBell, IconAdjustmentsHorizontal, IconCheck, IconPlus } from "@tabler/icons-react"

type TableDensity = "compact" | "comfortable"

type RoadmapColumnKey =
  | "assignee"
  | "label"
  | "dueDate"
  | "completion"
  | "signal"

const TABLE_DENSITY_OPTIONS: { value: TableDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
]

const DISPLAY_COLUMN_OPTIONS: { key: RoadmapColumnKey; label: string }[] = [
  { key: "assignee", label: "Owner" },
  { key: "label", label: "Label" },
  { key: "dueDate", label: "Due date" },
  { key: "completion", label: "Completion" },
  { key: "signal", label: "Signal" },
]

function getRoadmapSearchBlob(task: RoadmapTask) {
  return [
    task.taskKey,
    task.title,
    task.context,
    task.type,
    task.label,
    task.priority,
    task.signal,
    task.assignee?.name,
    task.assignee?.role,
    task.assignees.map((owner) => owner.name).join(" "),
    task.assignees.map((owner) => owner.role).join(" "),
    task.completionRate === null ? "not started" : `${task.completionRate}%`,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function buildRoadmapRows(tasks: RoadmapTask[]): TaskCategoryRow[] {
  return ROADMAP_CATEGORIES.map((category) => {
    const subRows: TaskItemRow[] = tasks
      .filter((task) => task.categoryId === category.id)
      .map((task) => ({
        kind: "task",
        id: task.id,
        category,
        task,
      }))

    const row: TaskCategoryRow = {
      kind: "category",
      id: category.id,
      category,
      subRows,
    }

    return row
  }).filter((row) => (row.subRows?.length ?? 0) > 0)
}

function getExpandedCategoryState(rows: TaskCategoryRow[]): ExpandedState {
  return rows.reduce<Record<string, boolean>>((expanded, row) => {
    expanded[row.id] = true
    return expanded
  }, {})
}

function isExpanded(expanded: ExpandedState, rowId: string) {
  if (expanded === true) return true
  return expanded[rowId] === true
}

function getCategoryTaskCount(category: RoadmapCategory, tasks: RoadmapTask[]) {
  return tasks.filter((task) => task.categoryId === category.id).length
}

function getRoadmapStatusCount(tasks: RoadmapTask[], signal: RoadmapSignal) {
  return tasks.filter((task) => task.signal === signal).length
}

function getUnassignedTaskCount(tasks: RoadmapTask[]) {
  return tasks.filter((task) => !task.assignee && task.assignees.length === 0)
    .length
}

function RoadmapMetric({
  label,
  value,
  variant = "secondary",
}: {
  label: string
  value: number
  variant?: ComponentProps<typeof Badge>["variant"]
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:border-l sm:pl-3 sm:first:border-l-0 sm:first:pl-0">
      <span className="text-muted-foreground truncate text-xs font-medium">
        {label}
      </span>
      <Badge variant={variant}>{value}</Badge>
    </div>
  )
}

export function GroupedRoadmapDataGridView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSignals, setSelectedSignals] = useState<RoadmapSignal[]>([])
  const [showContext, setShowContext] = useState(false)
  const [tableDensity, setTableDensity] = useState<TableDensity>("compact")
  const [visibleColumns, setVisibleColumns] = useState<
    Record<RoadmapColumnKey, boolean>
  >({
    assignee: true,
    label: true,
    dueDate: true,
    completion: true,
    signal: true,
  })
  const [expandedRows, setExpandedRows] = useState<ExpandedState>(() =>
    getExpandedCategoryState(buildRoadmapRows(ROADMAP_TASKS))
  )

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return ROADMAP_TASKS.filter((task) => {
      if (
        normalizedQuery.length > 0 &&
        !getRoadmapSearchBlob(task).includes(normalizedQuery)
      ) {
        return false
      }

      if (
        selectedSignals.length > 0 &&
        !selectedSignals.includes(task.signal)
      ) {
        return false
      }

      return true
    })
  }, [searchQuery, selectedSignals])

  const groupedRows = useMemo(
    () => buildRoadmapRows(filteredTasks),
    [filteredTasks]
  )

  const allGroupsExpanded =
    groupedRows.length > 0 &&
    groupedRows.every((row) => isExpanded(expandedRows, row.id))

  const activeFilterCount = selectedSignals.length
  const blockedTaskCount = getRoadmapStatusCount(filteredTasks, "Blocked")
  const atRiskTaskCount = getRoadmapStatusCount(filteredTasks, "At risk")
  const unassignedTaskCount = getUnassignedTaskCount(filteredTasks)

  const columnVisibility = useMemo<ColumnVisibilityState>(
    () => ({
      assignee: visibleColumns.assignee,
      label: visibleColumns.label,
      dueDate: visibleColumns.dueDate,
      completion: visibleColumns.completion,
      signal: visibleColumns.signal,
    }),
    [visibleColumns]
  )

  const handleSignalToggle = useCallback(
    (signal: RoadmapSignal, checked: boolean) => {
      setSelectedSignals((current) => {
        if (checked) {
          return current.includes(signal) ? current : [...current, signal]
        }

        return current.filter((item) => item !== signal)
      })
    },
    []
  )

  const handleToggleGroups = useCallback(() => {
    setExpandedRows(
      allGroupsExpanded ? {} : getExpandedCategoryState(groupedRows)
    )
  }, [allGroupsExpanded, groupedRows])

  const handleTaskAction = useCallback(
    (action: RoadmapTaskAction, task: RoadmapTask) => {
      if (action === "open") {
        toast.info("Open task", {
          description: `${task.taskKey} / ${task.title}`,
        })
        return
      }

      if (action === "copy") {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          void navigator.clipboard.writeText(task.taskKey)
        }

        toast.success("Task key copied", {
          description: task.taskKey,
        })
        return
      }

      toast.message("Update task status", {
        description: `Connect ${task.taskKey} to your status transition flow.`,
      })
    },
    []
  )

  const handleNewTask = useCallback(() => {
    toast.success("New task", {
      description:
        "Connect this action to your task composer or roadmap intake form.",
    })
  }, [])

  const columns = useMemo(
    () =>
      createRoadmapColumns({
        showContext,
        onAction: handleTaskAction,
      }),
    [handleTaskAction, showContext]
  )

  const table = useTable({
    features: dataGridFeatures,
    // No pagination row model on v8, so every row rendered. The shared
    // bundle registers one, and manualPagination is v9's way to say the
    // data is already the page - it keeps the pagination APIs while
    // leaving the rows unsliced.
    manualPagination: true,
    data: groupedRows,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) =>
      row.kind === "category"
        ? (row.subRows as TaskTableRow[] | undefined)
        : undefined,
    getRowCanExpand: (row) =>
      row.original.kind === "category" && Boolean(row.original.subRows?.length),
    state: {
      columnVisibility,
      expanded: expandedRows,
    },
    onExpandedChange: setExpandedRows,
  })

  function toggleColumn(key: RoadmapColumnKey, checked: boolean) {
    setVisibleColumns((current) => ({
      ...current,
      [key]: checked,
    }))
  }

  function clearFilters() {
    setSearchQuery("")
    setSelectedSignals([])
  }

  return (
    <DataGrid
      table={table}
      recordCount={filteredTasks.length}
      emptyMessage="No roadmap tasks match this view."
      tableLayout={{
        dense: tableDensity === "compact",
        rowBorder: true,
        headerSticky: false,
        columnsVisibility: false,
        columnsResizable: false,
        columnsMovable: false,
        width: "fixed",
      }}
      tableClassNames={{
        body: "[&>tr:has(>td:only-child:empty)]:hidden",
        bodyRow: cn(
          "group/roadmap-row [&>td]:h-9 [&:has([data-roadmap-row=category])>td]:h-11 [&:has([data-roadmap-row=category])>td]:bg-muted/45 [&:has([data-roadmap-row=category])>td]:shadow-none [&:has([data-roadmap-row=category])>td]:hover:bg-muted/45",
          showContext && "[&>td]:h-12"
        ),
        edgeCell: "first:ps-3 last:pe-3 lg:first:ps-4 lg:last:pe-4",
      }}
    >
      <section className="flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Roadmap Queue
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Track work by stage, owner, and signal.
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <RoadmapMetric label="Tasks" value={filteredTasks.length} />
            <RoadmapMetric
              label="Blocked"
              value={blockedTaskCount}
              variant={blockedTaskCount > 0 ? "destructive-light" : "secondary"}
            />
            <RoadmapMetric
              label="At risk"
              value={atRiskTaskCount}
              variant={atRiskTaskCount > 0 ? "warning-light" : "secondary"}
            />
            <RoadmapMetric label="Unassigned" value={unassignedTaskCount} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-muted/20 flex flex-col gap-3 border-y px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <InputGroup className="w-full min-w-0 lg:max-w-sm">
            <InputGroupAddon align="inline-start">
              <IconSearch className="text-muted-foreground size-4" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search roadmap..."
              aria-label="Search roadmap tasks"
            />
            {searchQuery.length > 0 ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                >
                  <IconX className="size-4" aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5 lg:justify-end">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                render={
                  <Button type="button" variant="outline">
                    <IconBell data-icon="inline-start" aria-hidden="true" />
                    Signals
                    {activeFilterCount > 0 ? (
                      <Badge variant="secondary">{activeFilterCount}</Badge>
                    ) : null}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Signal</DropdownMenuLabel>
                  {TASK_SIGNAL_OPTIONS.map((signal) => (
                    <DropdownMenuCheckboxItem
                      key={signal}
                      checked={selectedSignals.includes(signal)}
                      closeOnClick={false}
                      onCheckedChange={(checked) =>
                        handleSignalToggle(signal, checked === true)
                      }
                    >
                      {signal}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                {activeFilterCount > 0 ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      closeOnClick={false}
                      onClick={() => setSelectedSignals([])}
                    >
                      Reset signals
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger
                render={
                  <Button type="button" variant="outline">
                    <IconAdjustmentsHorizontal data-icon="inline-start" aria-hidden="true" />
                    Display
                  </Button>
                }
              />
              <PopoverContent align="end" className="w-[300px] p-0">
                <FieldGroup className="gap-3 px-3.5 py-3">
                  <div className="flex flex-col gap-2">
                    <div className="text-muted-foreground text-xs font-medium">
                      Table
                    </div>
                    <div className="flex flex-col">
                      <Field
                        orientation="horizontal"
                        className="min-h-9 items-center justify-between gap-3"
                      >
                        <FieldLabel className="text-sm font-normal">
                          Density
                        </FieldLabel>
                        <Select
                          value={tableDensity}
                          onValueChange={(value) =>
                            setTableDensity(value as TableDensity)
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            className="w-[132px] shrink-0"
                          >
                            <SelectValue>
                              {
                                TABLE_DENSITY_OPTIONS.find(
                                  (option) => option.value === tableDensity
                                )?.label
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectGroup>
                              {TABLE_DENSITY_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field
                        orientation="horizontal"
                        className="min-h-9 items-center justify-between gap-3"
                      >
                        <FieldLabel className="text-sm font-normal">
                          Context line
                        </FieldLabel>
                        <Switch
                          size="sm"
                          checked={showContext}
                          onCheckedChange={setShowContext}
                          aria-label="Toggle task context line"
                        />
                      </Field>
                    </div>
                  </div>

                  <FieldSeparator className="-mx-3.5" />

                  <div className="flex flex-col gap-2">
                    <div className="text-muted-foreground text-xs font-medium">
                      Display properties
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DISPLAY_COLUMN_OPTIONS.map((option) => {
                        const active = visibleColumns[option.key]

                        return (
                          <Button
                            key={option.key}
                            type="button"
                            size="sm"
                            variant={active ? "secondary" : "outline"}
                            className={cn(
                              "rounded-full",
                              active && "border-foreground/10"
                            )}
                            aria-pressed={active}
                            onClick={() => toggleColumn(option.key, !active)}
                          >
                            {active ? (
                              <IconCheck className="size-4" aria-hidden="true" />
                            ) : null}
                            {option.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </FieldGroup>
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="outline"
              onClick={handleToggleGroups}
            >
              {allGroupsExpanded ? "Collapse groups" : "Expand groups"}
            </Button>

            {searchQuery.length > 0 || selectedSignals.length > 0 ? (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            ) : null}

            <Button type="button" onClick={handleNewTask}>
              <IconPlus data-icon="inline-start" aria-hidden="true" />
              New task
            </Button>
          </div>
        </div>

        {/* Content */}
        <DataGridContainer className="border-b">
          <DataGridScrollArea>
            <DataGridTable renderHeader={false} />
          </DataGridScrollArea>
        </DataGridContainer>

        {/* Footer */}
        <div className="text-muted-foreground mt-3 flex flex-col gap-2 text-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-foreground font-medium">Stage Mix</span>
            {ROADMAP_CATEGORIES.map((category) => (
              <Badge key={category.id} variant="outline">
                {category.label}:{" "}
                {getCategoryTaskCount(category, filteredTasks)}
              </Badge>
            ))}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
            <span className="text-foreground font-medium">
              {filteredTasks.length} visible
            </span>
            <span className="text-muted-foreground">
              of {ROADMAP_TASKS.length} tasks
            </span>
            <Badge
              variant={
                activeFilterCount > 0 || searchQuery.length > 0
                  ? "info-light"
                  : "secondary"
              }
            >
              {activeFilterCount > 0 || searchQuery.length > 0
                ? "Filtered"
                : "All tasks"}
            </Badge>
          </div>
        </div>
      </section>
    </DataGrid>
  )
}