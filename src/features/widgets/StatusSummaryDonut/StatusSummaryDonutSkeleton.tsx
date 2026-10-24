import { Cell, Label, Pie, PieChart, ResponsiveContainer } from "recharts";
import styles from "./StatusSummaryDonut.module.css";

const ALL_LABEL = "Total devices";

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
              <Label
                position="center"
                content={({ viewBox }) => {
                  const cx = viewBox && "cx" in viewBox ? (viewBox.cx ?? "50%") : "50%";
                  const cy = viewBox && "cy" in viewBox ? (viewBox.cy ?? 130) : 130;
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                      <tspan x={cx} dy="-0.4em" className={styles.centerText}>
                        0
                      </tspan>
                      <tspan x={cx} dy="1.4em" className={styles.centerSubtext}>
                        {ALL_LABEL}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
