"use client";

import { SessionProvider } from "next-auth/react";

/** Admin session wrapper — theme comes from the root ThemeProvider only. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
