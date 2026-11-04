export function buildNewsArticleJsonLd(opts: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  imageUrl?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: opts.headline,
    description: opts.description,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: {
      "@type": "Person",
      name: opts.authorName,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "Global Voice Network",
      logo: {
        "@type": "ImageObject",
        url: absoluteFallback("/brand/gvn-logo-navy.jpg"),
      },
    },
    mainEntityOfPage: opts.url,
    image: opts.imageUrl ? [opts.imageUrl] : undefined,
  };
}

function absoluteFallback(path: string) {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${path}`;
}

export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
