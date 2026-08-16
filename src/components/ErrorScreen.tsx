import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type ErrorScreenProps = {
  code?: string;
  title: string;
  message: string;
  detail?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
};

/**
 * Shared, carnival-styled screen used for every user-facing failure:
 * unmatched routes, loader/render crashes and asset/network problems.
 */
export function ErrorScreen({
  code,
  title,
  message,
  detail,
  onRetry,
  retryLabel = "Try again",
  children,
}: ErrorScreenProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 text-center shadow-xl backdrop-blur">
        {code ? (
          <p
            className="text-6xl leading-none text-fair-gold"
            style={{ fontFamily: "var(--font-fair)" }}
          >
            {code}
          </p>
        ) : (
          <p className="text-5xl leading-none" aria-hidden="true">
            🎪
          </p>
        )}
        <h1
          className="mt-4 text-xl text-card-foreground"
          style={{ fontFamily: "var(--font-fair)" }}
        >
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        {detail ? (
          <p className="mt-3 break-words rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            {detail}
          </p>
        ) : null}
        {children}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {retryLabel}
            </button>
          ) : null}
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Back to the carnival
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Human-readable text for an unknown thrown value, or null when unhelpful. */
export function describeError(error: unknown): string | null {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  const trimmed = message.trim();
  if (!trimmed || trimmed.toLowerCase() === "error") return null;
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

/** True when the failure looks like a network/API problem rather than a bug. */
export function isNetworkError(error: unknown): boolean {
  const text = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    text.includes("fetch") ||
    text.includes("network") ||
    text.includes("failed to load") ||
    text.includes("timeout") ||
    text.includes("offline")
  );
}
