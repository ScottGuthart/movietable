# [MovieTable](https://movietable.ai)

A ranked, filterable table of the all-time top films on Metacritic. A **score bias**
slider blends the Metascore (critics) with the Metacritic user score into one Final
Score, so the whole table re-ranks as you slide between "Critics" and "Users". Around
that sit title search, quick numeric filters, an advanced boolean filter editor,
sortable columns, and score-band grouping.

Live at **https://movietable.ai**.

## About

MovieTable is a spotlight project by [Scott Guthart](https://guth.art), featured on his
portfolio and resume at https://guth.art. It is built and operated end to end: data
pipeline, database, API, front end, and hosting.

## Stack

- **Front end:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, ReUI,
  TanStack Table
- **Data:** Supabase (PostgreSQL, PostgREST, Auth, Storage, Edge Functions)
- **Hosting:** self-hosted on a DigitalOcean Ubuntu VM with Coolify (PaaS) and
  Cloudflare DNS
- **Tooling:** Bun, ESLint, `bun test`

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/app` | Next.js App Router entry (`layout.tsx`, `page.tsx`) |
| `src/components/MovieTable.tsx` | The table: score bias, filters, sorting, grouping |
| `src/lib` | Scoring, filtering, grouping, and taste-profile logic with unit tests |
| `scripts/scrape-metacritic.ts` | Scrapes Metacritic and writes normalized seed tables |
| `scripts/seed-supabase.ts` | Loads `seed/` into Supabase |
| `supabase/migrations` | Database schema |
| `infra/supabase` | Coolify service definition and deploy script for the Supabase stack |

## Development

```sh
bun install
bun dev          # http://localhost:3000
bun test         # unit tests in src/lib
bun run lint
bun run typecheck
```

## Data pipeline

```sh
bun scripts/scrape-metacritic.ts   # Metacritic -> seed/*.json, seed/*.csv
bun scripts/seed-supabase.ts       # seed/ -> Supabase
```

## Infrastructure

The Supabase stack runs as a Coolify service on the same VM and is reachable at
`https://api.movietable.ai`. See [`infra/supabase/README.md`](infra/supabase/README.md)
for the service definition, the deploy script, and operational notes.
