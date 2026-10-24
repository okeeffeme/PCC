import { useDeviceHistoryQuery } from "../../devices/hooks/useDevices";
import { StatusHistoryChart } from "../../../components/StatusHistoryChart/StatusHistoryChart";
import styles from "./HistorySection.module.css";

export function HistorySection() {
  const { data } = useDeviceHistoryQuery();
  const history = data ?? [];

  return (
    <div className={styles.section}>
      <p className={styles.caption}>
        Monthly fleet status since {history[0]?.period ?? "—"}. The counts are the share of devices
        in each state at the end of the month.
      </p>
      <StatusHistoryChart data={history} />
    </div>
  );
}
