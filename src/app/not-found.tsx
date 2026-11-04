import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-gvn-red">
        404
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        The page you are looking for does not exist or is no longer published.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center rounded-md bg-gvn-navy px-5 text-sm font-semibold text-white hover:bg-gvn-deep-navy"
      >
        Back to homepage
      </Link>
    </div>
  );
}
