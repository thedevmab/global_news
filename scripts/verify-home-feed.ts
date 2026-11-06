import {
  getHomepageLeadAndSecondary,
  listLatestArticles,
} from "../src/server/articles/public";

async function main() {
  const latest = await listLatestArticles({ page: 1, pageSize: 5 });
  const curated = await getHomepageLeadAndSecondary();
  console.log(
    "latest",
    latest.items.map((i) => ({
      headline: i.headline.slice(0, 50),
      language: i.language,
    })),
  );
  console.log("curatedLead", curated.lead?.headline?.slice(0, 50) ?? null);
  console.log("curatedSecondary", curated.secondary.length);
}

main().catch(console.error);
