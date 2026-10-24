import { Button } from "../../../components/Button/Button";
import styles from "./DeviceFilters.module.css";

export interface DeviceFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  onAddDevice: () => void;
}

/**
 * The name filter lives in the URL, so the view can be shared and survives a
 * reload. The input is controlled by that URL value — there is no second copy
 * of the state to fall out of sync.
 */
export function DeviceFilters({ query, onQueryChange, onAddDevice }: DeviceFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.search}>
        <label className={styles.label} htmlFor="device-search">
          Filter by name
        </label>
        <input
          id="device-search"
          type="search"
          className={styles.input}
          value={query}
          placeholder="e.g. Boardroom"
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <Button variant="primary" onClick={onAddDevice}>
        Add device
      </Button>
    </div>
  );
}
