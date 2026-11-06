import { ContactForm } from "@/components/forms/ContactForm";
import { SocialLinks } from "@/components/media/SocialLinks";
import { getDictionary, type Locale } from "@/i18n";
import { parseSiteSettings } from "@/lib/site-settings";
import { getSiteSettingsRow } from "@/server/articles/public";

export async function ContactPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const settingsRow = await getSiteSettingsRow();
  const settings = parseSiteSettings(settingsRow?.data);

  return (
    <div className="bg-background">
      <header className="border-b border-border bg-background text-foreground dark:bg-inverse dark:text-inverse-foreground">
        <div aria-hidden className="h-[3px] bg-gvn-red" />
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-gvn-navy dark:text-white md:text-5xl">
            {dict.contact.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground dark:text-white/75 md:text-lg">
            {dict.contact.intro}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-12 px-4 py-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-16 md:py-16">
        <section aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading" className="sr-only">
            {dict.contact.submit}
          </h2>
          <ContactForm locale={locale} />
        </section>

        <aside className="space-y-4 md:border-l md:border-border md:pl-12">
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {dict.contact.socialTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {dict.contact.socialIntro}
          </p>
          <SocialLinks
            links={settings.socialLinks}
            tone="onLight"
            size="lg"
            className="pt-2"
          />
        </aside>
      </div>
    </div>
  );
}
