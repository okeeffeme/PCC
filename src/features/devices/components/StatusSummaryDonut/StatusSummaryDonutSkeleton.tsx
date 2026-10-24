import { Cell, Label, Pie, PieChart, ResponsiveContainer } from "recharts";
import styles from "./StatusSummaryDonut.module.css";

export function StatusSummaryDonutSkeleton() {
  const data = [{ name: "Empty", value: 1, color: "var(--color-border)" }];

  return (
    <div className={styles.wrapper}>
      <div className={styles.chart} aria-busy="true">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={0}
              isAnimationActive={false}
            >
              <Cell fill="var(--color-border)" />
              <Label position="center" className={styles.centerLabel} value="0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
