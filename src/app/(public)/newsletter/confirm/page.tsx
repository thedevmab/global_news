import { confirmNewsletter } from "@/server/newsletter/service";

export const metadata = { title: "Confirm subscription", robots: { index: false } };

export default async function ConfirmNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let ok = false;
  let error = "";
  if (token) {
    try {
      await confirmNewsletter(token);
      ok = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "Confirmation failed";
    }
  } else {
    error = "Missing token";
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-3xl font-bold">
        {ok ? "Subscription confirmed" : "Confirmation failed"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {ok
          ? "Thank you. You will receive GVN newsletters."
          : error}
      </p>
    </div>
  );
}
