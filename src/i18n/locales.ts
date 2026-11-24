import type { Locale } from "./routing";

/** Názvy jazykov v ich vlastnej reči (neprekladajú sa). Nový jazyk = pridať sem + do routing.locales + messages/<kód>.json. */
export const LOCALE_META: Record<Locale, { code: string; name: string }> = {
  sk: { code: "SK", name: "Slovenčina" },
  en: { code: "EN", name: "English" },
};
