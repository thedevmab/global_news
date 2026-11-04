import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { getDictionary } from "@/i18n";

export const metadata: Metadata = { title: "አግኙን" };

export default function Page() {
  const dict = getDictionary("am");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-center font-serif text-3xl font-semibold">
        {dict.contact.title}
      </h1>
      <ContactForm locale="am" />
    </div>
  );
}
