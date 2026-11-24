"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { BesteronLogo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { NavProduct } from "./desktop-nav";
import { glassItem } from "./glass";
import { LocaleSwitcher } from "./locale-switcher";

type Props = {
  products: NavProduct[];
  productsLabel: string;
  links: { href: string; label: string }[];
  loginHref: string;
  contactHref: string;
  labels: {
    menu: string;
    close: string;
    language: string;
    login: string;
    contact: string;
    home: string;
  };
};

/**
 * Mobilné menu (pod lg) v duchu navbar8: celoobrazovkový panel v brand farbe.
 * Renderuje sa cez portál, lebo backdrop-filter na hlavičke by z neho inak
 * spravil containing block a `fixed` by sa neroztiahlo na celý viewport.
 */
export function MobileMenu({
  products,
  productsLabel,
  links,
  loginHref,
  contactHref,
  labels,
}: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // pri prechode na desktop šírku sa panel zavrie
    const mq = window.matchMedia("(min-width: 64rem)");
    const onMq = () => mq.matches && setOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={labels.menu}
        onClick={() => setOpen(true)}
        className={cn(glassItem, "grid size-10 place-items-center rounded-full transition-colors")}
      >
        <Menu className="size-5" />
      </button>

      {open &&
        createPortal(
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={labels.menu}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-primary px-6 pb-8 pt-5 text-primary-foreground lg:hidden"
          >
            <div className="flex items-center justify-between">
              <Link href="/" aria-label={labels.home} onClick={close}>
                <BesteronLogo className="h-5 w-auto" />
              </Link>
              <button
                type="button"
                aria-label={labels.close}
                onClick={close}
                className={cn(glassItem, "grid size-10 place-items-center rounded-full transition-colors")}
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-10 flex flex-col gap-8">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide opacity-70">
                  {productsLabel}
                </p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {products.map((p) => (
                    <li key={p.title}>
                      <Link
                        href={p.href}
                        onClick={close}
                        className={cn(glassItem, "-mx-3 block rounded-2xl px-3 py-2.5 transition-colors")}
                      >
                        <span className="block text-lg font-semibold">{p.title}</span>
                        <span className="block text-sm opacity-75">{p.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="flex flex-col gap-1">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={close}
                      className={cn(glassItem, "-mx-3 block rounded-2xl px-3 py-2 text-2xl font-semibold transition-colors")}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-10">
              <Link
                href={loginHref}
                onClick={close}
                className="flex h-12 items-center justify-center rounded-full font-semibold ring-1 ring-primary-foreground/40 transition-colors hover:bg-primary-foreground/10"
              >
                {labels.login}
              </Link>
              <Link
                href={contactHref}
                onClick={close}
                className="flex h-12 items-center justify-center rounded-full bg-primary-foreground font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
              >
                {labels.contact}
              </Link>
              <LocaleSwitcher variant="inline" label={labels.language} onSelect={close} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
