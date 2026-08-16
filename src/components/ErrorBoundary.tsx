import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorScreen, describeError, isNetworkError } from "./ErrorScreen";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = {
  children: ReactNode;
  /** Optional label used when reporting the error. */
  name?: string;
  /** Custom fallback; receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = { error: Error | null };

/**
 * Global React error boundary: catches render/lifecycle crashes anywhere in
 * the tree (including 3D canvas and game logic) and shows a friendly screen
 * instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
    reportLovableError(error, { boundary: this.props.name ?? "react_error_boundary" });
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    const network = isNetworkError(error);
    return (
      <ErrorScreen
        title={network ? "We lost the connection" : "Something jammed the machine"}
        message={
          network
            ? "We couldn't reach the server. Check your connection and try again — your progress is saved on this device."
            : "An unexpected glitch stopped this screen from loading. Your progress is saved on this device."
        }
        detail={describeError(error)}
        onRetry={this.reset}
      />
    );
  }
}
