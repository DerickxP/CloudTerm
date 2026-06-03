"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./TerminalButton.module.css";

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "ghost";
}

export default function TerminalButton({
  children,
  loading = false,
  variant = "primary",
  disabled,
  ...props
}: TerminalButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.loadingDots}>
          <span>.</span><span>.</span><span>.</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
