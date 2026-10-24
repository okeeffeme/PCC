import type { Device } from "../../../../shared/schemas/device";
import styles from "./DeviceRowActions.module.css";

export interface DeviceRowActionsProps {
  device: Device;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Each button is labelled with the device it acts on. The visible word stays
 * short, the accessible name stays unambiguous.
 */
export function DeviceRowActions({ device, onEdit, onDelete }: DeviceRowActionsProps) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.edit}
        aria-label={`Edit ${device.name}`}
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        type="button"
        className={styles.remove}
        aria-label={`Remove ${device.name}`}
        onClick={onDelete}
      >
        Remove
      </button>
    </div>
  );
}
