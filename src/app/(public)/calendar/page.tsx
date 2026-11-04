import type { Metadata } from "next";
import { EthiopianCalendarPage } from "@/components/calendar/EthiopianCalendarPage";
import { getDictionary } from "@/i18n";

const dict = getDictionary("en");

export const metadata: Metadata = {
  title: dict.calendarPage.title,
  description: dict.calendarPage.standfirst,
};

export default function Page() {
  return <EthiopianCalendarPage locale="en" />;
}
