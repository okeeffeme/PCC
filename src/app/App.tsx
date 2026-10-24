import { DeviceDashboard } from "../features/devices/components/DeviceDashboard";
import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p className={styles.eyebrow}>PCC · Frontend Engineer Homework</p>
          <h1 className={styles.title}>Device Fleet</h1>
          <p className={styles.subtitle}>
            Live status for every meeting-room device, with fleet history and the controls to add or
            remove hardware.
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <DeviceDashboard />
      </main>

      <footer className={styles.footer}>
        <p>
          Mock API on <code>/api</code> · shared zod contracts · TanStack Query cache · REST
        </p>
      </footer>
    </div>
  );
}
