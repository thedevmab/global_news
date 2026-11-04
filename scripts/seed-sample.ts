/**
 * Sample newsroom content for local preview.
 * Idempotent: re-running updates the same slugs.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  ArticleStatus,
  ContentLanguage,
  HomepageSlotType,
  PrismaClient,
  Role,
} from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();

type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function textNode(text: string) {
  return { type: "text", text };
}

function doc(blocks: Block[]) {
  return {
    type: "doc",
    content: blocks.map((block) => {
      if (block.type === "p") {
        return { type: "paragraph", content: [textNode(block.text)] };
      }
      if (block.type === "h2" || block.type === "h3") {
        return {
          type: "heading",
          attrs: { level: block.type === "h2" ? 2 : 3 },
          content: [textNode(block.text)],
        };
      }
      if (block.type === "quote") {
        return {
          type: "blockquote",
          content: [
            { type: "paragraph", content: [textNode(block.text)] },
          ],
        };
      }
      const listType = block.type === "ul" ? "bulletList" : "orderedList";
      return {
        type: listType,
        content: block.items.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: [textNode(item)] }],
        })),
      };
    }),
  };
}

function words(blocks: Block[]) {
  return blocks
    .map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : ""))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function daysAgo(n: number, hours = 8) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, 15, 0, 0);
  return d;
}

async function toneWav(filePath: string, seconds = 12) {
  const sampleRate = 22050;
  const count = sampleRate * seconds;
  const data = Buffer.alloc(count * 2);
  for (let i = 0; i < count; i++) {
    const env = Math.min(1, i / 2000, (count - i) / 2000);
    const sample = Math.sin((2 * Math.PI * 220 * i) / sampleRate) * 0.08 * env;
    data.writeInt16LE(Math.round(sample * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.concat([header, data]));
}

async function main() {
  const editor = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN, deletedAt: null },
  });
  if (!editor) {
    throw new Error("Run npm run setup:admin before seeding sample news.");
  }

  await prisma.article.updateMany({
    where: { slug: { startsWith: "integration-workflow" } },
    data: {
      status: ArticleStatus.ARCHIVED,
      isBreaking: false,
      hideFromHomepage: true,
      publishedAt: null,
    },
  });

  const categorySlugs = [
    "politics",
    "business",
    "technology",
    "sports",
    "entertainment",
    "world",
    "national",
  ] as const;
  const categories = Object.fromEntries(
    await Promise.all(
      categorySlugs.map(async (slug) => {
        const row = await prisma.category.findUnique({ where: { slug } });
        if (!row) throw new Error(`Missing category ${slug}. Run db:seed first.`);
        return [slug, row] as const;
      }),
    ),
  );

  await prisma.category.update({
    where: { slug: "politics" },
    data: {
      description: "Power, policy, and public life across Ethiopia and the region.",
    },
  });
  await prisma.category.update({
    where: { slug: "business" },
    data: {
      description: "Markets, companies, and the economy from Addis Ababa outward.",
    },
  });
  await prisma.category.update({
    where: { slug: "technology" },
    data: { description: "Innovation, digital policy, and the tools reshaping work." },
  });
  await prisma.category.update({
    where: { slug: "sports" },
    data: { description: "Competition, athletes, and the stories behind the score." },
  });
  await prisma.category.update({
    where: { slug: "entertainment" },
    data: { description: "Film, music, and culture from Ethiopia and abroad." },
  });
  await prisma.category.update({
    where: { slug: "world" },
    data: { description: "Global affairs with consequences at home." },
  });
  await prisma.category.update({
    where: { slug: "national" },
    data: { description: "Reporting from cities and regions across the country." },
  });

  const authors = [
    {
      username: "mesfin-tesfaye",
      displayName: "Mesfin Tesfaye",
      bio: "GVN politics correspondent based in Addis Ababa. Covers parliament, diplomacy, and economic policy.",
    },
    {
      username: "sara-bekele",
      displayName: "Sara Bekele",
      bio: "Business and technology reporter. Previously covered aviation and capital markets.",
    },
    {
      username: "yonas-alemayehu",
      displayName: "Yonas Alemayehu",
      bio: "Sports and culture editor. Follows athletics, football, and the Ethiopian screen.",
    },
  ];
  const authorByName: Record<string, string> = {};
  for (const author of authors) {
    const row = await prisma.authorProfile.upsert({
      where: { username: author.username },
      update: { displayName: author.displayName, bio: author.bio, isPublic: true },
      create: { ...author, isPublic: true },
    });
    authorByName[author.displayName] = row.id;
  }

  const uploadDir = path.resolve("uploads/sample");
  await mkdir(uploadDir, { recursive: true });
  const sources = {
    skyline: path.resolve("public/images/editorial/skyline-dusk.jpg"),
    night: path.resolve("public/images/editorial/city-night.jpg"),
    globe: path.resolve("public/images/editorial/globe-editorial.jpg"),
  };
  const variants: {
    key: string;
    source: string;
    position: string;
    brightness: number;
    alt: string;
    caption: string;
    credit: string;
  }[] = [
    {
      key: "reforms",
      source: sources.skyline,
      position: "centre",
      brightness: 1,
      alt: "Addis Ababa skyline at dusk",
      caption: "Addis Ababa at dusk. Sample photograph for the GVN preview.",
      credit: "GVN",
    },
    {
      key: "energy",
      source: sources.night,
      position: "left",
      brightness: 1.05,
      alt: "City towers lit at night",
      caption: "Evening lights over the business district.",
      credit: "GVN",
    },
    {
      key: "tech",
      source: sources.night,
      position: "right",
      brightness: 0.92,
      alt: "Night city used as a technology section image",
      caption: "A night view used for the technology sample story.",
      credit: "GVN",
    },
    {
      key: "sports",
      source: sources.skyline,
      position: "top",
      brightness: 1.08,
      alt: "Skyline cropped for a sports sample story",
      caption: "Sample image for sports coverage.",
      credit: "GVN",
    },
    {
      key: "film",
      source: sources.globe,
      position: "centre",
      brightness: 0.95,
      alt: "Globe used for an entertainment sample story",
      caption: "Sample image for culture coverage.",
      credit: "GVN",
    },
    {
      key: "world",
      source: sources.globe,
      position: "entropy",
      brightness: 1.1,
      alt: "Globe representing international news",
      caption: "Sample image for world news.",
      credit: "GVN",
    },
    {
      key: "airline",
      source: sources.skyline,
      position: "bottom",
      brightness: 0.9,
      alt: "Skyline used for an aviation business story",
      caption: "Sample image for business coverage.",
      credit: "GVN",
    },
    {
      key: "national",
      source: sources.night,
      position: "centre",
      brightness: 1.12,
      alt: "City night used for a national news story",
      caption: "Sample image for national news.",
      credit: "GVN",
    },
  ];

  const mediaIds: Record<string, string> = {};
  for (const variant of variants) {
    const filename = `${variant.key}.jpg`;
    const absolute = path.join(uploadDir, filename);
    await sharp(variant.source)
      .resize(1600, 900, { fit: "cover", position: variant.position })
      .modulate({ brightness: variant.brightness })
      .jpeg({ quality: 82 })
      .toFile(absolute);
    const storageKey = `sample/${filename}`;
    const existing = await prisma.media.findFirst({
      where: { storageKey },
    });
    const media = existing
      ? await prisma.media.update({
          where: { id: existing.id },
          data: {
            altText: variant.alt,
            caption: variant.caption,
            credit: variant.credit,
            width: 1600,
            height: 900,
            mimeType: "image/jpeg",
          },
        })
      : await prisma.media.create({
          data: {
            kind: "IMAGE",
            originalName: filename,
            mimeType: "image/jpeg",
            sizeBytes: 180000,
            storageKey,
            width: 1600,
            height: 900,
            altText: variant.alt,
            caption: variant.caption,
            credit: variant.credit,
            uploadedById: editor.id,
          },
        });
    mediaIds[variant.key] = media.id;
  }

  const tagNames = [
    "Economy",
    "Reforms",
    "Addis Ababa",
    "Energy",
    "Aviation",
    "Football",
    "Athletics",
    "Film",
    "Diplomacy",
    "Startups",
  ];
  const tagIds: Record<string, string> = {};
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    tagIds[name] = tag.id;
  }

  type Story = {
    slug: string;
    language?: ContentLanguage;
    translationOf?: string;
    headline: string;
    subheadline: string;
    summary: string;
    category: (typeof categorySlugs)[number];
    author: string;
    image: string;
    tags: string[];
    days: number;
    views: number;
    breaking?: boolean;
    blocks: Block[];
  };

  const stories: Story[] = [
    {
      slug: "ethiopia-economic-reforms",
      headline: "Ethiopia announces new economic reforms to drive sustainable growth",
      subheadline:
        "The package pairs investment incentives with a public pledge to widen opportunity beyond the capital.",
      summary:
        "The government unveiled a comprehensive set of economic reforms aimed at boosting investment, creating jobs, and ensuring long-term stability.",
      category: "politics",
      author: "Mesfin Tesfaye",
      image: "reforms",
      tags: ["Economy", "Reforms", "Addis Ababa"],
      days: 0,
      views: 4820,
      breaking: true,
      blocks: [
        {
          type: "p",
          text: "The Ethiopian government has announced a new set of economic reforms designed to accelerate growth, attract investment, and create jobs across the country. Officials said the package focuses on agriculture, manufacturing, energy, and digital services.",
        },
        {
          type: "p",
          text: "Speaking in Addis Ababa, the prime minister framed the plan as a shift from short projects toward rules that investors and local firms can plan around. Ministries were told to publish implementation calendars within 30 days.",
        },
        {
          type: "quote",
          text: "This is not just about economic growth, but about creating opportunities for every Ethiopian, in every region.",
        },
        {
          type: "h2",
          text: "What is in the package",
        },
        {
          type: "ul",
          items: [
            "Faster licensing for export manufacturers outside Addis Ababa",
            "A clearer path for private investment in power distribution",
            "Expanded credit guarantees for small manufacturers",
            "A public dashboard tracking jobs tied to new permits",
          ],
        },
        {
          type: "p",
          text: "Business associations welcomed the direction but asked for detail on foreign-exchange access. Labor groups said training funds must reach regional colleges, not only firms already based in the capital.",
        },
        {
          type: "h2",
          text: "What happens next",
        },
        {
          type: "p",
          text: "Parliament is expected to debate enabling legislation this month. GVN will track which measures take effect, which slip, and how regional governments say the package lands outside Addis Ababa.",
        },
      ],
    },
    {
      slug: "green-energy-investment-wave",
      headline: "New investment wave targets Ethiopia's green energy sector",
      subheadline:
        "Developers are lining up wind, solar, and grid projects as power demand from factories keeps rising.",
      summary:
        "A cluster of energy investors is preparing projects aimed at expanding renewable power and stabilizing supply for manufacturers.",
      category: "business",
      author: "Sara Bekele",
      image: "energy",
      tags: ["Energy", "Economy"],
      days: 1,
      views: 2210,
      breaking: true,
      blocks: [
        {
          type: "p",
          text: "Energy developers say a new round of proposals could add wind and solar capacity while private operators help maintain lines that factories depend on. The pitch is simple: reliable power is now a competition issue, not only a utility issue.",
        },
        {
          type: "h2",
          text: "Where the money is pointing",
        },
        {
          type: "p",
          text: "Advisers working with the projects told GVN that the first sites are clustered near industrial parks that already report outages during peak hours. Several bids pair generation with storage so evening shifts are not the first to go dark.",
        },
        {
          type: "quote",
          text: "A factory cannot export on a promise. It needs hours of power it can put on a schedule.",
        },
        {
          type: "p",
          text: "Regulators still have to settle tariffs and who pays when a private line crosses public land. Those decisions will decide whether this wave is a press release or steel in the ground.",
        },
      ],
    },
    {
      slug: "ai-innovation-center-addis",
      headline: "Ethiopia launches AI innovation center in Addis Ababa",
      subheadline:
        "The lab will train engineers and test tools for health records, agriculture advice, and public service forms.",
      summary:
        "A new center in Addis Ababa will train local engineers and pilot artificial-intelligence tools built for Ethiopian languages and public services.",
      category: "technology",
      author: "Sara Bekele",
      image: "tech",
      tags: ["Startups", "Addis Ababa"],
      days: 1,
      views: 1680,
      blocks: [
        {
          type: "p",
          text: "Officials opened an artificial-intelligence center in Addis Ababa with a mandate that is deliberately narrow: tools people can use in Amharic and other local languages, starting with clinics, extension offices, and permit desks.",
        },
        {
          type: "h2",
          text: "First projects",
        },
        {
          type: "ol",
          items: [
            "A triage assistant that drafts visit notes for nurses to correct",
            "Crop-advice messages that extension agents can edit before sending",
            "A form helper that explains permit questions in plain language",
          ],
        },
        {
          type: "p",
          text: "University partners said the risk is importing models that fail on local names, places, and law. The center's board will publish which datasets it uses and which decisions stay with a person.",
        },
        {
          type: "quote",
          text: "If a machine cannot read a Kebele form, it is not an Ethiopian product yet.",
        },
      ],
    },
    {
      slug: "national-team-afcon-preparations",
      headline: "Ethiopia's national team prepares for AFCON qualifiers",
      subheadline:
        "The squad opens camp with a younger midfield and a demand for consistency away from Addis Ababa.",
      summary:
        "The national football team has opened camp ahead of Africa Cup of Nations qualifiers, with coaches stressing away-form and squad depth.",
      category: "sports",
      author: "Yonas Alemayehu",
      image: "sports",
      tags: ["Football"],
      days: 2,
      views: 3104,
      breaking: true,
      blocks: [
        {
          type: "p",
          text: "Ethiopia's national team gathered for AFCON qualifying camp with a shorter list of senior call-ups and a longer list of players who have started regularly for their clubs this season.",
        },
        {
          type: "p",
          text: "The coaching staff said the last campaign was lost in the details: late goals on the road and a midfield that tired after an hour. Fitness testing this week is public. Selection for the first qualifier will not be.",
        },
        {
          type: "h2",
          text: "What fans should watch",
        },
        {
          type: "ul",
          items: [
            "Whether the new midfield keeps its shape after the hour",
            "Set pieces, which decided two of the last four away matches",
            "How quickly wide players recover the ball after a turnover",
          ],
        },
        {
          type: "p",
          text: "A friendly is scheduled before the qualifier. GVN will publish the lineup when it is confirmed, not the rumor that moves fastest.",
        },
      ],
    },
    {
      slug: "ethiopian-film-international-award",
      headline: "Ethiopian film Hale wins international award",
      subheadline:
        "The feature, shot between Addis Ababa and a regional town, took a jury prize for first-time direction.",
      summary:
        "Hale, a feature filmed in Ethiopia, won an international jury prize, lifting a new generation of filmmakers onto a wider stage.",
      category: "entertainment",
      author: "Yonas Alemayehu",
      image: "film",
      tags: ["Film"],
      days: 2,
      views: 980,
      blocks: [
        {
          type: "p",
          text: "Hale, a first feature shot between Addis Ababa and a regional town, won a jury prize at an international festival this week. The film follows a family argument that becomes a story about who is allowed to leave and who is expected to stay.",
        },
        {
          type: "p",
          text: "Director Selamawit Desta said the production borrowed cameras, edited at night, and kept the cast small enough to finish. The prize includes a screening tour and a modest finishing grant.",
        },
        {
          type: "quote",
          text: "We did not make a postcard. We made an argument you can sit with.",
        },
        {
          type: "p",
          text: "Local cinemas said they will look for a commercial slot after the tour. GVN's culture desk will review the film when a public screening date is fixed.",
        },
      ],
    },
    {
      slug: "ethiopian-airlines-europe-routes",
      headline: "Ethiopian Airlines expands routes to Europe",
      subheadline:
        "Two additional weekly frequencies are aimed at business travel and perishable exports.",
      summary:
        "Ethiopian Airlines is adding European frequencies, citing demand from exporters and connecting passengers through Addis Ababa.",
      category: "business",
      author: "Sara Bekele",
      image: "airline",
      tags: ["Aviation", "Economy"],
      days: 3,
      views: 1540,
      blocks: [
        {
          type: "p",
          text: "Ethiopian Airlines said it will add weekly frequencies on two European routes, restoring seats cut during a softer season and giving exporters a tighter window for perishable cargo.",
        },
        {
          type: "p",
          text: "Network planners said the Addis Ababa hub still wins when a traveler needs one connection between Europe and cities further south. The new flights are timed for morning arrivals that meet bank hours, not only holiday traffic.",
        },
        {
          type: "h3",
          text: "Cargo is part of the case",
        },
        {
          type: "p",
          text: "Flower and fresh-produce shippers told GVN that a missed evening departure can erase a day's price. Extra frequencies matter only if the cold chain at the airport keeps the same hours as the aircraft.",
        },
      ],
    },
    {
      slug: "addis-startups-momentum",
      headline: "Local startups gain momentum in Addis Ababa",
      subheadline:
        "Payments, logistics, and farm-advice apps are raising small rounds from local angels.",
      summary:
        "A group of Addis Ababa startups closed early funding this quarter, a sign that local angels are backing practical products.",
      category: "technology",
      author: "Sara Bekele",
      image: "tech",
      tags: ["Startups", "Addis Ababa"],
      days: 3,
      views: 870,
      blocks: [
        {
          type: "p",
          text: "Five Addis Ababa startups closed early funding rounds this quarter. None of the checks would impress a Silicon Valley spreadsheet. All of them are large enough to hire engineers who had been freelancing.",
        },
        {
          type: "ul",
          items: [
            "A payments tool for neighborhood shops that still reconcile in cash",
            "A delivery network that prices motorbike time by the hill, not the pin",
            "An advice app extension agents can correct before a farmer sees it",
          ],
        },
        {
          type: "p",
          text: "Founders said the constraint is not ideas. It is foreign currency for servers and a habit of customers who will not pay until the second month works. Investors on these rounds asked for revenue before a second check.",
        },
      ],
    },
    {
      slug: "un-humanitarian-efforts",
      headline: "UN praises Ethiopia's humanitarian coordination",
      subheadline:
        "Agencies say access has improved in several areas, while needs remain far above funding.",
      summary:
        "United Nations agencies said coordination with Ethiopian authorities has improved aid delivery, even as funding still trails the need.",
      category: "world",
      author: "Mesfin Tesfaye",
      image: "world",
      tags: ["Diplomacy"],
      days: 4,
      views: 1320,
      blocks: [
        {
          type: "p",
          text: "United Nations agencies said coordination with Ethiopian authorities has shortened the time between a convoy request and a movement in several areas they monitor. They also said the praise is narrow: access is not the same as enough food, medicine, or shelter.",
        },
        {
          type: "p",
          text: "A briefing in Addis Ababa listed three changes. Joint lists of priority roads are updated weekly. Local officials attend the same meeting as agency logisticians. Incidents are logged with a date, not a slogan.",
        },
        {
          type: "quote",
          text: "Better meetings do not fill a warehouse. They stop us from guessing which road is open.",
        },
        {
          type: "p",
          text: "Aid groups said donor funding for the current plan is still well short. GVN will compare later statements against delivery figures, not against adjectives.",
        },
      ],
    },
    {
      slug: "ethiopia-athletics-gold",
      headline: "Ethiopia wins gold at the African athletics championship",
      subheadline:
        "A late kick in the 10,000 meters gave the team its first gold of the meet.",
      summary:
        "Ethiopia took gold in the 10,000 meters at the African athletics championship, extending a season of distance-running results.",
      category: "sports",
      author: "Yonas Alemayehu",
      image: "sports",
      tags: ["Athletics"],
      days: 4,
      views: 2460,
      blocks: [
        {
          type: "p",
          text: "Ethiopia won gold in the 10,000 meters after a race that stayed crowded until the last lap. The winning kick came from an athlete who had spent the middle kilometers tucked in third, not from the front.",
        },
        {
          type: "p",
          text: "Coaches said the plan was to refuse the early surge. Splits published by the meet show the field still together at halfway and broken only after the bell.",
        },
        {
          type: "p",
          text: "The medal is the team's first gold of the championship. Two silvers earlier in the week came in the 5,000 meters and the marathon. GVN's running notebook will update the medal table at the close of each session.",
        },
      ],
    },
    {
      slug: "singer-new-album",
      headline: "Popular singer releases a new album in Addis Ababa",
      subheadline:
        "The record mixes traditional scales with a smaller band and was premiered to a seated room, not a stadium.",
      summary:
        "A leading Ethiopian singer released a new album at a listening session in Addis Ababa, favoring a smaller band over a stadium show.",
      category: "entertainment",
      author: "Yonas Alemayehu",
      image: "film",
      tags: ["Addis Ababa"],
      days: 5,
      views: 760,
      blocks: [
        {
          type: "p",
          text: "The album arrived without a stadium countdown. The singer played it once, seated, to a room of musicians, DJs, and a few hundred fans who had bought tickets as if it were theatre.",
        },
        {
          type: "p",
          text: "Arrangements keep traditional scales and drop the wall of keyboards that defined the last record. Two songs are already moving through radio request shows. The label said streaming numbers will be published weekly, not as a single opening-day boast.",
        },
        {
          type: "quote",
          text: "I wanted people to hear the verse, not the smoke machine.",
        },
      ],
    },
    {
      slug: "addis-light-rail-extension",
      headline: "Addis Ababa outlines the next light-rail extension",
      subheadline:
        "City officials published a corridor map and a list of stations still missing from the current line.",
      summary:
        "Addis Ababa published a draft map for the next light-rail extension, naming stations and the neighborhoods the line is meant to reach.",
      category: "national",
      author: "Mesfin Tesfaye",
      image: "national",
      tags: ["Addis Ababa"],
      days: 5,
      views: 1190,
      blocks: [
        {
          type: "p",
          text: "City officials published a draft corridor for the next light-rail extension, including stations that commuters already use as informal transfer points. The map is a proposal. Construction dates are not attached.",
        },
        {
          type: "h2",
          text: "What the draft actually promises",
        },
        {
          type: "ul",
          items: [
            "A public comment window of 21 days",
            "Station locations shown against existing minibus routes",
            "A cost range, not a single figure",
            "No claim yet about when the first train would run",
          ],
        },
        {
          type: "p",
          text: "Residents along the corridor said they want the line and they want to know whose shops move. GVN will publish the comment calendar and any change between this map and the one that seeks funding.",
        },
      ],
    },
    {
      slug: "regional-trade-agreement",
      headline: "Ethiopia signs a trade facilitation agreement with regional partners",
      subheadline:
        "The deal targets border paperwork that keeps trucks idle even when tariffs are already low.",
      summary:
        "Ethiopia and regional partners signed a facilitation agreement aimed at cutting the paperwork that delays trucks at borders.",
      category: "world",
      author: "Mesfin Tesfaye",
      image: "world",
      tags: ["Diplomacy", "Economy"],
      days: 0,
      views: 640,
      breaking: true,
      blocks: [
        {
          type: "p",
          text: "Ethiopia signed a trade facilitation agreement with regional partners that focuses on documents, not new tariff rates. Officials said trucks lose more time to mismatched forms than to duties.",
        },
        {
          type: "p",
          text: "The text commits customs posts to accept a shared cargo list and to publish average clearance times each month. It does not, by itself, open a new road or fund a scanner.",
        },
        {
          type: "quote",
          text: "A signature is the start of a clock. The clock is the clearance time we will publish.",
        },
        {
          type: "p",
          text: "Traders in Moyale and Galafi said they will believe the agreement when the same form is accepted on both sides of a post in the same afternoon. GVN will check the first monthly clearance report against those crossings.",
        },
      ],
    },
    {
      slug: "central-bank-rate-decision",
      headline: "Central bank keeps the policy rate unchanged",
      subheadline:
        "The committee cited easing food prices and a still-careful view of credit growth.",
      summary:
        "The central bank left its policy rate unchanged, pointing to slower food inflation and a cautious reading of new credit.",
      category: "business",
      author: "Sara Bekele",
      image: "energy",
      tags: ["Economy"],
      days: 6,
      views: 1888,
      blocks: [
        {
          type: "p",
          text: "The central bank left its policy rate unchanged. The committee's note cited slower food-price gains and a wish to see whether recent credit growth settles without another squeeze.",
        },
        {
          type: "p",
          text: "Commercial lenders said the decision avoids a sudden reset of loan pricing. Borrowers shopping for working capital said unchanged is not the same as available: collateral rules still decide who gets a yes.",
        },
        {
          type: "h3",
          text: "The lines GVN will keep",
        },
        {
          type: "ul",
          items: [
            "Food inflation versus the rate decision, each month",
            "New private credit, not only the policy sentence",
            "What bank chairs say about collateral on the next earnings call",
          ],
        },
      ],
    },
    {
      slug: "ye-economy-forim",
      language: ContentLanguage.am,
      translationOf: "ethiopia-economic-reforms",
      headline: "ኢትዮጵያ አዲስ የኢኮኖሚ ማሻሻያ አወጣች",
      subheadline: "የለውጡ ጥቅል ኢንቨስትመንትንና የስራ እድልን ለማስፋት ተብሎ ቀረበ።",
      summary:
        "መንግስት ኢንቨስትመንትን ለማሳደግ፣ ስራ ለመፍጠር እና የረጅም ጊዜ መረጋጋትን ለማስጠበቅ የተዘጋጀ የኢኮኖሚ ማሻሻያ አስታወቀ።",
      category: "politics",
      author: "Mesfin Tesfaye",
      image: "reforms",
      tags: ["Economy", "Reforms"],
      days: 0,
      views: 540,
      breaking: true,
      blocks: [
        {
          type: "p",
          text: "የኢትዮጵያ መንግስት እድገትን ለማፋጠን፣ ኢንቨስትመንትን ለመሳብ እና በሀገሪቱ ዙሪያ ስራ ለመፍጠር የተዘጋጀ አዲስ የኢኮኖሚ ማሻሻያ አስታውቋል። ግብርና፣ ማምረቻ፣ ኃይል እና ዲጂታል አገልግሎት ቅድሚያ የተሰጣቸው ዘርፎች ናቸው።",
        },
        {
          type: "quote",
          text: "ጉዳዩ እድገት ብቻ አይደለም። በእያንዳንዱ ክልል ለእያንዳንዱ ዜጋ እድል መፍጠር ነው።",
        },
        {
          type: "h2",
          text: "በጥቅሉ ውስጥ ያለው",
        },
        {
          type: "ul",
          items: [
            "ከአዲስ አበባ ውጭ ላሉ አምራቾች ፈጣን ፈቃድ",
            "ለአነስተኛ ፋብሪካዎች የብድር ዋስትና",
            "ከአዲስ ፈቃድ ጋር የተያያዘ ስራን የሚከታተል ሪፖርት",
          ],
        },
        {
          type: "p",
          text: "የንግድ ማህበራት አቅጣጫውን ደግፈዋል። የውጭ ምንዛሪ አቅርቦት ግልጽ እንዲሆን ጠይቀዋል። ግሎባል ቮይስ ኔትወርክ የትኞቹ እርምጃዎች እንደተግባሩ ይከታተላል።",
        },
      ],
    },
    {
      slug: "ye-ai-maekel",
      language: ContentLanguage.am,
      translationOf: "ai-innovation-center-addis",
      headline: "በአዲስ አበባ አዲስ የሰው ሰራሽ አስተውሎት ማዕከል ተከፈተ",
      subheadline: "ማዕከሉ መሐንዲሶችን ያሠለጥናል፣ ለጤናና ለግብርና መሣሪያዎችን ይሞክራል።",
      summary:
        "በአዲስ አበባ የተከፈተ ማዕከል የአካባቢ ቋንቋዎችን የሚደግፉ የሰው ሰራሽ አስተውሎት መሣሪያዎችን ለሙከራ ያዘጋጃል።",
      category: "technology",
      author: "Sara Bekele",
      image: "tech",
      tags: ["Startups", "Addis Ababa"],
      days: 1,
      views: 210,
      blocks: [
        {
          type: "p",
          text: "ባለሥልጣናት በአዲስ አበባ የሰው ሰራሽ አስተውሎት ማዕከል ከፈቱ። ተልዕኮው ጠባብ ነው። በአማርኛና በሌሎች የአካባቢ ቋንቋዎች ለጤና ጣቢያ፣ ለግብርና አገልግሎት እና ለፈቃድ ዴስክ የሚጠቅሙ መሣሪያዎች።",
        },
        {
          type: "p",
          text: "የመጀመሪያዎቹ ሙከራዎች የጉብኝት ማስታወሻ ረቂቅ፣ የሰብል ምክር መልዕክት እና የፈቃድ ጥያቄ ማብራሪያ ናቸው። ውሳኔው በሰው እጅ እንደሚቆይ ማዕከሉ አስታውቋል።",
        },
      ],
    },
  ];

  const idBySlug = new Map<string, string>();

  for (const story of stories) {
    const language = story.language ?? ContentLanguage.en;
    const body = doc(story.blocks);
    const readingTimeMinutes = Math.max(1, Math.ceil(words(story.blocks) / 200));
    const publishedAt = daysAgo(story.days, 9);
    const data = {
      headline: story.headline,
      subheadline: story.subheadline,
      summary: story.summary.slice(0, 300),
      body,
      status: ArticleStatus.PUBLISHED,
      language,
      categoryId: categories[story.category].id,
      authorId: editor.id,
      authorProfileId: authorByName[story.author],
      featuredMediaId: mediaIds[story.image],
      seoTitle: story.headline.slice(0, 70),
      seoDescription: story.summary.slice(0, 160),
      isFeatured: story.slug === "ethiopia-economic-reforms",
      isBreaking: Boolean(story.breaking),
      breakingExpiresAt: story.breaking
        ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        : null,
      publishedAt,
      viewCount: story.views,
      readingTimeMinutes,
      hideFromHomepage: false,
      deletedAt: null,
    };

    const existing = await prisma.article.findFirst({
      where: { slug: story.slug, language },
    });
    const article = existing
      ? await prisma.article.update({ where: { id: existing.id }, data })
      : await prisma.article.create({
          data: { slug: story.slug, ...data },
        });
    idBySlug.set(`${language}:${story.slug}`, article.id);

    await prisma.articleTag.deleteMany({ where: { articleId: article.id } });
    await prisma.articleTag.createMany({
      data: story.tags.map((name) => ({
        articleId: article.id,
        tagId: tagIds[name],
      })),
    });

    const day = new Date(publishedAt);
    day.setUTCHours(0, 0, 0, 0);
    await prisma.articleViewDaily.upsert({
      where: { articleId_day: { articleId: article.id, day } },
      update: { views: Math.max(20, Math.round(story.views / 5)) },
      create: {
        articleId: article.id,
        day,
        views: Math.max(20, Math.round(story.views / 5)),
      },
    });
  }

  for (const story of stories) {
    if (!story.translationOf) continue;
    const language = story.language ?? ContentLanguage.en;
    const groupSource = idBySlug.get(`en:${story.translationOf}`);
    const self = idBySlug.get(`${language}:${story.slug}`);
    if (!groupSource || !self) continue;
    await prisma.article.update({
      where: { id: groupSource },
      data: { translationGroupId: groupSource },
    });
    await prisma.article.update({
      where: { id: self },
      data: { translationGroupId: groupSource },
    });
  }

  const leadId = idBySlug.get("en:ethiopia-economic-reforms");
  const secondary = [
    "green-energy-investment-wave",
    "ai-innovation-center-addis",
    "national-team-afcon-preparations",
    "ethiopian-film-international-award",
  ].map((slug) => idBySlug.get(`en:${slug}`));
  if (!leadId || secondary.some((id) => !id)) {
    throw new Error("Homepage stories were not created.");
  }

  await prisma.homepageSlot.deleteMany();
  await prisma.homepageSlot.create({
    data: {
      type: HomepageSlotType.LEAD,
      position: 0,
      articleId: leadId,
    },
  });
  for (let i = 0; i < secondary.length; i++) {
    await prisma.homepageSlot.create({
      data: {
        type: HomepageSlotType.SECONDARY,
        position: i + 1,
        articleId: secondary[i]!,
      },
    });
  }

  const about = doc([
    {
      type: "p",
      text: "Global Voice Network is an independent newsroom. This preview library is sample reporting so readers can see how a published story, a category, a video, and a podcast look on the site.",
    },
    {
      type: "h2",
      text: "What you are reading",
    },
    {
      type: "p",
      text: "Sample stories are stored in PostgreSQL like any other article. They follow the same editorial fields: headline, summary, body, author, category, tags, and a featured image with a caption.",
    },
    {
      type: "p",
      text: "When your newsroom replaces them with reported work, the pages do not change shape. Only the copy and the photographs change.",
    },
  ]);
  await prisma.staticPage.update({
    where: { slug: "about" },
    data: {
      title: "About Global Voice Network",
      body: about,
      published: true,
      seoDescription:
        "What Global Voice Network is, and how to read the sample newsroom on this preview.",
    },
  });

  const videos = [
    {
      slug: "reform-package-explained",
      title: "Video: the reform package, explained",
      description:
        "A sample video page. The player uses a public YouTube embed so the layout can be reviewed without a GVN upload.",
      provider: "youtube",
      providerId: "LXb3EKWsInQ",
      category: "politics" as const,
      days: 0,
    },
    {
      slug: "airport-cargo-window",
      title: "Video: inside the cargo window",
      description:
        "Sample business video on how extra flights only help if the cold chain keeps the same hours.",
      provider: "youtube",
      providerId: "aqz-KE-bpKQ",
      category: "business" as const,
      days: 1,
    },
    {
      slug: "camp-opens",
      title: "Video: national team camp opens",
      description: "Sample sports video for the AFCON qualifying camp.",
      provider: "youtube",
      providerId: "jNQXAC9IVRw",
      category: "sports" as const,
      days: 2,
    },
    {
      slug: "hale-trailer-note",
      title: "Video: Hale, a first look",
      description: "Sample culture video accompanying the award story.",
      provider: "youtube",
      providerId: "M7lc1UVf-VE",
      category: "entertainment" as const,
      days: 2,
    },
  ];
  for (const video of videos) {
    await prisma.video.upsert({
      where: { slug: video.slug },
      update: {
        title: video.title,
        description: video.description,
        provider: video.provider,
        providerId: video.providerId,
        categoryId: categories[video.category].id,
        status: ArticleStatus.PUBLISHED,
        publishedAt: daysAgo(video.days, 11),
        language: ContentLanguage.en,
        deletedAt: null,
      },
      create: {
        slug: video.slug,
        title: video.title,
        description: video.description,
        provider: video.provider,
        providerId: video.providerId,
        categoryId: categories[video.category].id,
        status: ArticleStatus.PUBLISHED,
        publishedAt: daysAgo(video.days, 11),
        language: ContentLanguage.en,
      },
    });
  }

  const audioPath = path.resolve("public/audio/sample-briefing.wav");
  await toneWav(audioPath, 18);
  const episodes = [
    {
      slug: "future-of-africas-economy",
      title: "The future of Africa's economy",
      episodeNumber: 12,
      showNotes:
        "Sample episode. Hosts walk through the reform package, what is funded, and which numbers GVN will publish next month. Audio is a short local preview tone so the player can be tested offline.",
      days: 1,
    },
    {
      slug: "technology-and-youth",
      title: "Technology and youth",
      episodeNumber: 11,
      showNotes:
        "Sample episode on the Addis Ababa AI center and the startups that closed small rounds this quarter.",
      days: 3,
    },
    {
      slug: "cultural-heritage",
      title: "Ethiopia's cultural heritage",
      episodeNumber: 10,
      showNotes:
        "Sample episode on Hale and the new album premiere. Show notes stand in until a reported interview is cut.",
      days: 5,
    },
  ];
  for (const episode of episodes) {
    await prisma.podcast.upsert({
      where: { slug: episode.slug },
      update: {
        title: episode.title,
        episodeNumber: episode.episodeNumber,
        showNotes: episode.showNotes,
        audioUrl: "/audio/sample-briefing.wav",
        status: ArticleStatus.PUBLISHED,
        publishedAt: daysAgo(episode.days, 7),
        language: ContentLanguage.en,
        deletedAt: null,
      },
      create: {
        slug: episode.slug,
        title: episode.title,
        episodeNumber: episode.episodeNumber,
        showNotes: episode.showNotes,
        audioUrl: "/audio/sample-briefing.wav",
        status: ArticleStatus.PUBLISHED,
        publishedAt: daysAgo(episode.days, 7),
        language: ContentLanguage.en,
      },
    });
  }

  const settings = await prisma.siteSetting.findUnique({
    where: { id: "default" },
  });
  const current = (settings?.data ?? {}) as Record<string, unknown>;
  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {
      data: {
        ...current,
        tagline: "Real news. Global perspective.",
        socialLinks: {
          facebook: "https://facebook.com",
          x: "https://x.com",
          youtube: "https://youtube.com",
          telegram: "https://t.me",
          linkedin: "https://linkedin.com",
        },
      },
    },
    create: {
      id: "default",
      data: {
        siteName: "Global Voice Network",
        tagline: "Real news. Global perspective.",
        socialLinks: {
          facebook: "https://facebook.com",
          x: "https://x.com",
          youtube: "https://youtube.com",
          telegram: "https://t.me",
          linkedin: "https://linkedin.com",
        },
      },
    },
  });

  console.log(
    `Sample news ready: ${stories.length} articles, ${videos.length} videos, ${episodes.length} podcasts.`,
  );
  console.log("Lead story: /politics/ethiopia-economic-reforms");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
