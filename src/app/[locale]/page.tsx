import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero/hero";
import { CloserLook } from "@/components/sections/closer-look/closer-look";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <CloserLook />
    </main>
  );
}
