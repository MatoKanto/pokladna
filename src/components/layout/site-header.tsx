import { getTranslations } from "next-intl/server";
import { BesteronLogo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { glass } from "./glass";
import { MobileMenu } from "./mobile-menu";

// Hrefy sú zatiaľ kotvy na homepage; nahradíme reálnymi stránkami.
const NAV_ITEMS = [
  { key: "products", href: "/#produkty" },
  { key: "about", href: "/#o-nas" },
  { key: "blog", href: "/#blog" },
] as const;

const CONTACT_HREF = "/#kontakt";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const items = NAV_ITEMS.map(({ key, href }) => ({
    href,
    label: t(`items.${key}`),
  }));

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 lg:top-4 lg:px-8">
      <div className="relative flex items-center justify-between">
        {/* logo */}
        <Link
          href="/"
          aria-label={t("home")}
          className={cn(
            glass,
            "pointer-events-auto flex h-11 items-center rounded-full px-5 transition-colors hover:bg-background lg:h-14 lg:px-6",
          )}
        >
          <BesteronLogo className="h-5 w-auto lg:h-6" />
        </Link>

        {/* stredná navigácia (desktop) */}
        <nav
          aria-label={t("primary")}
          className={cn(
            glass,
            "pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full p-1.5 lg:flex",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA + mobilné menu */}
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href={CONTACT_HREF}
            className={cn(
              glass,
              "flex h-11 items-center rounded-full px-5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background lg:h-14 lg:px-7",
            )}
          >
            {t("contact")}
          </Link>
          <MobileMenu
            items={items}
            labels={{ menu: t("menu"), close: t("closeMenu") }}
          />
        </div>
      </div>
    </header>
  );
}
