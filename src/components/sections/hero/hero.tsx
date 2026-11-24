import { getTranslations } from "next-intl/server";
import { HeroScene } from "./hero-scene";

/** Server wrapper: texty z i18n, animácia v client komponente. */
export async function Hero() {
  const t = await getTranslations("Home.hero");

  return (
    <HeroScene
      title={t("title")}
      titleAccent={t("titleAccent")}
      scrollHint={t("scrollHint")}
      imageAlt={t("imageAlt")}
      features={t.raw("features") as { title: string; text: string }[]}
    />
  );
}
