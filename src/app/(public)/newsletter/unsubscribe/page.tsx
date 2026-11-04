export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; token?: string }>;
}) {
  const sp = await searchParams;
  // GET /api/newsletter/unsubscribe?token= redirects here with ok=
  // Also support token on this page via form
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-3xl font-bold">Newsletter unsubscribe</h1>
      <p className="mt-3 text-muted-foreground">
        {sp.ok === "1"
          ? "You have been unsubscribed. You will not receive further newsletters."
          : sp.ok === "0"
            ? "Invalid unsubscribe link."
            : "Use the unsubscribe link from your email to stop receiving newsletters."}
      </p>
    </div>
  );
}
