"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { glass, glassHover, glassItem } from "./glass";

type Props = {
  items: { href: string; label: string }[];
  labels: { menu: string; close: string };
};

/** Hamburger menu pre šírky pod lg. Desktop navigácia je v SiteHeader. */
export function MobileMenu({ items, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? labels.close : labels.menu}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          glass,
          glassHover,
          "grid size-11 place-items-center rounded-full",
        )}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <>
          {/* klik mimo zavrie menu */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 -z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-menu"
            className={cn(
              glass,
              "absolute right-0 top-full mt-2 flex w-64 flex-col rounded-3xl p-2",
            )}
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(glassItem, "rounded-2xl px-4 py-3 text-base font-medium transition-colors")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
