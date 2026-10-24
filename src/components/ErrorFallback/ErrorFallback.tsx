import { Button } from "../Button/Button";
import styles from "./ErrorFallback.module.css";

export interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
}

/** The last line of defence: something failed, here is what and what to do. */
export function ErrorFallback({
  error,
  onRetry,
  title = "Something went wrong",
}: ErrorFallbackProps) {
  return (
    <div className={styles.fallback} role="alert">
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>
        {error?.message ?? "The data could not be loaded. Please try again."}
      </p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
