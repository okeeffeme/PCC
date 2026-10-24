import { StatusSummaryDonutSkeleton } from "../StatusSummaryDonut";
import { Skeleton } from "../../../../components/Skeleton/Skeleton";
import styles from "./SummarySection.module.css";

export function SummarySectionSkeleton() {
  return (
    <div className={styles.wrapper}>
      <StatusSummaryDonutSkeleton />
      <div
        style={{
          display: "grid",
          gap: "var(--space-3)",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} height="84px" radius="var(--radius-lg)" />
        ))}
      </div>
    </div>
  );
}
