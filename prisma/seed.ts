import {
  ArticleStatus,
  ContentLanguage,
  PrismaClient,
  Role,
  UserStatus,
  AdSlotKey,
} from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { nameEn: "Politics", nameAm: "ፖለቲካ", slug: "politics", color: "#10213A", sortOrder: 1 },
  { nameEn: "Business", nameAm: "ቢዝነስ", slug: "business", color: "#2B6CB0", sortOrder: 2 },
  { nameEn: "Technology", nameAm: "ቴክኖሎጂ", slug: "technology", color: "#2C7A7B", sortOrder: 3 },
  { nameEn: "Sports", nameAm: "ስፖርት", slug: "sports", color: "#C05621", sortOrder: 4 },
  { nameEn: "Entertainment", nameAm: "መዝናኛ", slug: "entertainment", color: "#805AD5", sortOrder: 5 },
  { nameEn: "World", nameAm: "ዓለም", slug: "world", color: "#E63946", sortOrder: 6 },
  { nameEn: "National", nameAm: "ብሔራዊ", slug: "national", color: "#1A365D", sortOrder: 7 },
];

const STATIC_PAGES = [
  { slug: "about", title: "About Global Voice Network" },
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "terms", title: "Terms and Conditions" },
  { slug: "advertise", title: "Advertise with GVN" },
  { slug: "contact", title: "Contact" },
];

const emptyDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Content coming soon." }],
    },
  ],
};

function articleDoc(paragraphs: string[]) {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

async function ensureSuperAdmin() {
  const existingSuper = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN, deletedAt: null },
    include: { authorProfile: true },
  });
  if (existingSuper) {
    if (!existingSuper.authorProfile) {
      await prisma.authorProfile.create({
        data: {
          userId: existingSuper.id,
          displayName: existingSuper.name,
          username: "gvn-admin",
          bio: "Platform administrator",
          isPublic: false,
        },
      });
      return prisma.user.findFirstOrThrow({
        where: { id: existingSuper.id },
        include: { authorProfile: true },
      });
    }
    return existingSuper;
  }

  const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "GVN Super Admin";

  // Never invent a default production password.
  if (!email || !password) {
    console.warn(
      "Seed: no Super Admin found and INITIAL_ADMIN_EMAIL/PASSWORD are unset. Skipping admin bootstrap (use npm run setup:admin).",
    );
    return null;
  }

  const emailNormalized = email.toLowerCase();
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  return prisma.user.create({
    data: {
      email,
      emailNormalized,
      passwordHash,
      name,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      authorProfile: {
        create: {
          displayName: name,
          username: "gvn-admin",
          bio: "Platform administrator",
          isPublic: false,
        },
      },
    },
    include: { authorProfile: true },
  });
}

async function ensureStarterArticles(
  admin: NonNullable<Awaited<ReturnType<typeof ensureSuperAdmin>>>,
) {
  const publishedCount = await prisma.article.count({
    where: { status: ArticleStatus.PUBLISHED, deletedAt: null },
  });
  if (publishedCount > 0) {
    console.log(`Seed: ${publishedCount} published articles already present.`);
    return;
  }

  const bySlug = Object.fromEntries(
    (
      await prisma.category.findMany({
        where: { parentId: null, isActive: true },
      })
    ).map((c) => [c.slug, c]),
  );

  const stories = [
    {
      slug: "mekelle-vehicle-curfew",
      language: ContentLanguage.am,
      category: "politics",
      headline:
        "በመቐለ ከተማ ማንኛውም ተሽከርካሪ ከዛሬ ጀምሮ ከምሽቱ 2 ሰዓት እስከ ንጋት 12 ሰዓት ባለው ጊዜ ውስጥ እንዳይንቀሳቀስ የሰዓት እላፊ ገደብ ተጣለ።",
      summary:
        "በመቐለ ከተማ የተጣለ የሰዓት እላፊ ገደብ ከምሽቱ 2 ሰዓት እስከ ንጋት 12 ሰዓት ተሽከርካሪ እንዳይንቀሳቀስ ያዛል።",
      paragraphs: [
        "በመቐለ ከተማ ማንኛውም ተሽከርካሪ ከዛሬ ጀምሮ ከምሽቱ 2 ሰዓት እስከ ንጋት 12 ሰዓት ባለው ጊዜ ውስጥ እንዳይንቀሳቀስ የሰዓት እላፊ ገደብ ተጣለ።",
        "ባለሥልጣናት ደህንነትን ለማጠናከር እርምጃው አስፈላጊ መሆኑን አስታውቀዋል። ግሎባል ቮይስ ኔትወርክ እድገቱን ይከታተላል።",
      ],
      daysAgo: 0,
      featured: true,
      breaking: true,
    },
    {
      slug: "ethiopia-navy-reorganization",
      language: ContentLanguage.am,
      category: "politics",
      headline:
        "የኢትዮጵያ ባህር ኃይል በአየር፣ በየብስ እና በባህር ዘመቻዎችን መፈጸም በሚያስችል መልኩ እንደገና መደራጀቱን አስታወቀ",
      summary:
        "የኢትዮጵያ ባህር ኃይል በአየር፣ በብስ እና በባህር እንዲሰራ እንደገና መደራጀቱን አስታወቀ።",
      paragraphs: [
        "የኢትዮጵያ ባህር ኃይል በአየር፣ በየብስ እና በባህር ዘመቻዎችን መፈጸም በሚያስችል መልኩ እንደገና መደራጀቱን አስታወቀ።",
        "ባለሥልጣናት ስልጠና እና ዘመናዊ መሣሪያ ቅድሚያ እንደሚሰጡ ገልጸዋል።",
      ],
      daysAgo: 0,
    },
    {
      slug: "ethiopia-economic-reforms",
      language: ContentLanguage.am,
      category: "business",
      headline: "ኢትዮጵያ አዲስ የኢኮኖሚ ማሻሻያ አወጣች",
      summary:
        "የኢትዮጵያ መንግስት እድገትን ለማፋጠን የተዘጋጀ አዲስ የኢኮኖሚ ማሻሻያ አስታውቋል።",
      paragraphs: [
        "የኢትዮጵያ መንግስት እድገትን ለማፋጠን፣ ኢንቨስትመንትን ለመሳብ እና ስራ ለመፍጠር የተዘጋጀ አዲስ የኢኮኖሚ ማሻሻያ አስታውቋል።",
        "ግብርና፣ ማምረቻ፣ ኃይል እና ዲጂታል አገልግሎት ቅድሚያ የተሰጣቸው ዘርፎች ናቸው።",
      ],
      daysAgo: 1,
    },
    {
      slug: "ai-innovation-center-addis",
      language: ContentLanguage.am,
      category: "technology",
      headline: "በአዲስ አበባ አዲስ የሰው ሰራሽ አስተውሎት ማዕከል ተከፈተ",
      summary:
        "በአዲስ አበባ የተከፈተ ማዕከል የአካባቢ ቋንቋዎችን የሚደግፉ የሰው ሰራሽ አስተውሎት መሣሪያዎችን ይሞክራል።",
      paragraphs: [
        "ባለሥልጣናት በአዲስ አበባ የሰው ሰራሽ አስተውሎት ማዕከል ከፈቱ።",
        "ተልዕኮው በአማርኛ እና በሌሎች የአካባቢ ቋንቋዎች ለጤና፣ ለግብርና እና ለፈቃድ አገልግሎት የሚጠቅሙ መሣሪያዎችን መሞከር ነው።",
      ],
      daysAgo: 2,
    },
    {
      slug: "premier-league-weekend-preview",
      language: ContentLanguage.en,
      category: "sports",
      headline: "Premier League weekend: title race stays tight",
      summary:
        "Arsenal, Manchester City, and the chasing pack head into a decisive stretch of fixtures.",
      paragraphs: [
        "The Premier League title race remains open as the weekend fixtures approach.",
        "Global Voice Network continues live coverage from the EPL board on the Sports page.",
      ],
      daysAgo: 1,
    },
    {
      slug: "addis-film-festival-opens",
      language: ContentLanguage.en,
      category: "entertainment",
      headline: "Addis film festival opens with regional premieres",
      summary:
        "Filmmakers from Ethiopia and across East Africa gather for a week of premieres and workshops.",
      paragraphs: [
        "The Addis film festival opened with a packed premiere night.",
        "Organizers say the program highlights new voices in Ethiopian and regional cinema.",
      ],
      daysAgo: 3,
    },
    {
      slug: "horn-diplomacy-update",
      language: ContentLanguage.en,
      category: "world",
      headline: "Horn of Africa diplomacy enters a careful new chapter",
      summary:
        "Regional leaders signal talks on trade corridors and security cooperation.",
      paragraphs: [
        "Diplomats across the Horn of Africa are testing a quieter path on trade and security.",
        "Analysts say the coming weeks will show whether the talks produce durable agreements.",
      ],
      daysAgo: 2,
    },
  ];

  const now = Date.now();
  for (const story of stories) {
    const category = bySlug[story.category];
    if (!category) continue;

    const publishedAt = new Date(now - story.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.article.upsert({
      where: {
        slug_language: { slug: story.slug, language: story.language },
      },
      update: {},
      create: {
        slug: story.slug,
        headline: story.headline,
        summary: story.summary.slice(0, 300),
        body: articleDoc(story.paragraphs),
        status: ArticleStatus.PUBLISHED,
        language: story.language,
        categoryId: category.id,
        authorId: admin.id,
        authorProfileId: admin.authorProfile?.id,
        seoTitle: story.headline.slice(0, 70),
        seoDescription: story.summary.slice(0, 160),
        isFeatured: Boolean(story.featured),
        isBreaking: Boolean(story.breaking),
        breakingExpiresAt: story.breaking
          ? new Date(now + 3 * 24 * 60 * 60 * 1000)
          : null,
        publishedAt,
        readingTimeMinutes: Math.max(
          1,
          Math.ceil(story.paragraphs.join(" ").split(/\s+/).length / 200),
        ),
      },
    });
  }

  console.log(`Seed: created ${stories.length} starter published articles.`);
}

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameEn: cat.nameEn,
        nameAm: cat.nameAm,
        color: cat.color,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: cat,
    });
  }

  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });
  await prisma.homepageCategory.deleteMany();
  for (let i = 0; i < categories.length; i++) {
    await prisma.homepageCategory.create({
      data: { categoryId: categories[i].id, position: i + 1 },
    });
  }

  for (const key of Object.values(AdSlotKey)) {
    await prisma.adSlot.upsert({
      where: { key },
      update: {},
      create: {
        key,
        name: key.replace("_", " "),
        description: `${key} advertisement slot`,
      },
    });
  }

  for (const page of STATIC_PAGES) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        slug: page.slug,
        title: page.title,
        body: emptyDoc,
        published: true,
        seoTitle: page.title,
      },
    });
  }

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      data: {
        siteName: "Global Voice Network",
        tagline: "Independent international news",
        contactEmail: "contact@example.com",
        phone: "",
        address: "",
        socialLinks: {
          facebook: "",
          x: "",
          youtube: "",
          telegram: "",
          linkedin: "",
        },
        seoTitleTemplate: "%s | Global Voice Network",
        defaultOgImage: "/brand/gvn-logo-navy.jpg",
        googleAnalyticsId: "",
        searchConsoleVerification: "",
        maintenanceMode: false,
        logoPath: "/brand/gvn-logo-navy.jpg",
        faviconPath: "/brand/gvn-logo-navy.jpg",
      },
    },
  });

  const navItems = [
    { labelEn: "Home", labelAm: "መነሻ", href: "/", location: "header", sortOrder: 0 },
    { labelEn: "Videos", labelAm: "ቪዲዮ", href: "/videos", location: "header", sortOrder: 90 },
    { labelEn: "Podcasts", labelAm: "ፖድካስት", href: "/podcasts", location: "header", sortOrder: 91 },
    { labelEn: "About", labelAm: "ስለ እኛ", href: "/about", location: "footer", sortOrder: 1 },
    { labelEn: "Contact", labelAm: "አግኙን", href: "/contact", location: "footer", sortOrder: 2 },
    { labelEn: "Privacy", labelAm: "ግላዊነት", href: "/page/privacy", location: "footer", sortOrder: 3 },
    { labelEn: "Terms", labelAm: "ውሎች", href: "/page/terms", location: "footer", sortOrder: 4 },
    { labelEn: "Advertise", labelAm: "ማስታወቂያ", href: "/page/advertise", location: "footer", sortOrder: 5 },
  ];

  for (const item of navItems) {
    const existing = await prisma.navigationItem.findFirst({
      where: { href: item.href, location: item.location },
    });
    if (!existing) {
      await prisma.navigationItem.create({ data: item });
    }
  }

  const admin = await ensureSuperAdmin();
  if (admin) {
    await ensureStarterArticles(admin);
  }

  console.log(
    "Seed completed: categories, settings, ad slots, pages, navigation, admin (if configured), starter articles.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
