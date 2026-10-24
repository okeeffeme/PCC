import { lazy, Suspense, useState } from "react";
import { ErrorBoundary } from "../../../app/ErrorBoundary";
import { Skeleton } from "../../../components/Skeleton/Skeleton";
import {
  DEFAULT_PAGE_SIZE,
  type Device,
  type DeviceSort,
  type DeviceStatus,
  type SortOrder,
} from "../../../../shared/schemas/device";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useDeviceMutations } from "../hooks/useDeviceMutations";
import { useUrlParam } from "../hooks/useUrlParam";
// The chart pulls in Recharts, which is a third of the bundle. It lives below
// the fold, so it is loaded on demand instead of blocking the first paint.
const HistorySection = lazy(async () => {
  const module = await import("../../history/components/HistorySection");
  return { default: module.HistorySection };
});
import { DeviceFilters } from "./DeviceFilters";
import { DeviceFormDialog } from "./DeviceFormDialog";
import { DeviceTableSection } from "./DeviceTableSection";
import { SummaryCards } from "./SummaryCards";
import styles from "./DeviceDashboard.module.css";

const ALL = "all";

function isDeviceStatus(value: string): value is DeviceStatus {
  return (
    value === "online" || value === "inMeeting" || value === "offline" || value === "deactivated"
  );
}

function isDeviceSort(value: string): value is DeviceSort {
  return value === "name" || value === "model" || value === "status";
}

function isSortOrder(value: string): value is SortOrder {
  return value === "asc" || value === "desc";
}

/**
 * The dashboard is a composition of three independent sections. Each one owns
 * its own Suspense + Error Boundary, so a failing chart cannot take the fleet
 * table down with it. Filters, sort and paging live in the URL so views can be
 * shared; the search input is debounced before it hits the server.
 */
export function DeviceDashboard() {
  const [statusParam, setStatusParam] = useUrlParam("status", ALL);
  const [query, setQueryParam] = useUrlParam("q", "");
  const [sortParam, setSortParam] = useUrlParam("sort", "name");
  const [orderParam, setOrderParam] = useUrlParam("order", "asc");
  const [pageParam, setPageParam] = useUrlParam("page", "1");
  const [pageSizeParam, setPageSizeParam] = useUrlParam("pageSize", String(DEFAULT_PAGE_SIZE));
  const [formState, setFormState] = useState<
    { mode: "closed" } | { mode: "open"; device: Device | null }
  >({
    mode: "closed",
  });
  const mutations = useDeviceMutations();

  const status: DeviceStatus | typeof ALL = isDeviceStatus(statusParam) ? statusParam : ALL;
  const sort: DeviceSort = isDeviceSort(sortParam) ? sortParam : "name";
  const order: SortOrder = isSortOrder(orderParam) ? orderParam : "asc";
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(pageSizeParam, 10) || DEFAULT_PAGE_SIZE),
  );
  const debouncedQuery = useDebouncedValue(query, 300);

  const setStatus = (next: DeviceStatus | typeof ALL) => {
    setStatusParam(next === ALL ? "" : next);
    setPageParam("1");
  };
  const setSort = (nextSort: DeviceSort, nextOrder: SortOrder) => {
    setSortParam(nextSort);
    setOrderParam(nextOrder);
    setPageParam("1");
  };
  const setPage = (nextPage: number) => setPageParam(String(nextPage));
  const setPageSize = (nextSize: number) => {
    setPageSizeParam(String(nextSize));
    setPageParam("1");
  };
  const setQuery = (nextQuery: string) => {
    setQueryParam(nextQuery);
    setPageParam("1");
  };

  return (
    <div className={styles.dashboard}>
      <section className={styles.section} aria-labelledby="summary-heading">
        <h2 className={styles.sectionTitle} id="summary-heading">
          Fleet summary
        </h2>
        <ErrorBoundary>
          <Suspense fallback={<SummaryCardsSkeleton />}>
            <SummaryCards
              activeStatus={status}
              onStatusChange={setStatus}
              query={debouncedQuery}
              sort={sort}
              order={order}
            />
          </Suspense>
        </ErrorBoundary>
      </section>

      <section className={styles.section} aria-labelledby="devices-heading">
        <h2 className={styles.sectionTitle} id="devices-heading">
          Devices
        </h2>
        <DeviceFilters
          query={query}
          onQueryChange={setQuery}
          onAddDevice={() => setFormState({ mode: "open", device: null })}
        />
        <ErrorBoundary
          resetKey={`${debouncedQuery}:${status}:${sort}:${order}:${page}:${pageSize}`}
        >
          <Suspense fallback={<TableSkeleton />}>
            <DeviceTableSection
              query={debouncedQuery}
              status={status}
              sort={sort}
              order={order}
              onSortChange={setSort}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              mutations={mutations}
              onEdit={(device) => setFormState({ mode: "open", device })}
            />
          </Suspense>
        </ErrorBoundary>
      </section>

      <section className={styles.section} aria-labelledby="history-heading">
        <h2 className={styles.sectionTitle} id="history-heading">
          Status history
        </h2>
        <ErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <HistorySection />
          </Suspense>
        </ErrorBoundary>
      </section>

      <DeviceFormDialog
        open={formState.mode === "open"}
        device={formState.mode === "open" ? formState.device : null}
        onClose={() => setFormState({ mode: "closed" })}
        mutations={mutations}
      />
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className={styles.skeletonRow} aria-busy="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <Skeleton key={index} height="84px" radius="var(--radius-lg)" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className={styles.skeletonStack} aria-busy="true">
      <Skeleton height="44px" />
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Skeleton key={index} height="40px" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className={styles.skeletonStack} aria-busy="true">
      <Skeleton height="260px" radius="var(--radius-lg)" />
    </div>
  );
}
