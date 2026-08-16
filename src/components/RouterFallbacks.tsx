import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { ErrorScreen, describeError, isNetworkError } from "./ErrorScreen";
import { reportLovableError } from "@/lib/lovable-error-reporting";

/** Router-wide fallback for any route that throws while loading or rendering. */
export function DefaultErrorScreen({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "router_default_error_component" });
  }, [error]);

  const network = isNetworkError(error);

  return (
    <ErrorScreen
      title={network ? "We lost the connection" : "This screen didn't load"}
      message={
        network
          ? "We couldn't reach the server. Check your connection and try again — your progress is saved on this device."
          : "Something went wrong loading this part of the carnival. Retry, or head back to the main menu."
      }
      detail={describeError(error)}
      onRetry={() => {
        router.invalidate();
        reset();
      }}
    />
  );
}

/** Router-wide fallback for unmatched URLs and missing resources. */
export function DefaultNotFoundScreen() {
  return (
    <ErrorScreen
      code="404"
      title="This booth is closed"
      message="We couldn't find that page. It may have been packed up or the link is misspelled."
    />
  );
}
