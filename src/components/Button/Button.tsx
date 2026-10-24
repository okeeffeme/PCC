import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a pending state: disables the button and marks it busy for screen readers. */
  isLoading?: boolean;
  /** Announced while loading. Falls back to the button label. */
  loadingLabel?: string;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  isLoading = false,
  loadingLabel,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? (loadingLabel ?? children) : children}
    </button>
  );
}
