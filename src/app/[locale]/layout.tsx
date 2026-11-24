import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import "@/styles/globals.css";

// Metropolis: jediný font značky. Rezy podľa brand manuálu:
// Regular, Italic, Semibold, Bold, Bold Italic, Extrabold.
// Súbory pokrývajú latin (vrátane slovenských a českých znakov).
const fontSans = localFont({
  variable: "--font-sans-family",
  display: "swap",
  src: [
    { path: "../../fonts/metropolis/metropolis-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/metropolis/metropolis-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../fonts/metropolis/metropolis-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/metropolis/metropolis-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/metropolis/metropolis-latin-700-italic.woff2", weight: "700", style: "italic" },
    { path: "../../fonts/metropolis/metropolis-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ locale: l, href: "/" })]),
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontSans.variable}>
      <body>
        <NextIntlClientProvider>
          <SiteHeader />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
