export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground dark:bg-gvn-deep-navy dark:text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gvn-red">
        Global Voice Network
      </p>
      <h1 className="mt-4 font-serif text-4xl font-semibold text-gvn-navy dark:text-white">
        We&apos;ll be right back
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground dark:text-white/70">
        The site is temporarily under maintenance. Please check again shortly.
      </p>
    </main>
  );
}
