import { StatusSummaryDonut } from "../StatusSummaryDonut";
import { SummaryCards } from "../SummaryCards";
import styles from "./SummarySection.module.css";
import { exportDevicesHref } from "../../api/deviceApi";

const ALL_VALUE = "all";

export interface SummarySectionProps {
  activeStatus: string;
  onStatusChange: (status: any) => void;
  query: string;
  sort: string;
  order: string;
  summary: any;
}

export function SummarySection({
  activeStatus,
  onStatusChange,
  query,
  sort,
  order,
  summary,
}: SummarySectionProps) {
  const exportHref = exportDevicesHref({
    q: query || undefined,
    status: activeStatus === ALL_VALUE ? undefined : (activeStatus as any),
    sort: sort as any,
    order: order as any,
  });

  return (
    <div className={styles.wrapper}>
      <StatusSummaryDonut
        summary={summary}
        activeStatus={activeStatus}
        onStatusChange={onStatusChange}
      />
      <SummaryCards activeStatus={activeStatus} onStatusChange={onStatusChange} query={query} />
      <p className={styles.export}>
        <a href={exportHref}>Export as CSV</a>
      </p>
    </div>
  );
}
