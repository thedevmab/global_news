export { default, generateMetadata } from "@/app/(public)/videos/[slug]/page";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}
