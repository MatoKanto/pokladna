import { getTranslations } from "next-intl/server";
import { CloserLookExplorer, type CloserLookItem } from "./closer-look-explorer";

const ITEM_IDS = ["tap", "split", "payments", "receipts", "offline", "secondDisplay", "waiter"] as const;

/**
 * Sekcia hneď pod hero: prekrýva pripnutý hero (slide-over efekt).
 * Záporný okraj 100svh ju vsunie pod hero; hero ostane pripnutý, kým ho nezakryje.
 */
export async function CloserLook() {
  const t = await getTranslations("Home.closerLook");

  const items: CloserLookItem[] = ITEM_IDS.map((id) => ({
    id,
    label: t(`items.${id}.label`),
    title: t(`items.${id}.title`),
    text: t(`items.${id}.text`),
  }));

  return (
    <section
      data-header-theme="light"
      className="relative z-10 -mt-[100svh] min-h-svh rounded-t-[2.5rem] bg-background px-4 pt-32 pb-24 md:px-8"
    >
      <div className="mx-auto w-full lg:w-[88%] lg:max-w-[96rem]">
        <h2 className="mb-10 px-2 text-4xl font-semibold tracking-tight md:mb-14 md:px-10 md:text-5xl">
          {t("title")}
        </h2>
        <CloserLookExplorer items={items} imageAlt={t("imageAlt")} photoAlt={t("photoAlt")} />
      </div>
    </section>
  );
}
