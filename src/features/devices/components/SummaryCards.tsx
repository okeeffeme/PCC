import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DeviceStatus } from "../../../../shared/schemas/device";
import { fetchDeviceSummary, exportDevicesHref } from "../api/deviceApi";
import { deviceKeys } from "../api/queryKeys";
import styles from "./SummaryCards.module.css";

const ALL = "all";

export interface SummaryCardsProps {
  activeStatus: DeviceStatus | typeof ALL;
  onStatusChange: (status: DeviceStatus | typeof ALL) => void;
  query: string;
  sort: string;
  order: string;
}

const CARDS: { key: DeviceStatus | typeof ALL; label: string }[] = [
  { key: ALL, label: "Total devices" },
  { key: "online", label: "Online" },
  { key: "inMeeting", label: "In meeting" },
  { key: "offline", label: "Offline" },
  { key: "deactivated", label: "Deactivated" },
];

/**
 * Fleet counts come from the server aggregate, but the summary is kept fresh
 * without flashing thanks to placeholderData. The export link reflects the
 * current view.
 */
export function SummaryCards({
  activeStatus,
  onStatusChange,
  query,
  sort,
  order,
}: SummaryCardsProps) {
  const { data: summary } = useQuery({
    queryKey: deviceKeys.summary({ q: query || undefined }),
    queryFn: ({ signal }) => fetchDeviceSummary({ q: query || undefined }, signal),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const values = summary ?? { total: 0, online: 0, inMeeting: 0, offline: 0, deactivated: 0 };
  const exportHref = exportDevicesHref({
    q: query || undefined,
    status: activeStatus === ALL ? undefined : activeStatus,
    sort: sort as any,
    order: order as any,
  });

  return (
    <div>
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
                {card.key === ALL ? values.total : values[card.key]}
              </span>
              <span className={styles.label}>{card.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p>
        <a href={exportHref}>Export as CSV</a>
      </p>
    </div>
  );
}
