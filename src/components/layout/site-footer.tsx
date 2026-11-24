import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BesteronLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// Štruktúra podľa shadcnblocks footer37 (bez newslettera).
// Hrefy odkazov sú zatiaľ placeholdery; nahradíme reálnymi.
const LINKS = [
  { key: "products", href: "/#produkty" },
  { key: "about", href: "/#o-nas" },
  { key: "blog", href: "/#blog" },
  { key: "contact", href: "/#kontakt" },
] as const;

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/BesteronSK" },
  { label: "Instagram", href: "https://www.instagram.com/besteron.svk/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/besteron/" },
] as const;

const LEGAL = [
  { key: "privacy", href: "/#ochrana-osobnych-udajov" },
  { key: "terms", href: "/#obchodne-podmienky" },
] as const;

// Zákaznícka podpora, zdroj: booking.besteron.com/sk/kontakt
const PHONE = "+421 2 33 52 7675";
const EMAIL = "helpdesk@besteron.sk";

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  const contacts = [
    { icon: Phone, label: t("contact.phone"), value: PHONE, href: `tel:${PHONE.replace(/\s/g, "")}` },
    { icon: Mail, label: t("contact.email"), value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: MapPin, label: t("contact.location"), value: t("contact.address") },
  ];

  return (
    <footer
      id="kontakt"
      data-header-theme="light"
      className="relative z-10 bg-muted px-4 py-16 text-foreground md:px-6 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        {/* CTA */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-foreground/10 pb-12 md:flex-row md:items-center md:pb-16">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
            {t("cta.title")}
          </h2>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/#kontakt">
              {t("cta.button")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* logo + odkazy */}
        <div className="grid gap-12 border-b border-foreground/10 py-12 md:grid-cols-[1fr_auto] md:py-16">
          <div>
            <Link href="/" aria-label={t("home")} className="inline-block">
              <BesteronLogo className="h-7 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-20">
            <nav aria-label={t("links.title")}>
              <h3 className="mb-4 text-sm font-semibold">{t("links.title")}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {LINKS.map((l) => (
                  <li key={l.key}>
                    <Link href={l.href} className="transition-colors hover:text-foreground">
                      {t(`links.items.${l.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h3 className="mb-4 text-sm font-semibold">{t("socials")}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-foreground"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* kontakty */}
        <ul className="grid gap-8 border-b border-foreground/10 py-10 md:grid-cols-3">
          {contacts.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background">
                <Icon className="size-4" />
              </span>
              <div className="text-sm">
                <p className="font-semibold">{label}</p>
                {href ? (
                  <a href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {value}
                  </a>
                ) : (
                  <p className="text-muted-foreground">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* spodná lišta */}
        <div className="flex flex-col gap-4 pt-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <ul className="flex gap-6">
            {LEGAL.map((l) => (
              <li key={l.key}>
                <Link href={l.href} className="transition-colors hover:text-foreground">
                  {t(`legal.${l.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
