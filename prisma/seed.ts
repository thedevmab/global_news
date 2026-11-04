import { PrismaClient, AdSlotKey } from "@prisma/client";

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

  const emptyDoc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Content coming soon.",
          },
        ],
      },
    ],
  };

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

  console.log("Seed completed: categories, settings, ad slots, static pages, navigation.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
