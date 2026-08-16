import { useState, type ImgHTMLAttributes } from "react";

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Emoji or short text shown when the image fails to load. */
  fallbackLabel?: string;
};

/**
 * Image that degrades gracefully when an asset fails to download
 * (offline, blocked CDN, missing file) instead of showing a broken icon.
 */
export function SafeImage({
  fallbackLabel = "🎈",
  className,
  alt,
  onError,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt || "Image unavailable"}
        className={`inline-flex items-center justify-center rounded-md bg-muted/60 text-muted-foreground ${className ?? ""}`}
      >
        {fallbackLabel}
      </span>
    );
  }

  return (
    <img
      {...props}
      alt={alt}
      className={className}
      onError={(event) => {
        console.warn("Asset failed to load:", props.src);
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
