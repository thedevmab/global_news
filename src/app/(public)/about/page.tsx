import type { Metadata } from "next";
import { AboutPage } from "@/components/public/AboutPage";
import { getDictionary } from "@/i18n";

const dict = getDictionary("en");

export const metadata: Metadata = {
  title: dict.aboutPage.title,
  description: dict.aboutPage.standfirst,
};

export default function Page() {
  return <AboutPage locale="en" />;
}
