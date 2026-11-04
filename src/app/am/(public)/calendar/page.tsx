import type { Metadata } from "next";
import { EthiopianCalendarPage } from "@/components/calendar/EthiopianCalendarPage";
import { getDictionary } from "@/i18n";

const dict = getDictionary("am");

export const metadata: Metadata = {
  title: dict.calendarPage.title,
  description: dict.calendarPage.standfirst,
};

export default function Page() {
  return <EthiopianCalendarPage locale="am" />;
}
