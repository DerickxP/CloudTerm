import { ReactNode } from "react";
import styles from "./AuthCard.module.css";

interface AuthCardProps {
  title: string;
  subtitle: string;
  prompt: string;
  children: ReactNode;
}

export default function AuthCard({ title, subtitle, prompt, children }: AuthCardProps) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.grid} aria-hidden="true" />

      <div className={styles.card}>
        <div className={styles.terminalBar}>
          <span className={styles.dot} data-color="red" />
          <span className={styles.dot} data-color="yellow" />
          <span className={styles.dot} data-color="green" />
          <span className={styles.terminalTitle}>cloudterm — auth</span>
        </div>

        <div className={styles.body}>
          <p className={styles.prompt}>
            {prompt} <span className={styles.cursor}>▋</span>
          </p>

          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  );
}
