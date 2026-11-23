import { getTranslations } from "next-intl/server";
import { HeroScene } from "./hero-scene";

/** Server wrapper: texty z i18n, animácia v client komponente. */
export async function Hero() {
  const t = await getTranslations("Home.hero");

  return (
    <HeroScene
      title={t("title")}
      scrollHint={t("scrollHint")}
      imageAlt={t("imageAlt")}
      captions={[t("captions.0"), t("captions.1"), t("captions.2")]}
    />
  );
}
