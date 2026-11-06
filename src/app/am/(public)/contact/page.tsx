import type { Metadata } from "next";
import { ContactPage } from "@/components/public/ContactPage";

export const metadata: Metadata = { title: "አግኙን" };

export default function Page() {
  return <ContactPage locale="am" />;
}
