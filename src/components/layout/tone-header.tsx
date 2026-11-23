"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Obal hlavičky, ktorý zisťuje, nad akou sekciou sa nachádza, a nastaví `data-tone`.
 * Sekcie to ovplyvňujú atribútom `data-header-theme="dark" | "light"`
 * (dark = tmavé/farebné pozadie, light = svetlé). Bez atribútu platí dark.
 */
export function ToneHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [tone, setTone] = useState<"dark" | "light">("dark");

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const stack = document.elementsFromPoint(window.innerWidth / 2, 44);
      const host = stack
        .map((el) => el.closest<HTMLElement>("[data-header-theme]"))
        .find(Boolean);
      setTone(host?.dataset.headerTheme === "light" ? "light" : "dark");
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header data-tone={tone} className={className}>
      {children}
    </header>
  );
}
