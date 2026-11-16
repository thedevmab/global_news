export { default } from "@/app/(public)/podcasts/[slug]/page";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
