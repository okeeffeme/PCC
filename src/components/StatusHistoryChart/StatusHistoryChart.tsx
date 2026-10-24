import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "../../../shared/schemas/history";
import styles from "./StatusHistoryChart.module.css";

export interface StatusHistoryChartProps {
  data: HistoryPoint[];
}

const SERIES = [
  { key: "online", label: "Online", color: "var(--status-online-fg)" },
  { key: "inMeeting", label: "In meeting", color: "var(--status-inmeeting-fg)" },
  { key: "offline", label: "Offline", color: "var(--status-offline-fg)" },
  { key: "deactivated", label: "Deactivated", color: "var(--status-deactivated-fg)" },
] as const;

/**
 * A thin wrapper over Recharts. The library renders the picture; the
 * accessibility contract (an image role, a label, and a text version of the
 * same numbers) is ours.
 */
export function StatusHistoryChart({ data }: StatusHistoryChartProps) {
  const captionId = useId();

  return (
    <div className={styles.wrapper}>
      <div className={styles.chart} role="img" aria-labelledby={captionId}>
        <p className={styles.visuallyHidden} id={captionId}>
          Fleet status over time, from {data[0]?.period ?? "unknown"} to{" "}
          {data[data.length - 1]?.period ?? "unknown"}.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} width={48} />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-xs)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "var(--font-size-xs)" }} />
            {SERIES.map((series) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stackId="status"
                style={{ fill: series.color, stroke: series.color }}
                fillOpacity={0.75}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <table className={styles.visuallyHidden}>
        <caption>Fleet status by month</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            {SERIES.map((series) => (
              <th key={series.key} scope="col">
                {series.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.period}>
              <th scope="row">{point.period}</th>
              {SERIES.map((series) => (
                <td key={series.key}>{point[series.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
