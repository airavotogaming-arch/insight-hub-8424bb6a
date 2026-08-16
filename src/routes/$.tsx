import { createFileRoute } from "@tanstack/react-router";
import { ErrorScreen } from "@/components/ErrorScreen";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page not found — Toy Blitz Carnival" },
      {
        name: "description",
        content: "This carnival booth doesn't exist. Head back to Toy Blitz Carnival to keep playing.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Page not found — Toy Blitz Carnival" },
      {
        property: "og:description",
        content: "This carnival booth doesn't exist. Head back to the arcade to keep playing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatchAll,
});

function CatchAll() {
  return (
    <ErrorScreen
      code="404"
      title="This booth is closed"
      message="We couldn't find that page. It may have been packed up or the link is misspelled."
    />
  );
}
