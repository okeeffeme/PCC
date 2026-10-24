import type { DeviceStatus } from "../../../shared/schemas/device";
import { STATUS_META } from "../../features/devices/statusMeta";
import styles from "./StatusBadge.module.css";

/**
 * Status is never communicated by colour alone: the badge carries a shape
 * (the dot) and the status word.
 */
export function StatusBadge({ status }: { status: DeviceStatus }) {
  return (
    <span className={[styles.badge, styles[status]].join(" ")} data-status={status}>
      <span className={styles.dot} aria-hidden="true" />
      {STATUS_META[status].label}
    </span>
  );
}
