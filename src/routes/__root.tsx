import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { initPlaygama } from "../lib/playgama";
import { ErrorScreen, describeError, isNetworkError } from "../components/ErrorScreen";
import { ErrorBoundary } from "../components/ErrorBoundary";

function NotFoundComponent() {
  return (
    <ErrorScreen
      code="404"
      title="This booth is closed"
      message="We couldn't find that page. It may have been packed up or the link is misspelled."
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const network = isNetworkError(error);

  return (
    <ErrorScreen
      title={network ? "We lost the connection" : "This page didn't load"}
      message={
        network
          ? "We couldn't reach the server. Check your connection and try again — your progress is saved on this device."
          : "Something went wrong while setting up this screen. You can retry or head back to the main menu."
      }
      detail={describeError(error)}
      onRetry={() => {
        router.invalidate();
        reset();
      }}
    />
  );
}


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { title: "Toy Blitz Carnival — 3D Shooting Gallery Arcade" },
      {
        name: "description",
        content:
          "A fast 3D carnival shooting gallery: blast plush toys, build combos and win tickets for the prize shop.",
      },
      { property: "og:title", content: "Toy Blitz Carnival — 3D Shooting Gallery Arcade" },
      {
        property: "og:description",
        content: "Blast plush toys, build combos and win tickets in this 3D carnival arcade game.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
    // Platform requirement: the Playgama Bridge SDK must be present in index.html
    // so the portal can detect it before the game boots.
    scripts: [{ src: "https://bridge.playgama.com/v2/stable/playgama-bridge.js" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Kick off Playgama Bridge initialization at startup so the platform receives
  // the init signal well within its 30s window, before the game finishes loading.
  useEffect(() => {
    void initPlaygama();
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      {/* Global boundary: catches render crashes in any screen. */}
      <ErrorBoundary name="root_react_boundary">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </ErrorBoundary>
    </QueryClientProvider>
  );

}
