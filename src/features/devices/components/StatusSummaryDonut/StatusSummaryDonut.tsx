import { useId } from "react";
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./StatusSummaryDonut.module.css";
import { StatusSummaryDonutSkeleton } from "./StatusSummaryDonutSkeleton";

const ALL_VALUE = "all";

const SEGMENTS = [
  { key: "online", label: "Online", color: "var(--status-online-fg)" },
  { key: "inMeeting", label: "In meeting", color: "var(--status-inmeeting-fg)" },
  { key: "offline", label: "Offline", color: "var(--status-offline-fg)" },
  { key: "deactivated", label: "Deactivated", color: "var(--status-deactivated-fg)" },
] as const;

export interface StatusSummaryDonutProps {
  summary: any;
  activeStatus: string;
  onStatusChange: (status: any) => void;
}

export function StatusSummaryDonut({
  summary,
  activeStatus,
  onStatusChange,
}: StatusSummaryDonutProps) {
  const captionId = useId();
  const total = summary?.total ?? 0;

  if (!summary || total === 0) {
    return <StatusSummaryDonutSkeleton />;
  }

  const data = SEGMENTS.map((segment) => ({
    name: segment.label,
    value: summary[segment.key],
    key: segment.key,
    color: segment.color,
  })).filter((item) => item.value > 0);

  const handleClick = (entry: any) => {
    if (!entry) return;
    const key = entry.key ?? entry.payload?.key ?? entry.name;
    if (!key) return;
    if (key === ALL_VALUE) {
      onStatusChange(ALL_VALUE);
      return;
    }
    if (activeStatus === key) {
      onStatusChange(ALL_VALUE);
      return;
    }
    if (key === "Online") onStatusChange("online");
    else if (key === "In meeting") onStatusChange("inMeeting");
    else if (key === "Offline") onStatusChange("offline");
    else if (key === "Deactivated") onStatusChange("deactivated");
    else onStatusChange(key);
  };

  const chartData = data.length > 0 ? data : [{ name: "Total", value: total, key: ALL_VALUE }];

  return (
    <div className={styles.wrapper}>
      <div className={styles.chart} role="img" aria-labelledby={captionId}>
        <p className={styles.visuallyHidden} id={captionId}>
          Fleet summary showing {total} devices: {summary.online} online, {summary.inMeeting} in
          meeting, {summary.offline} offline, {summary.deactivated} deactivated.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={2}
              onClick={handleClick}
              isAnimationActive={false}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color ?? "var(--color-border)"}
                  cursor="pointer"
                  opacity={activeStatus === ALL_VALUE || activeStatus === entry.key ? 1 : 0.4}
                />
              ))}
              <Label position="center" className={styles.centerLabel} value={total} />
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-xs)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
