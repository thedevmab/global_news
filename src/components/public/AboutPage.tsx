import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { categoryBlurb } from "@/lib/category-blurb";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { getActiveCategories } from "@/server/articles/public";

const YOUTUBE_CHANNEL =
  "https://www.youtube.com/@globalvoicenetwork_official";

function categoryName(
  locale: Locale,
  category: { nameEn: string; nameAm: string | null },
) {
  return locale === "am" && category.nameAm ? category.nameAm : category.nameEn;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

function indexLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

const sectionTitle =
  "font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl";

const textLink =
  "font-semibold text-foreground underline decoration-gvn-red decoration-2 underline-offset-4 hover:text-gvn-red";

const navyLink =
  "font-semibold text-white underline decoration-gvn-red decoration-2 underline-offset-4 hover:decoration-white focus-visible:!outline-white";

export async function AboutPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const copy = dict.aboutPage;
  const [categories, authors] = await Promise.all([
    getActiveCategories(),
    prisma.authorProfile.findMany({
      where: { isPublic: true },
      include: { photo: true },
      orderBy: { displayName: "asc" },
      take: 6,
    }),
  ]);

  return (
    <div className="min-w-0">
      <style>{`
        @keyframes about-rise {
          from { opacity: 0; transform: translateY(0.65rem); }
          to { opacity: 1; transform: none; }
        }
        .about-rise { animation: about-rise 0.7s ease both; }
      `}</style>

      <header className="relative isolate overflow-hidden bg-gvn-navy text-white">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[78%] md:w-[46vw]">
          <Image
            src="/images/editorial/skyline-dusk.jpg"
            alt=""
            fill
            priority
            sizes="46vw"
            className="object-cover object-[72%_center]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,#10213a_0%,rgba(16,33,58,0.94)_22%,rgba(16,33,58,0.72)_48%,rgba(16,33,58,0.38)_100%)]"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16 lg:py-20">
          <p
            className={cn(
              "flex items-center gap-3 font-sans font-semibold text-white/80",
              locale === "en"
                ? "text-xs uppercase tracking-[0.18em]"
                : "text-sm",
            )}
          >
            <Image
              src="/brand/gvn-logo-mark.png"
              alt=""
              width={144}
              height={51}
              className="h-6 w-auto"
            />
            <span aria-hidden className="h-px w-8 bg-gvn-red" />
            {copy.eyebrow}
          </p>
          <h1
            className="about-rise mt-6 max-w-6xl font-serif text-[2.65rem] font-semibold text-white sm:text-6xl lg:text-[5rem] xl:text-8xl"
            style={{ lineHeight: locale === "am" ? 1.28 : 1.02 }}
          >
            {copy.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
            {copy.standfirst}
          </p>
          <p className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href={localePath(locale, "/contact")} className={navyLink}>
              {dict.nav.contact}
            </Link>
            <Link href={localePath(locale, "/videos")} className={navyLink}>
              {dict.nav.videos}
            </Link>
          </p>
        </div>
        <div aria-hidden className="relative h-[3px] bg-gvn-red" />
      </header>

      <section className="bg-background">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-14 md:grid-cols-2 md:gap-16 md:py-20 lg:gap-20">
          <p className="font-serif text-xl leading-relaxed text-foreground md:text-[1.65rem] md:leading-snug">
            {copy.lede}
          </p>
          <div className="relative md:pl-10">
            <div
              aria-hidden
              className="mb-8 h-0.5 bg-gvn-red md:absolute md:inset-y-0 md:left-0 md:mb-0 md:h-auto md:w-0.5"
            />
            <h2
              className={cn(
                "font-sans font-semibold text-gvn-red",
                locale === "en"
                  ? "text-xs uppercase tracking-[0.16em]"
                  : "text-sm",
              )}
            >
              {copy.principlesTitle}
            </h2>
            <ol className="mt-6 divide-y divide-border">
              {copy.principles.map((principle, index) => (
                <li key={principle.title} className="py-5 first:pt-0 last:pb-0">
                  <p
                    className="font-sans text-sm font-semibold tabular-nums text-gvn-red"
                    aria-hidden="true"
                  >
                    {indexLabel(index)}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">
                    {principle.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {principle.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="bg-muted">
          <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
            <h2 className={sectionTitle}>{copy.desksTitle}</h2>
            <ul className="mt-8 grid gap-x-10 md:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <li key={category.id} className="border-t border-border">
                  <Link
                    href={localePath(locale, `/${category.slug}`)}
                    className="group block py-5"
                  >
                    <span className="inline-flex items-baseline gap-2 font-serif text-xl font-semibold text-foreground underline decoration-transparent decoration-2 underline-offset-4 group-hover:text-gvn-red group-hover:decoration-gvn-red">
                      {categoryName(locale, category)}
                      <span aria-hidden className="text-sm text-gvn-red">
                        →
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {categoryBlurb(
                        dict,
                        category.slug,
                        locale === "am" ? null : category.description,
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
          <h2 className={sectionTitle}>{copy.processTitle}</h2>
          <ol className="relative mt-10 grid gap-10 md:mt-12 md:grid-cols-3 md:gap-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-6 hidden h-px bg-border md:block"
            />
            {copy.steps.map((step, index) => (
              <li key={step.title} className="relative">
                <p
                  className="relative z-10 w-fit bg-background pr-4 font-serif text-5xl font-semibold leading-none tabular-nums text-gvn-red"
                  aria-hidden="true"
                >
                  {indexLabel(index)}
                </p>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {authors.length > 0 ? (
        <section className="bg-muted">
          <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
            <h2 className={sectionTitle}>{copy.peopleTitle}</h2>
            <ul className="mt-8 grid gap-x-10 gap-y-10 lg:grid-cols-3">
              {authors.map((author) => {
                const photo = mediaUrl(author.photo?.storageKey);
                return (
                  <li key={author.id} className="min-w-0 border-t border-border pt-5">
                    {photo ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gvn-navy">
                        <Image
                          src={photo}
                          alt={author.displayName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        aria-hidden
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-gvn-navy font-serif text-lg text-white"
                      >
                        {initials(author.displayName)}
                      </div>
                    )}
                    <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
                      {author.displayName}
                    </h3>
                    {author.bio ? (
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {author.bio}
                      </p>
                    ) : null}
                    <Link
                      href={localePath(locale, `/author/${author.username}`)}
                      className={cn("mt-3 inline-block text-sm", textLink)}
                    >
                      {copy.peopleLink}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {copy.alsoTitle}
          </h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <div className="min-w-0 border-t border-border pt-4">
              <Link
                href={localePath(locale, "/videos")}
                className="font-serif text-xl font-semibold text-foreground hover:text-gvn-red"
              >
                {copy.videosCta}
              </Link>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {copy.videosBlurb}
              </p>
              <a
                href={YOUTUBE_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("mt-3 inline-block text-sm", textLink)}
              >
                {copy.watchChannel}
              </a>
            </div>
            <div className="min-w-0 border-t border-border pt-4">
              <Link
                href={localePath(locale, "/podcasts")}
                className="font-serif text-xl font-semibold text-foreground hover:text-gvn-red"
              >
                {dict.nav.podcasts}
              </Link>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {copy.podcastsBlurb}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gvn-navy text-white">
        <div aria-hidden className="h-[3px] bg-gvn-red" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 pt-12 md:pb-24 lg:flex-row lg:items-end lg:justify-between lg:pt-14">
          <div className="max-w-xl min-w-0">
            <h2 className="font-serif text-3xl font-semibold leading-tight text-white md:text-4xl">
              {copy.closeTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75 md:text-base">
              {copy.closeText}
            </p>
            <Link
              href={localePath(locale, "/contact")}
              className={cn("mt-6 inline-block text-base", navyLink)}
            >
              {copy.contactCta}
            </Link>
          </div>
          <div className="w-full min-w-0 lg:max-w-md lg:shrink-0">
            <NewsletterForm
              dict={dict}
              locale={locale}
              variant="inline"
              tone="onDark"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
