import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Nothing to show, but nothing is broken either. */
export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className={styles.empty} role="status">
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children ? <div className={styles.actions}>{children}</div> : null}
    </div>
  );
}
