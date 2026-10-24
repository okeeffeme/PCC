import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "../components/ErrorFallback/ErrorFallback";

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the children when something throws. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Changing this value clears the error — e.g. when the filter changes. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
  /** The `resetKey` the current state was produced for. */
  resetKey: unknown;
}

/**
 * React still requires a class for error boundaries. Each section of the
 * dashboard gets its own boundary so a failing chart cannot blank the table.
 *
 * The reset happens during render (`getDerivedStateFromProps`) rather than in
 * an effect, so a filter change clears the error in the same commit that
 * changed the filter.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey === state.resetKey) return null;
    return { error: null, resetKey: props.resetKey };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ui] render error", error, info.componentStack);
  }

  private readonly reset = () => {
    this.setState({ error: null });
  };

  override render() {
    const { error } = this.state;
    if (error !== null) {
      return this.props.fallback ? (
        this.props.fallback(error, this.reset)
      ) : (
        <ErrorFallback error={error} onRetry={this.reset} />
      );
    }
    return this.props.children;
  }
}
