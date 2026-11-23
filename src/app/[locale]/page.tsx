import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Hero />;
}

// Dočasné: nahradí sections/Hero
function Hero() {
  const t = useTranslations("Home.hero");
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-5xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <Button size="lg">{t("cta")}</Button>
    </main>
  );
}
