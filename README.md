# Device Fleet — PCC Frontend Engineer Homework

A dashboard for the meeting-room device fleet: live status for every device, counts by status, and controls to add, edit and remove hardware.

The API here is a small mock service: an Express 5 process with HTTP status codes, validation and mocked latency. The idea was to write the client as it would be against a production backend.

```
browser ──► Vite dev server :5173 ──proxy /api──► Express 5 :3001 ──► devices.json
```

---

## Quick start

```bash
# 1. Toolchain (Vite+ ships its own Node — no winget/nvm needed)
irm https://viteplus.dev/install.ps1 | iex   # Windows PowerShell
curl -fsSL https://vite.plus | bash          # macOS or Linux
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

## What it does

- **Device list** — 433 devices, sortable by name/model/status, filtered by name (case-insensitive), paginated by the server (25/50/100 per page, default 25) with a page-size control.
- **Status summary (donut + cards)** — an interactive Recharts donut chart (`StatusSummaryDonut`) paired with a summary column. Powered by a server facet aggregate (`/api/devices/summary`) that ignores the status filter so all four status counts stay visible while one is selected. Clicking either a donut slice or a status card filters by that status (and clicking an active selection clears the filter); when filtered, the donut center updates from `{total}` / `Total devices` to `{selectedCount}` / `of {total} total` (or renders a `0` empty donut skeleton when `total === 0`).
- **CSV export** — the current filter/sort streamed as an HTTP attachment (`?format=csv`) in bounded keyset cursor batches (`deviceRepository.queryAfter`) with backpressure (`drain`), never buffered all at once in memory or built in the browser.
- **Add / edit / remove** — a validated form (react-hook-form + zod) with inline field errors, a duplicate-name error mapped back onto the name field, and a confirmation step before removal. Edits and deletes are optimistic across every cached page, roll back on failure, and reconcile on settle; a create invalidates instead, because a new name has no known sort position.
- **Status history** — the 56 monthly points as a stacked area chart, with the same numbers exposed in a visually-hidden table for screen-reader users.
- **Query state lives in the URL** — `?q=…&status=…&sort=…&order=…&page=…&pageSize=…`, so a filtered, sorted page can be shared or reloaded. Search is debounced (300 ms); changing a filter resets to page 1.

---

## Architecture

```
PCC/
├─ shared/            zod schemas + inferred types — ONE contract for client, server and tests
├─ server/            Express 5 API (routes, validation, Map-backed repository, seed loader)
├─ src/
│  ├─ app/            shell: providers, error boundary
│  ├─ components/     hand-rolled, stateless UI primitives (DataTable, Dialog, StatusIcon, StatusBadge, …)
│  ├─ features/
│  │  ├─ devices/     dashboard container, filters, table, form dialog, API client, hooks, statusMeta
│  │  ├─ widgets/     SummarySection (SummaryCards) and StatusSummaryDonut
│  │  └─ history/     lazy-loaded StatusHistoryChart section
│  ├─ styles/         design tokens + global styles
│  └─ test/           MSW server, render helper, setup
└─ vite.config.ts     vite + lint + fmt + test + run blocks
```

### Data flow

```
URL (q, status, sort, order, page, pageSize)
        │  debounced q (300 ms)
        ▼
useQuery(deviceKeys.list(params), keepPreviousData)     ──►  GET /api/devices?page&pageSize&…  ──►  PaginatedDevices
        │                                                                                            { items, page, pageSize, total, totalPages }
        └─► <DataTable manualSorting manualPagination>  (server window + total, no skeleton flash on page/filter change)
useQuery(deviceKeys.summary(filters), keepPreviousData) ──►  GET /api/devices/summary?q&model  ──►  DeviceSummary (ETag / 304)
        └─► <SummarySection>
              ├─► <StatusSummaryDonut> (1/4 row, center total / filtered count + slice drill-down)
              ├─► <SummaryCards>       (3/4 row, Total devices header + 4 status cards with <StatusIcon>)
              └─► CSV export link      (/api/devices?format=csv&…)
```

Two queries, each cached by its own key and using `placeholderData: keepPreviousData` so typing, sorting, or paging never flashes a skeleton over existing content. The summary ignores `status` on purpose (a facet), so selecting a status does not collapse the other cards or donut slices.

**Pagination contract.** Offset mode (`page`/`pageSize`) is what the UI table uses. The same endpoint also supports keyset cursor mode (`limit` + optional `cursor`, `Link: rel="next"`, `409 stale_cursor` if filters/sort change) and uses that cursor mode internally to stream CSV exports in bounded batches. At very deep offsets (millions of rows) the `OFFSET` scan becomes the cost, so the table could switch to the cursor contract.

---

## Decisions

| Topic            | Choice                         | One-line why                                                    |
| ---------------- | ------------------------------ | --------------------------------------------------------------- |
| Toolchain        | Vite+ (`vp check`, `vp test`)  | Simple, single command with linters/tests |
| Runtime          | Vite SPA + Express API         | SPA for internal dashboard |
| Server framework | Express 5                      | Most familiar with |
| API style        | REST                           | Flat data, two read shapes |
| Forms            | react-hook-form + zod resolver | Field-level validation the shared schema, RHF supports dirty/touched       |
| Table            | TanStack Table v9              | Manual sort/paging over a server window, thin wrapper |
| Charting         | Recharts                       | React-native, most familiar |
| Styling          | CSS Modules + `tokens.css`     | Scoped, one file to re-theme |
| Tests            | Vitest 5 + RTL + MSW           | Queries are role/name based

---

## Accessibility

- Semantic HTML first: `<table>`/`<caption>`/`<th scope="col">`, `<label for>` on every control, `<button type="button">` everywhere, landmark regions with headings.
- The dialog traps focus, closes on <kbd>Escape</kbd>, and returns focus to the trigger.
- Sortable headers expose `aria-sort`; the chart is `role="img"` with a label **and** a visually-hidden table of the same numbers.
- Status is never colour-only — `StatusBadge` pairs a dot with the status word, `SummaryCards` pairs `<StatusIcon>` with the count and label, and `StatusSummaryDonut` exposes an `aria-labelledby` text summary of all counts alongside interactive card buttons.
- Visible `:focus-visible` rings, ≥4.5:1 text contrast.
- Because the tests query by role and accessible name, breaking the a11y contract breaks a test.