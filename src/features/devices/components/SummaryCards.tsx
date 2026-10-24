import type { DeviceStatus } from "../../../../shared/schemas/device";
import { useDeviceSummaryQuery } from "../hooks/useDevices";
import styles from "./SummaryCards.module.css";

const ALL = "all";

export interface SummaryCardsProps {
  activeStatus: DeviceStatus | typeof ALL;
  onStatusChange: (status: DeviceStatus | typeof ALL) => void;
}

/**
 * The counts are derived from the same array the table renders (a `select` on
 * the cached list), so the cards and the rows can never disagree. Each card
 * doubles as a status filter.
 */
export function SummaryCards({ activeStatus, onStatusChange }: SummaryCardsProps) {
  const { data: summary } = useDeviceSummaryQuery();

  const cards: { key: DeviceStatus | typeof ALL; label: string; value: number }[] = [
    { key: ALL, label: "Total devices", value: summary.total },
    { key: "online", label: "Online", value: summary.online },
    { key: "inMeeting", label: "In meeting", value: summary.inMeeting },
    { key: "offline", label: "Offline", value: summary.offline },
    { key: "deactivated", label: "Deactivated", value: summary.deactivated },
  ];

  return (
    <ul className={styles.cards}>
      {cards.map((card) => {
        const isActive = activeStatus === card.key;
        return (
          <li key={card.key}>
            <button
              type="button"
              className={[styles.card, isActive ? styles.active : ""].filter(Boolean).join(" ")}
              aria-pressed={isActive}
              onClick={() => onStatusChange(card.key)}
            >
              <span className={styles.value}>{card.value}</span>
              <span className={styles.label}>{card.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
