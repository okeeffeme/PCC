# Device Fleet — PCC Frontend Engineer Homework

A dashboard for the meeting-room device fleet: live status for every device, counts by status,
a monthly status-history chart, and controls to add, edit and remove hardware.

The brief is a **frontend** exercise, so the API here is a small mock service — but it is a _real_
one: an Express 5 process with real HTTP status codes, real validation and real latency. The client
is written exactly as it would be against a production backend.

```
browser ──► Vite dev server :5173 ──proxy /api──► Express 5 :3001 ──► devices.json
       └──────────────── one origin, no CORS ─────────────────┘
```

---

## Quick start

```bash
# 1. Toolchain (Vite+ ships its own Node — no winget/nvm needed)
irm https://viteplus.dev/install.ps1 | iex   # Windows PowerShell
vp env install lts                          # Node 24 LTS
vp env pin lts                              # pins .node-version for this repo

# 2. Install
vp install

# 3. Run (two terminals — the API is a separate process on purpose)
vp run dev:api                              # terminal 1: Express on :3001
vp dev                                      # terminal 2: app on :5173 (proxies /api)

# 4. Quality gates
vp check                                    # format + lint + type-check
vp test                                     # Vitest: components, features, API
vp build                                    # production build → dist/
```

Open <http://localhost:5173>.

**Production shape:** `vp build` then `node --import tsx server/index.ts` — the same Express process
serves `dist/` and the API, with a SPA fallback for client-side routes.

| Command          | What it does                                                   |
| ---------------- | -------------------------------------------------------------- |
| `vp dev`         | Vite dev server on :5173, proxies `/api` → :3001               |
| `vp run dev:api` | `tsx watch server/index.ts` — the Express API on :3001         |
| `vp check`       | Oxfmt + Oxlint (type-aware) + tsgo type-check — the only gate  |
| `vp check --fix` | Same, autofixing                                               |
| `vp test`        | Vitest 5: jsdom component tests + MSW + the API over real HTTP |
| `vp build`       | Vite build → `dist/`                                           |
| `vp run verify`  | `check` + `test`                                               |

---

## Troubleshooting

**`run: nothing found -- skipped` / `install: nothing found -- skipped`**
That output comes from a _different_ `vp`: on WSL, `/usr/bin/vp` is the GNU vcdiff tool (`vcat`),
not Vite+, and WSL has no Node on it at all. This repo is a Windows-side Node project —
`node_modules` holds `win32-x64` native binaries — so run the commands from **Windows
PowerShell**:

```powershell
cd C:\Users\Doomcake\Documents\PCC
vp install
vp run dev:api     # terminal 1 — Express on :3001
vp dev             # terminal 2 — app on :5173
```

Do not run `npm install` from WSL: it would swap the Windows-native binaries for Linux ones and
break the Windows setup. Keep the two environments apart.

**`Failed to load task graph — conflicts with a package.json script of the same name`**
A task in `vite.config.ts` → `run.tasks` may not share a name with a `package.json` script;
package.json scripts are already exposed as tasks. `vp run dev:api` therefore resolves to the npm
script, and the explicit task was removed.

---

## What it does

- **Device list** — 433 devices, sortable by name/model/status, filtered by name (case-insensitive),
  paginated 25 at a time.
- **Status summary** — total plus a count per status, derived from the same cached array the table
  renders, so the numbers can never disagree with the rows. Each card is also a status filter.
- **Add / edit / remove** — a validated form (react-hook-form + zod) with inline field errors, a
  duplicate-name error mapped back onto the name field, and a confirmation step before removal.
  Writes are optimistic: the cache updates immediately, rolls back on failure, and reconciles with
  the server afterwards.
- **Status history** — the 56 monthly points as a stacked area chart, with the same numbers exposed
  in a visually-hidden table for screen-reader users.
- **Filters live in the URL** — `?q=…&status=…`, so a filtered view can be shared or reloaded.

---

## Architecture

```
PCC/
├─ shared/            zod schemas + inferred types — ONE contract for client, server and tests
├─ server/            Express 5 API (routes, validation, in-memory repository, seed loader)
├─ src/
│  ├─ app/            shell: providers, error boundary
│  ├─ components/     hand-rolled, stateless UI primitives + thin TanStack/Recharts wrappers
│  ├─ features/       containers: devices (dashboard, cards, filters, table, form) and history
│  ├─ styles/         design tokens + global styles
│  └─ test/           MSW server, render helper, setup
└─ vite.config.ts     vite + lint + fmt + test + run blocks
```

Rules the layout encodes:

1. **`shared/` is the contract.** The form, the server and the tests all validate with the same zod
   schemas, so they cannot drift.
2. **Only `api/deviceApi.ts` knows URLs.** Components → hooks → api → `fetch`.
3. **Containers vs presentational.** `src/components/**` is stateless and controlled;
   `src/features/**/components/**` owns state and calls hooks.
4. **One owner per piece of state.** TanStack Query owns the server cache and the mutation pending
   flag; react-hook-form owns the form fields; the dialog owns its open/closed state.
5. **Every component is a folder** — `Component.tsx`, `Component.module.css`, `index.ts` (and a test
   where there is behaviour worth asserting).

### Data flow

```
useSuspenseQuery(deviceKeys.list())  ──►  fetch('/api/devices')  ──►  zod-validated Device[]
        │
        ├─► <DataTable>            (rows, sorting, paging, name filter)
        └─► select(summarizeDevices)  ──►  <SummaryCards>  (counts + status filters)
```

One request, two views. The summary is a `select` over the cached list, not a second endpoint call.

---

## Decisions

Every trade-off — with its cost, its benefit and what would reverse it — lives in
**[`docs/decision-log.md`](./docs/decision-log.md)**. The short version:

| Topic            | Choice                         | One-line why                                                   |
| ---------------- | ------------------------------ | -------------------------------------------------------------- |
| Toolchain        | Vite+ (`vp check`, `vp test`)  | One config, one command instead of four tools                  |
| Runtime          | Vite SPA + Express API         | No SSR needed; the API boundary is the thing under test        |
| Server state     | TanStack Query v5              | Cache, staleness, invalidation and rollback for free           |
| Server framework | Express 5                      | Familiarity wins when the options are equivalent               |
| API style        | REST                           | Flat data, two read shapes, no codegen step                    |
| Forms            | react-hook-form + zod resolver | Field-level validation the shared schema already describes     |
| Table            | TanStack Table v9              | Sorting/filtering/paging done properly, behind our own wrapper |
| Charting         | Recharts                       | React-native, and wrapped for the a11y contract                |
| Styling          | CSS Modules + `tokens.css`     | Scoped, zero runtime, one file to re-theme                     |
| Types            | TypeScript 6.0.3               | Editor-friendly; `vp check` type-checks on tsgo (TS 7)         |
| Tests            | Vitest 5 + RTL + MSW           | The network layer is the seam; queries are role/name based     |

The build plan, the API contract, the layout rules and the risk list are in
**[`docs/implementation-plan.md`](./docs/implementation-plan.md)**.

---

## Accessibility

Not a checklist at the end — a constraint on how the components are written:

- Semantic HTML first: `<table>`/`<caption>`/`<th scope="col">`, `<label for>` on every control,
  `<button type="button">` everywhere, landmark regions with headings.
- The dialog traps focus, closes on <kbd>Escape</kbd>, and returns focus to the trigger.
- Sortable headers expose `aria-sort`; the chart is `role="img"` with a label **and** a
  visually-hidden table of the same numbers.
- Status is never colour-only — a dot plus the status word.
- Visible `:focus-visible` rings, ≥4.5:1 text contrast, `prefers-reduced-motion` respected.
- Because the tests query by role and accessible name, breaking the a11y contract breaks a test.

---

## Testing

```
src/components/Button/Button.test.tsx                   type, click, pending state
src/components/TextField/TextField.test.tsx           label, hint/error wiring, RHF props
src/components/Select/Select.test.tsx                   label, options, value
src/components/Badge/Badge.test.tsx                     content
src/components/StatusBadge/StatusBadge.test.tsx         status in words, not colour alone
src/components/Skeleton/Skeleton.test.tsx               decorative
src/components/EmptyState/EmptyState.test.tsx           role="status"
src/components/ErrorFallback/ErrorFallback.test.tsx     role="alert" + retry
src/components/Dialog/Dialog.test.tsx                  semantics, Escape, focus in/out, focus trap
src/components/DataTable/DataTable.test.tsx            caption, sort delegation, global filter
src/components/StatusHistoryChart/StatusHistoryChart.test.tsx
                                                       role="img" + the hidden data table
src/features/devices/components/DeviceDashboard.test.tsx
                                                       filter by name, filter by status, add,
                                                       duplicate-name error, remove
server/app.test.ts                                     the API over real HTTP (12 cases)
```

41 tests across 13 files. `vp test` runs all of them. The client tests go through MSW at the network
layer (same URL contract as the server); the API tests hit a real Express instance on an ephemeral
port.

---

## Known limitations / what I'd do next

1. **Server-side pagination.** 433 rows fit in one response; at ~100k rows the list endpoint needs
   `?page=&pageSize=` and the table switches to manual pagination. The query-key factory is already
   shaped for it.
2. **No auth.** Mutations assume an authenticated operator; the real model (who may deactivate a
   device) is an open question for the reviewer.
3. **Live status.** The client polls nothing — `staleTime` is 30s and there is no push channel.
   Webhooks/SSE would change the cache strategy, not the components.
4. **Edit is deliberately thin.** It reuses the add form, but a real product would show device
   metadata (firmware, room, last seen) that the brief's data does not contain.
5. **E2E.** Playwright is the first thing I would add — the accessibility and flow guarantees are
   currently covered at the component and API level.
6. **The mock API is in-memory.** Restarting the server resets the fleet; a real backend would own
   persistence.
