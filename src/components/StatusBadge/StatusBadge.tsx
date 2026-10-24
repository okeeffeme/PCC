import type { DeviceStatus } from "../../../shared/schemas/device";
import styles from "./StatusBadge.module.css";

const LABELS: Record<DeviceStatus, string> = {
  online: "Online",
  inMeeting: "In meeting",
  offline: "Offline",
  deactivated: "Deactivated",
};

/**
 * Status is never communicated by colour alone: the badge carries a shape
 * (the dot) and the status word.
 */
export function StatusBadge({ status }: { status: DeviceStatus }) {
  return (
    <span className={[styles.badge, styles[status]].join(" ")} data-status={status}>
      <span className={styles.dot} aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}
