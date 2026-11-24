"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { NavigationMenu } from "radix-ui";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { glassItem, glassPanel } from "./glass";

export type NavProduct = {
  href: string;
  title: string;
  text: string;
  image: string;
  fit: "contain" | "cover";
};

type Props = {
  label: string;
  productsLabel: string;
  products: NavProduct[];
  links: { href: string; label: string }[];
};

const itemClass = cn(
  glassItem,
  "flex h-11 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors outline-none",
);

/** Desktop navigácia (lg+): mega dropdown Produkty s obrázkom, ktorý sa prelína podľa hovernutej položky. */
export function DesktopNav({ label, productsLabel, products, links }: Props) {
  const [active, setActive] = useState(0);

  return (
    <NavigationMenu.Root aria-label={label} className="relative hidden lg:block">
      <NavigationMenu.List className="flex items-center gap-1">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={cn(itemClass, "group data-[state=open]:bg-current/10")}>
            {productsLabel}
            <ChevronDown
              aria-hidden
              className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute left-1/2 top-full -translate-x-1/2 pt-3 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out">
            <div className={cn(glassPanel, "grid w-[38rem] grid-cols-[15rem_1fr] gap-3 rounded-3xl p-3")}>
              {/* obrázok: prelínanie podľa aktívnej položky */}
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                {products.map((p, i) => (
                  <Image
                    key={p.image}
                    src={p.image}
                    alt=""
                    fill
                    sizes="240px"
                    className={cn(
                      "transition-opacity duration-300",
                      p.fit === "cover" ? "object-cover" : "object-contain p-4",
                      i === active ? "opacity-100" : "opacity-0",
                    )}
                  />
                ))}
              </div>

              <ul className="flex flex-col gap-1">
                {products.map((p, i) => (
                  <li key={p.title}>
                    <NavigationMenu.Link asChild>
                      <Link
                        href={p.href}
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        className={cn(
                          "block rounded-2xl px-4 py-3 transition-colors outline-none",
                          i === active ? "bg-foreground/5" : "hover:bg-foreground/5",
                        )}
                      >
                        <span className="block text-sm font-semibold">{p.title}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{p.text}</span>
                      </Link>
                    </NavigationMenu.Link>
                  </li>
                ))}
              </ul>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        {links.map((l) => (
          <NavigationMenu.Item key={l.href}>
            <NavigationMenu.Link asChild>
              <Link href={l.href} className={itemClass}>
                {l.label}
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}
