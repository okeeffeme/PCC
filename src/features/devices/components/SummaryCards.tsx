import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchDeviceSummary } from "../api/deviceApi";
import { deviceKeys } from "../api/queryKeys";
import styles from "./SummaryCards.module.css";

const ALL_VALUE = "all";

export interface SummaryCardsProps {
  activeStatus: string;
  onStatusChange: (status: any) => void;
  query: string;
}

const CARDS = [
  { key: ALL_VALUE, label: "Total devices" },
  { key: "online", label: "Online" },
  { key: "inMeeting", label: "In meeting" },
  { key: "offline", label: "Offline" },
  { key: "deactivated", label: "Deactivated" },
];

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

  return (
    <ul className={styles.cards}>
      {CARDS.map((card) => (
        <li key={card.key}>
          <button
            type="button"
            className={`${styles.card} ${activeStatus === card.key ? styles.active : ""}`}
            aria-pressed={activeStatus === card.key}
            onClick={() => onStatusChange(card.key)}
          >
            <span className={styles.value}>
              {card.key === ALL_VALUE ? values.total : values[card.key as keyof typeof values]}
            </span>
            <span className={styles.label}>{card.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
