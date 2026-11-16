import type { Metadata } from "next";
import { SearchPage } from "@/components/search/SearchPage";

export const metadata: Metadata = { title: "Search" };

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SearchPage locale="en" searchParams={searchParams} />;
}
