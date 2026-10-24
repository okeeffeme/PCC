import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
}

/**
 * A placeholder block. It is decorative — the loading region carries
 * aria-busy instead, so screen readers hear "loading", not "empty box".
 */
export function Skeleton({
  width = "100%",
  height = "16px",
  radius = "var(--radius-sm)",
}: SkeletonProps) {
  return (
    <span
      className={styles.skeleton}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
