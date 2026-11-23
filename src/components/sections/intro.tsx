import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

/**
 * Dočasná sekcia, ktorá prekrýva pripnutý hero (slide-over efekt).
 * Záporný okraj 100svh ju vsunie pod hero; hero ostane pripnutý, kým ho nezakryje.
 */
export async function Intro() {
  const t = await getTranslations("Home.intro");

  return (
    <section data-header-theme="light" className="relative z-10 -mt-[100svh] flex min-h-svh items-start justify-center rounded-t-[2.5rem] bg-background px-6 py-32 text-center">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
        <h2 className="text-4xl font-medium tracking-tight md:text-5xl">
          {t("titleStart")} <span className="text-primary">{t("titleAccent")}</span>
        </h2>
        <p className="text-muted-foreground">{t("text")}</p>
        <Button size="lg">{t("cta")}</Button>
      </div>
    </section>
  );
}
