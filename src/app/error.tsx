"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <Button type="button" className="mt-8" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
