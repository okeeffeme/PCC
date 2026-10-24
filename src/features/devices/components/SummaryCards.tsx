import type { DeviceStatus } from "../../../../shared/schemas/device";
import { exportDevicesHref } from "../api/deviceApi";
import { useDeviceSummaryQuery } from "../hooks/useDevices";
import styles from "./SummaryCards.module.css";

const ALL = "all";

export interface SummaryCardsProps {
  activeStatus: DeviceStatus | typeof ALL;
  onStatusChange: (status: DeviceStatus | typeof ALL) => void;
  query: string;
  sort: "name" | "model" | "status";
  order: "asc" | "desc";
}

/**
 * The counts are facet counts from the server (ignoring the status filter),
 * so the cards stay useful while one status is selected. The export link
 * streams the current filtered view as CSV straight from the API.
 */
export function SummaryCards({
  activeStatus,
  onStatusChange,
  query,
  sort,
  order,
}: SummaryCardsProps) {
  const { data: summary } = useDeviceSummaryQuery({ q: query || undefined });

  const cards: { key: DeviceStatus | typeof ALL; label: string; value: number }[] = [
    { key: ALL, label: "Total devices", value: summary.total },
    { key: "online", label: "Online", value: summary.online },
    { key: "inMeeting", label: "In meeting", value: summary.inMeeting },
    { key: "offline", label: "Offline", value: summary.offline },
    { key: "deactivated", label: "Deactivated", value: summary.deactivated },
  ];

  return (
    <div>
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
      <p>
        <a
          href={exportDevicesHref({
            q: query || undefined,
            status: activeStatus === ALL ? undefined : activeStatus,
            sort,
            order,
          })}
        >
          Export as CSV
        </a>
      </p>
    </div>
  );
}
