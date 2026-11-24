import { getTranslations } from "next-intl/server";
import { BesteronLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { AutoHideHeader } from "./auto-hide-header";
import { DesktopNav, type NavProduct } from "./desktop-nav";
import { glass, glassItem } from "./glass";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";

// Štruktúra podľa shadcnblocks navbar8 (Pro blok, prepísaný ručne):
// logo vľavo, mega dropdown s prelínaním obrázkov, akcie vpravo.
// Hrefy sú zatiaľ kotvy na homepage; nahradíme reálnymi stránkami.
const PRODUCTS = [
  { key: "pos", href: "/#produkty", image: "/images/terminal.webp", fit: "contain" },
  { key: "waiter", href: "/#produkty", image: "/images/cafe.jpg", fit: "cover" },
  { key: "ekasa", href: "/#produkty", image: "/images/terminal-seq/040.webp", fit: "contain" },
] as const;

const LINKS = [
  { key: "about", href: "/#o-nas" },
  { key: "blog", href: "/#blog" },
] as const;

// TODO: doplniť skutočnú adresu prihlásenia do Besteron portálu.
const LOGIN_HREF = "/#prihlasenie";
const CONTACT_HREF = "/#kontakt";

export async function SiteHeader() {
  const t = await getTranslations("Nav");

  const products: NavProduct[] = PRODUCTS.map(({ key, ...rest }) => ({
    ...rest,
    title: t(`productMenu.${key}.title`),
    text: t(`productMenu.${key}.text`),
  }));
  const links = LINKS.map(({ key, href }) => ({ href, label: t(`items.${key}`) }));

  return (
    // šírka zhodná s kontajnerom sekcie „Pozrite sa bližšie“ (closer-look.tsx)
    <AutoHideHeader className="fixed inset-x-0 top-3 z-50 px-4 md:px-8 lg:top-4">
      <div
        className={cn(
          glass,
          "mx-auto flex h-14 w-full items-center justify-between gap-4 rounded-full pl-5 pr-2 lg:h-16 lg:w-[88%] lg:max-w-[96rem] lg:pl-7",
        )}
      >
        <Link href="/" aria-label={t("home")} className="shrink-0">
          <BesteronLogo className="h-5 w-auto text-primary lg:h-6" />
        </Link>

        <DesktopNav
          label={t("primary")}
          productsLabel={t("items.products")}
          products={products}
          links={links}
        />

        <div className="flex items-center gap-1">
          <Link
            href={LOGIN_HREF}
            className={cn(
              glassItem,
              "hidden h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors lg:flex",
            )}
          >
            {t("login")}
          </Link>
          <Button asChild className="h-10 rounded-full px-5 lg:h-11 lg:px-6">
            <Link href={CONTACT_HREF}>{t("contact")}</Link>
          </Button>
          <LocaleSwitcher label={t("language")} />
          <MobileMenu
            products={products}
            productsLabel={t("items.products")}
            links={links}
            loginHref={LOGIN_HREF}
            contactHref={CONTACT_HREF}
            labels={{
              menu: t("menu"),
              close: t("closeMenu"),
              language: t("language"),
              login: t("login"),
              contact: t("contact"),
              home: t("home"),
            }}
          />
        </div>
      </div>
    </AutoHideHeader>
  );
}
