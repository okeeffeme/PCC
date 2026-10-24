import { lazy, Suspense, useState } from "react";
import { ErrorBoundary } from "../../../app/ErrorBoundary";
import { Skeleton } from "../../../components/Skeleton/Skeleton";
import type { Device, DeviceStatus } from "../../../../shared/schemas/device";
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

/**
 * The dashboard is a composition of three independent sections. Each one owns
 * its own Suspense + Error Boundary, so a failing chart cannot take the fleet
 * table down with it.
 */
export function DeviceDashboard() {
  const [statusParam, setStatusParam] = useUrlParam("status", ALL);
  const [query, setQuery] = useUrlParam("q", "");
  const [formState, setFormState] = useState<
    { mode: "closed" } | { mode: "open"; device: Device | null }
  >({
    mode: "closed",
  });
  const mutations = useDeviceMutations();

  const status: DeviceStatus | typeof ALL = isDeviceStatus(statusParam) ? statusParam : ALL;

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
              onStatusChange={(next) => setStatusParam(next === ALL ? "" : next)}
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
        <ErrorBoundary resetKey={`${query}:${status}`}>
          <Suspense fallback={<TableSkeleton />}>
            <DeviceTableSection
              query={query}
              status={status}
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
