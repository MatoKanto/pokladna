"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pod touto výškou (px) je hlavička vždy viditeľná. */
const TOP_OFFSET = 80;
/** Ignoruje drobné trhnutia (napr. trackpad), aby hlavička neblikala. */
const MIN_DELTA = 6;

/**
 * Obal hlavičky, ktorý ju pri scrollovaní nadol schová a pri prvom scrolle
 * nahor (alebo pri návrate na vrch stránky) znova ukáže.
 */
export function AutoHideHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      if (y <= TOP_OFFSET) setHidden(false);
      else if (Math.abs(delta) < MIN_DELTA) return;
      else setHidden(delta > 0);
      lastY = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      data-hidden={hidden || undefined}
      // focus vnútri hlavičky (klávesnica) ju vždy ukáže
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        hidden && "-translate-y-[calc(100%+1.5rem)]",
        className,
      )}
    >
      {children}
    </header>
  );
}
