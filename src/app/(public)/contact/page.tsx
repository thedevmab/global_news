import { ContactForm } from "@/components/forms/ContactForm";
import { getDictionary } from "@/i18n";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  const dict = getDictionary("en");
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 font-serif text-4xl font-bold">{dict.contact.title}</h1>
      <p className="mb-8 text-muted-foreground">
        Send a message to the Global Voice Network newsroom.
      </p>
      <ContactForm locale="en" />
    </div>
  );
}
