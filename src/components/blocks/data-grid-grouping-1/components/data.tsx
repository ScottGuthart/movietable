import { type ReactNode } from "react"
import { IconSparkles, IconCreditCard, IconBook, IconRobot, IconShieldCheck, IconBell, IconDeviceMobile, IconDatabase } from "@tabler/icons-react"

export type RoadmapCategoryId = "backlog" | "todo" | "in-progress" | "done"

export type RoadmapTaskType =
  | "Onboarding"
  | "Billing"
  | "Knowledge"
  | "Assistant"
  | "Access"
  | "Notifications"
  | "Mobile"
  | "Data"

export type RoadmapPriority = "Urgent" | "High" | "Medium" | "Low"

export type RoadmapSignal =
  | "Blocked"
  | "At risk"
  | "On track"
  | "Queued"
  | "Done"

export type RoadmapLabel =
  | "Adoption"
  | "Revenue"
  | "Knowledge"
  | "AI Quality"
  | "Access"
  | "Messaging"
  | "Mobile"
  | "Insights"
  | "Reliability"
  | "Workflow"

export interface RoadmapOwner {
  id: string
  name: string
  initials: string
  avatarSrc?: string
  role: string
}

export interface RoadmapCategory {
  id: RoadmapCategoryId
  label: "Backlog" | "To Do" | "In Progress" | "Done"
  summary: string
  focus: string
  order: number
}

export interface RoadmapTask {
  id: string
  taskKey: string
  title: string
  context: string
  categoryId: RoadmapCategoryId
  type: RoadmapTaskType
  label: RoadmapLabel
  priority: RoadmapPriority
  priorityValue: number
  signal: RoadmapSignal
  assignee: RoadmapOwner | null
  assignees: RoadmapOwner[]
  completionRate: number | null
  dueAt: string
  dueLabel: string
  activityLabel: string
}

export interface TaskCategoryRow {
  kind: "category"
  id: string
  category: RoadmapCategory
  subRows?: TaskItemRow[]
}

export interface TaskItemRow {
  kind: "task"
  id: string
  category: RoadmapCategory
  task: RoadmapTask
}

export type TaskTableRow = TaskCategoryRow | TaskItemRow

export const TASK_CATEGORY_ORDER: RoadmapCategoryId[] = [
  "backlog",
  "todo",
  "in-progress",
  "done",
]

export const TASK_PRIORITY_ORDER: RoadmapPriority[] = [
  "Urgent",
  "High",
  "Medium",
  "Low",
]

export const TASK_SIGNAL_OPTIONS: RoadmapSignal[] = [
  "Blocked",
  "At risk",
  "On track",
  "Queued",
  "Done",
]

export const TASK_TYPE_DETAILS: Record<
  RoadmapTaskType,
  { label: RoadmapTaskType; icon: ReactNode }
> = {
  Onboarding: {
    label: "Onboarding",
    icon: (
      <IconSparkles className="size-3.5" aria-hidden="true" />
    ),
  },
  Billing: {
    label: "Billing",
    icon: (
      <IconCreditCard className="size-3.5" aria-hidden="true" />
    ),
  },
  Knowledge: {
    label: "Knowledge",
    icon: (
      <IconBook className="size-3.5" aria-hidden="true" />
    ),
  },
  Assistant: {
    label: "Assistant",
    icon: (
      <IconRobot className="size-3.5" aria-hidden="true" />
    ),
  },
  Access: {
    label: "Access",
    icon: (
      <IconShieldCheck className="size-3.5" aria-hidden="true" />
    ),
  },
  Notifications: {
    label: "Notifications",
    icon: (
      <IconBell className="size-3.5" aria-hidden="true" />
    ),
  },
  Mobile: {
    label: "Mobile",
    icon: (
      <IconDeviceMobile className="size-3.5" aria-hidden="true" />
    ),
  },
  Data: {
    label: "Data",
    icon: (
      <IconDatabase className="size-3.5" aria-hidden="true" />
    ),
  },
}

export const ROADMAP_CATEGORIES: RoadmapCategory[] = [
  {
    id: "backlog",
    label: "Backlog",
    summary: "Ideas waiting for product shaping",
    focus: "Discovery",
    order: 1,
  },
  {
    id: "todo",
    label: "To Do",
    summary: "Scoped work ready for owners",
    focus: "Ready",
    order: 2,
  },
  {
    id: "in-progress",
    label: "In Progress",
    summary: "Active delivery with review signals",
    focus: "Delivery",
    order: 3,
  },
  {
    id: "done",
    label: "Done",
    summary: "Recently shipped and verified work",
    focus: "Shipped",
    order: 4,
  },
]

export const ROADMAP_OWNERS: RoadmapOwner[] = [
  {
    id: "rina",
    name: "Rina Holt",
    initials: "RH",
    avatarSrc:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&dpr=2&q=80",
    role: "Lifecycle PM",
  },
  {
    id: "vale",
    name: "Vale Aksoy",
    initials: "VA",
    avatarSrc:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=96&h=96&dpr=2&q=80",
    role: "Revenue systems",
  },
  {
    id: "noor",
    name: "Noor Albright",
    initials: "NA",
    avatarSrc:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&dpr=2&q=80",
    role: "Knowledge lead",
  },
  {
    id: "sora",
    name: "Sora Min",
    initials: "SM",
    avatarSrc:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=96&h=96&dpr=2&q=80",
    role: "AI quality",
  },
  {
    id: "evren",
    name: "Evren Blake",
    initials: "EB",
    avatarSrc:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=96&h=96&dpr=2&q=80",
    role: "Access architect",
  },
  {
    id: "mina",
    name: "Mina Rowe",
    initials: "MR",
    avatarSrc:
      "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=96&h=96&dpr=2&q=80",
    role: "Mobile engineer",
  },
]

function owner(id: RoadmapOwner["id"]) {
  const match = ROADMAP_OWNERS.find((item) => item.id === id)

  if (!match) {
    throw new Error(`Unknown roadmap owner: ${id}`)
  }

  return match
}

export const ROADMAP_TASKS: RoadmapTask[] = [
  {
    id: "task-184",
    taskKey: "RDM-184",
    title: "Draft first-run board tips",
    context: "Onboarding path for workspaces with no imported projects.",
    categoryId: "backlog",
    type: "Onboarding",
    label: "Adoption",
    priority: "Medium",
    priorityValue: 2,
    signal: "Queued",
    assignee: owner("rina"),
    assignees: [owner("rina"), owner("noor")],
    completionRate: 18,
    dueAt: "2026-12-22",
    dueLabel: "22 Dec",
    activityLabel: "Idea captured",
  },
  {
    id: "task-197",
    taskKey: "RDM-197",
    title: "Map invoice retries to health cards",
    context: "Billing operations need clearer recovery next steps.",
    categoryId: "backlog",
    type: "Billing",
    label: "Revenue",
    priority: "High",
    priorityValue: 3,
    signal: "At risk",
    assignee: owner("vale"),
    assignees: [owner("vale")],
    completionRate: 34,
    dueAt: "2026-03-03",
    dueLabel: "03 Mar",
    activityLabel: "Needs scope",
  },
  {
    id: "task-205",
    taskKey: "RDM-205",
    title: "Guard archived pages",
    context: "Documentation teams need safer recovery for stale pages.",
    categoryId: "backlog",
    type: "Knowledge",
    label: "Knowledge",
    priority: "Low",
    priorityValue: 1,
    signal: "Queued",
    assignee: owner("noor"),
    assignees: [owner("noor")],
    completionRate: 12,
    dueAt: "2026-08-18",
    dueLabel: "18 Aug",
    activityLabel: "Research note",
  },
  {
    id: "task-212",
    taskKey: "RDM-212",
    title: "Audit assistant fallback prompts for unsupported intents",
    context: "AI responses should exit gracefully when routes are missing.",
    categoryId: "backlog",
    type: "Assistant",
    label: "AI Quality",
    priority: "High",
    priorityValue: 3,
    signal: "On track",
    assignee: owner("sora"),
    assignees: [owner("sora"), owner("rina")],
    completionRate: 42,
    dueAt: "2026-11-29",
    dueLabel: "29 Nov",
    activityLabel: "Prompt review",
  },
  {
    id: "task-226",
    taskKey: "RDM-226",
    title: "Scope vendor admin roles",
    context: "Partner operators need limited access without full admin rights.",
    categoryId: "backlog",
    type: "Access",
    label: "Access",
    priority: "Urgent",
    priorityValue: 4,
    signal: "Blocked",
    assignee: owner("evren"),
    assignees: [owner("evren"), owner("sora")],
    completionRate: 9,
    dueAt: "2026-01-14",
    dueLabel: "14 Jan",
    activityLabel: "Policy gap",
  },
  {
    id: "task-239",
    taskKey: "RDM-239",
    title: "Define regional quiet hours for digest notifications",
    context:
      "Regional teams need delivery windows that respect local schedules.",
    categoryId: "backlog",
    type: "Notifications",
    label: "Messaging",
    priority: "Medium",
    priorityValue: 2,
    signal: "Queued",
    assignee: null,
    assignees: [],
    completionRate: null,
    dueAt: "2026-02-11",
    dueLabel: "11 Feb",
    activityLabel: "Owner pending",
  },
  {
    id: "task-241",
    taskKey: "RDM-241",
    title: "Prototype mobile composer",
    context: "Small-screen creation should keep labels and owners reachable.",
    categoryId: "todo",
    type: "Mobile",
    label: "Mobile",
    priority: "High",
    priorityValue: 3,
    signal: "On track",
    assignee: owner("mina"),
    assignees: [owner("mina")],
    completionRate: 46,
    dueAt: "2026-04-27",
    dueLabel: "27 Apr",
    activityLabel: "Ready",
  },
  {
    id: "task-244",
    taskKey: "RDM-244",
    title: "Connect revenue alerts to renewals",
    context: "Finance reviewers need alert history beside upcoming renewals.",
    categoryId: "todo",
    type: "Billing",
    label: "Revenue",
    priority: "Urgent",
    priorityValue: 4,
    signal: "At risk",
    assignee: owner("vale"),
    assignees: [owner("vale"), owner("rina")],
    completionRate: 58,
    dueAt: "2026-10-14",
    dueLabel: "14 Oct",
    activityLabel: "Brief approved",
  },
  {
    id: "task-251",
    taskKey: "RDM-251",
    title: "Write handoff checklist for knowledge base imports",
    context: "Migration specialists need clear validation before publishing.",
    categoryId: "todo",
    type: "Knowledge",
    label: "Workflow",
    priority: "Medium",
    priorityValue: 2,
    signal: "Queued",
    assignee: owner("noor"),
    assignees: [owner("noor"), owner("evren")],
    completionRate: 37,
    dueAt: "2026-09-30",
    dueLabel: "30 Sep",
    activityLabel: "Queued",
  },
  {
    id: "task-263",
    taskKey: "RDM-263",
    title: "Separate SSO exception review from the access queue",
    context: "Security reviewers need a focused path for identity edge cases.",
    categoryId: "todo",
    type: "Access",
    label: "Access",
    priority: "High",
    priorityValue: 3,
    signal: "Blocked",
    assignee: owner("evren"),
    assignees: [owner("evren"), owner("sora"), owner("vale")],
    completionRate: 29,
    dueAt: "2026-05-08",
    dueLabel: "08 May",
    activityLabel: "Legal review",
  },
  {
    id: "task-279",
    taskKey: "RDM-279",
    title: "Preview announcement routing",
    context: "Support managers need to verify recipients before launch.",
    categoryId: "todo",
    type: "Notifications",
    label: "Messaging",
    priority: "Low",
    priorityValue: 1,
    signal: "On track",
    assignee: owner("rina"),
    assignees: [owner("rina")],
    completionRate: 51,
    dueAt: "2026-07-21",
    dueLabel: "21 Jul",
    activityLabel: "Design ready",
  },
  {
    id: "task-286",
    taskKey: "RDM-286",
    title: "Tune citation scoring for generated release notes",
    context: "Generated summaries need stronger source weighting for launches.",
    categoryId: "in-progress",
    type: "Assistant",
    label: "AI Quality",
    priority: "High",
    priorityValue: 3,
    signal: "On track",
    assignee: owner("sora"),
    assignees: [owner("sora"), owner("noor")],
    completionRate: 76,
    dueAt: "2026-12-19",
    dueLabel: "19 Dec",
    activityLabel: "Scoring pass",
  },
  {
    id: "task-292",
    taskKey: "RDM-292",
    title: "Ship onboarding status badges",
    context: "Customer success needs quick setup visibility inside accounts.",
    categoryId: "in-progress",
    type: "Onboarding",
    label: "Adoption",
    priority: "Medium",
    priorityValue: 2,
    signal: "On track",
    assignee: owner("rina"),
    assignees: [owner("rina"), owner("mina")],
    completionRate: 88,
    dueAt: "2026-08-25",
    dueLabel: "25 Aug",
    activityLabel: "UI polish",
  },
  {
    id: "task-301",
    taskKey: "RDM-301",
    title: "Review swipe-to-archive recovery",
    context: "Field teams need a forgiving undo path on dense task lists.",
    categoryId: "in-progress",
    type: "Mobile",
    label: "Mobile",
    priority: "Urgent",
    priorityValue: 4,
    signal: "At risk",
    assignee: owner("mina"),
    assignees: [owner("mina"), owner("evren")],
    completionRate: 67,
    dueAt: "2026-11-02",
    dueLabel: "02 Nov",
    activityLabel: "QA active",
  },
  {
    id: "task-318",
    taskKey: "RDM-318",
    title: "Show warehouse lag in ops dashboards",
    context: "Data teams need freshness warnings before exports are trusted.",
    categoryId: "in-progress",
    type: "Data",
    label: "Insights",
    priority: "High",
    priorityValue: 3,
    signal: "Blocked",
    assignee: null,
    assignees: [],
    completionRate: 41,
    dueAt: "2026-06-06",
    dueLabel: "06 Jun",
    activityLabel: "Dependency",
  },
  {
    id: "task-324",
    taskKey: "RDM-324",
    title: "Clarify webhook retry copy",
    context: "Incident responders need less ambiguous retry status language.",
    categoryId: "in-progress",
    type: "Notifications",
    label: "Reliability",
    priority: "Medium",
    priorityValue: 2,
    signal: "On track",
    assignee: owner("vale"),
    assignees: [owner("vale"), owner("rina")],
    completionRate: 82,
    dueAt: "2026-04-03",
    dueLabel: "03 Apr",
    activityLabel: "Copy review",
  },
  {
    id: "task-331",
    taskKey: "RDM-331",
    title: "Publish renewal alert audit trail",
    context: "Finance reviewers can trace notification outcomes after launch.",
    categoryId: "done",
    type: "Billing",
    label: "Revenue",
    priority: "High",
    priorityValue: 3,
    signal: "Done",
    assignee: owner("vale"),
    assignees: [owner("vale"), owner("rina")],
    completionRate: 100,
    dueAt: "2026-03-18",
    dueLabel: "18 Mar",
    activityLabel: "Shipped",
  },
  {
    id: "task-338",
    taskKey: "RDM-338",
    title: "Launch knowledge import validator",
    context: "Migration teams can confirm page quality before publishing.",
    categoryId: "done",
    type: "Knowledge",
    label: "Knowledge",
    priority: "Medium",
    priorityValue: 2,
    signal: "Done",
    assignee: owner("noor"),
    assignees: [owner("noor"), owner("evren")],
    completionRate: 100,
    dueAt: "2026-03-26",
    dueLabel: "26 Mar",
    activityLabel: "Verified",
  },
  {
    id: "task-346",
    taskKey: "RDM-346",
    title: "Release mobile undo affordance",
    context: "Field teams have a reliable recovery path after list actions.",
    categoryId: "done",
    type: "Mobile",
    label: "Mobile",
    priority: "High",
    priorityValue: 3,
    signal: "Done",
    assignee: owner("mina"),
    assignees: [owner("mina"), owner("sora")],
    completionRate: 100,
    dueAt: "2026-04-12",
    dueLabel: "12 Apr",
    activityLabel: "Released",
  },
]