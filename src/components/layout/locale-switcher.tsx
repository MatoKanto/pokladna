"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_META } from "@/i18n/locales";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { glassItem, glassPanel } from "./glass";

type Props = {
  label: string;
  /** dropdown (desktop hlavička) alebo zoznam v rozbalenom mobilnom menu */
  variant?: "dropdown" | "inline";
  onSelect?: () => void;
};

export function LocaleSwitcher({ label, variant = "dropdown", onSelect }: Props) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const select = (next: Locale) => {
    setOpen(false);
    onSelect?.();
    if (next === locale) return;
    startTransition(() => router.replace(pathname, { locale: next }));
  };

  const options = routing.locales.map((l) => {
    const active = l === locale;
    return (
      <li key={l}>
        <button
          type="button"
          lang={l}
          aria-current={active ? "true" : undefined}
          onClick={() => select(l)}
          className={cn(
            glassItem,
            "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition-colors",
          )}
        >
          <span>{LOCALE_META[l].name}</span>
          {active ? <Check className="size-4" /> : null}
        </button>
      </li>
    );
  });

  if (variant === "inline") {
    return (
      <div className="mt-1 border-t border-current/10 pt-2">
        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide opacity-60">
          {label}
        </p>
        <ul className="max-h-56 overflow-y-auto">{options}</ul>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          glassItem,
          "flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
        )}
      >
        <Globe className="size-4" />
        {LOCALE_META[locale].code}
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className={cn(
            glassPanel,
            "absolute right-0 top-full mt-3 max-h-80 w-56 overflow-y-auto rounded-3xl p-2",
          )}
        >
          {options}
        </ul>
      )}
    </div>
  );
}
