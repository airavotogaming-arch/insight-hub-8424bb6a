import { QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { DefaultErrorScreen, DefaultNotFoundScreen } from "./components/RouterFallbacks";

// The zip/portal build (STATIC=1) is served from an arbitrary sub-path
// (e.g. /qa-tool/<id>/index.html), where a path-based history would look for a
// route named after that folder and render the 404 page. Hash history keeps the
// app anchored at "/" no matter which folder index.html lives in.
const useHashHistory =
  import.meta.env["VITE_STATIC"] === "1" && typeof window !== "undefined";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        // Surface failed data fetches to the nearest error boundary instead of
        // leaving the UI stuck in a loading state.
        throwOnError: true,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorScreen,
    defaultNotFoundComponent: DefaultNotFoundScreen,
    ...(useHashHistory ? { history: createHashHistory() } : {}),
  });

  return router;
};
