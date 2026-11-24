"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CloserLookItem = {
  id: string;
  /** Krátky text v zatvorenej pilulke. */
  label: string;
  /** Tučný nadpis v otvorenej karte (aj s interpunkciou). */
  title: string;
  text: string;
};

type Props = {
  items: CloserLookItem[];
  imageAlt: string;
  photoAlt: string;
};

/**
 * Detail záberu terminálu pre jednotlivé položky.
 * `ox`/`oy` = bod obrázka (v % jeho šírky/výšky), ktorý sa posunie do stredu,
 * `s` = zväčšenie. Kľúče zodpovedajú `id` položiek v messages.
 */
type Focus = { ox: number; oy: number; s: number; r?: number };

const OVERVIEW: Focus = { ox: 50, oy: 50, s: 1, r: -4 };

const FOCUS: Record<string, Focus> = {
  tap: { ox: 32, oy: 56, s: 1.9 },
  split: { ox: 34, oy: 40, s: 1.5 },
  payments: { ox: 42, oy: 5, s: 2.6 },
  receipts: { ox: 28, oy: 11, s: 2.4 },
  offline: { ox: 44, oy: 18, s: 3 },
  waiter: { ox: 50, oy: 50, s: 1.05, r: 5 },
};

/** Položky, pri ktorých sa namiesto terminálu ukáže fotka cez celý blok. */
const PHOTO: Record<string, string> = {
  secondDisplay: "/images/cafe.jpg",
};

const spring = { type: "spring", stiffness: 260, damping: 32, mass: 0.9 } as const;

/**
 * Blok „Pozrite sa bližšie“: vľavo pilulky, vpravo terminál, ktorý sa priblíži
 * na detail aktívnej položky. Vždy je otvorená práve jedna položka (predvolene prvá).
 */
export function CloserLookExplorer({ items, imageAlt, photoAlt }: Props) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const baseId = useId();
  const photo = PHOTO[active];
  const focus = FOCUS[active] ?? OVERVIEW;

  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      <div className="relative flex flex-col overflow-hidden rounded-[2rem] bg-muted md:block md:min-h-[42rem] lg:min-h-[46rem]">
        {/* vizuál: každý záber vplýva zprava, starý sa rozplynie (ako pri Apple) */}
        <div className="pointer-events-none relative h-[28rem] md:absolute md:inset-0 md:z-[1] md:h-auto">
          <AnimatePresence initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, x: "14%" }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{
                opacity: 0,
                x: "-3%",
                transition: { duration: 0.4, ease: [0.4, 0, 1, 1] },
              }}
              className="absolute inset-0 overflow-hidden will-change-transform"
            >
              {photo ? (
                <Image
                  src={photo}
                  alt={photoAlt}
                  fill
                  sizes="(min-width: 1152px) 1152px, 100vw"
                  className="object-cover object-[60%_center]"
                />
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0 grid place-items-center md:left-[42%]"
                >
                  <div
                    style={{
                      transform: `translate(${(50 - focus.ox) * focus.s}%, ${(50 - focus.oy) * focus.s}%) rotate(${focus.r ?? 0}deg) scale(${focus.s})`,
                    }}
                    className="relative aspect-[1128/1901] h-[85%]"
                  >
                    <Image
                      src="/images/terminal.webp"
                      alt={imageAlt}
                      fill
                      sizes="(min-width: 768px) 40vw, 80vw"
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* zoznam */}
        <LayoutGroup>
          <ul className="relative z-10 flex flex-col items-start gap-3 p-6 md:absolute md:inset-y-0 md:left-0 md:w-[min(40rem,52%)] md:justify-center md:p-10 lg:p-14">
            {items.map((item) => {
              const open = item.id === active;
              const panelId = `${baseId}-${item.id}`;
              return (
                <motion.li
                  key={item.id}
                  layout
                  style={{ borderRadius: open ? 28 : 999 }}
                  className={cn(
                    // Bez backdrop-blur: pri každej animácii rozloženia by sa prepočítaval
                    // a sekal; na fotke stačí takmer plné pozadie.
                    "overflow-hidden bg-foreground/[0.06]",
                    photo && "md:bg-background/90",
                    open && "w-full",
                  )}
                >
                  {open ? (
                    <motion.div
                      layout="position"
                      id={panelId}
                      className="px-7 py-6 text-[0.95rem] leading-relaxed text-foreground/80 md:text-base"
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.p
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.25 } }}
                          exit={{ opacity: 0 }}
                        >
                          <span className="font-semibold text-foreground">{item.title}</span>{" "}
                          {item.text}
                        </motion.p>
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.button
                      layout="position"
                      type="button"
                      aria-expanded={false}
                      onClick={() => setActive(item.id)}
                      className="flex cursor-pointer items-center gap-3 rounded-full py-3.5 pr-6 pl-3.5 text-[0.95rem] font-medium whitespace-nowrap transition-colors hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:text-base"
                    >
                      <span className="grid size-6 place-items-center rounded-full ring-[1.5px] ring-foreground/80">
                        <Plus className="size-3.5" strokeWidth={2.5} />
                      </span>
                      {item.label}
                    </motion.button>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </LayoutGroup>
      </div>
    </MotionConfig>
  );
}
