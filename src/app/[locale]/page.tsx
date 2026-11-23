import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero/hero";
import { Intro } from "@/components/sections/intro";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <Intro />
    </main>
  );
}
