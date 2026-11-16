import { HomePage } from "@/components/public/HomePage";

export const revalidate = 60;

export default function Page() {
  return <HomePage locale="am" />;
}
