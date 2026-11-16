import type { Metadata } from "next";
import { NewsPage } from "@/components/public/NewsPage";
import { getDictionary } from "@/i18n";

export const metadata: Metadata = {
  title: getDictionary("en").home.latest,
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  return <NewsPage locale="en" page={page} />;
}
