import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { StatusIcon } from "../../../components/StatusIcon";
import { fetchDeviceSummary } from "../../devices/api/deviceApi";
import { deviceKeys } from "../../devices/api/queryKeys";
import { STATUS_SEGMENTS } from "../../devices/statusMeta";
import styles from "./SummaryCards.module.css";

const ALL_VALUE = "all";

export interface SummaryCardsProps {
  activeStatus: string;
  onStatusChange: (status: any) => void;
  query: string;
}

export function SummaryCards({ activeStatus, onStatusChange, query }: SummaryCardsProps) {
  const { data: summary } = useQuery({
    queryKey: deviceKeys.summary({ q: query || undefined }),
    queryFn: ({ signal }) => fetchDeviceSummary({ q: query || undefined }, signal),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const values = summary ?? { total: 0, online: 0, inMeeting: 0, offline: 0, deactivated: 0 };

  const handleCardClick = (key: string) => {
    if (activeStatus === key) {
      onStatusChange(ALL_VALUE);
      return;
    }
    onStatusChange(key);
  };

  return (
    <div className={styles.cardsColumn}>
      <h3 className={styles.header}>
        <span className={styles.headerLabel}>Total devices</span>
        <span className={styles.headerValue}>{values.total}</span>
      </h3>
      <ul className={styles.cards}>
        {STATUS_SEGMENTS.map((card) => (
          <li key={card.key} className={styles.item}>
            <button
              type="button"
              className={`${styles.card} ${activeStatus === card.key ? styles.active : ""}`}
              aria-pressed={activeStatus === card.key}
              onClick={() => handleCardClick(card.key)}
            >
              <StatusIcon status={card.key} />
              <div className={styles.cardTop}>
                <span className={styles.value}>{values[card.key]}</span>
              </div>
              <span className={styles.label}>{card.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
