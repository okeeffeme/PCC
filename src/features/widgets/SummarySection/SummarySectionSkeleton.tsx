import { StatusSummaryDonutSkeleton } from "../StatusSummaryDonut";
import { Skeleton } from "../../../components/Skeleton/Skeleton";
import styles from "./SummarySection.module.css";
import cardStyles from "./SummaryCards.module.css";

export function SummarySectionSkeleton() {
  return (
    <div className={styles.wrapper} aria-busy="true">
      <StatusSummaryDonutSkeleton />
      <div className={cardStyles.cardsColumn}>
        <Skeleton height="36px" width="100%" radius="var(--radius-md)" />
        <div className={cardStyles.cards}>
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className={cardStyles.item}>
              <Skeleton height="100%" width="100%" radius="var(--radius-lg)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
