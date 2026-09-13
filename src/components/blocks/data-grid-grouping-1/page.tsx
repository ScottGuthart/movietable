import { GroupedRoadmapDataGridView } from "./components/data-grid-view"

export function Page() {
  return (
    <main
      className="mx-auto flex min-h-svh w-full items-start justify-center p-8 pt-12"
      aria-labelledby="page-heading"
    >
      <h1 id="page-heading" className="sr-only">
        Grouped task data grid
      </h1>
      <GroupedRoadmapDataGridView />
    </main>
  )
}