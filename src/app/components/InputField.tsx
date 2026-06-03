"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { LucideIcon } from "lucide-react";
import styles from "./InputField.module.css";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
}


const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, icon: Icon, error, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        <label className={styles.label}>
          <Icon size={12} className={styles.labelIcon} />
          {label}
        </label>

        <div className={styles.inputWrapper}>
          <input ref={ref} className={`${styles.input} ${error ? styles.inputError : ""}`} {...props} />
          <span className={styles.inputBorder} />
        </div>

        {error && <span className={styles.errorMsg}>{error}</span>}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
