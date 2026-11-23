"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  scrollHint: string;
  imageAlt: string;
  captions: string[];
};

/**
 * Scroll-driven hero (inšpirácia: meetcleo.com).
 * Jedna sticky scéna; celú choreografiu riadi jediná hodnota `p` (scroll progress 0 až 1).
 *
 *  0.00–0.15  nadpis sa rozmaže a zmizne, terminál vyjde zdola (obrovský)
 *  0.15–0.50  terminál sa zmenšuje do stredu, pozadie prejde na brand farbu
 *  0.45–0.70  popisky sa objavujú postupne
 *  0.80–1.00  terminál odíde nahor, scénu prekryje ďalšia sekcia
 */
export function HeroScene(props: Props) {
  const reduced = useReducedMotion();
  return reduced ? <HeroStatic {...props} /> : <HeroAnimated {...props} />;
}

function HeroAnimated({ title, scrollHint, imageAlt, captions }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Pozadie: tmavá scéna → brand
  const brandOpacity = useTransform(p, [0.05, 0.4], [0, 1]);

  // Nadpis a hint
  const titleOpacity = useTransform(p, [0, 0.14], [1, 0]);
  const titleBlur = useTransform(p, [0, 0.14], ["blur(0px)", "blur(14px)"]);
  const titleScale = useTransform(p, [0, 0.14], [1, 0.94]);
  const hintOpacity = useTransform(p, [0, 0.05], [1, 0]);

  // Terminál
  const scale = useTransform(p, [0, 0.5, 0.8, 1], [2.6, 1, 0.92, 0.7]);
  // Do 0.04 je terminál mimo obrazovky (čisté intro), potom vyjde zdola
  const y = useTransform(
    p,
    [0, 0.04, 0.3, 0.5, 0.8, 1],
    ["320%", "320%", "30%", "0%", "-6%", "-70%"],
  );
  const rotate = useTransform(p, [0, 0.5, 1], [7, 0, -4]);

  return (
    <section ref={ref} className="relative h-[420svh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-foreground">
        {/* pozadie */}
        <motion.div
          style={{ opacity: brandOpacity }}
          className="absolute inset-0 bg-primary"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-radial-[at_50%_55%] from-primary-foreground/15 to-transparent"
          aria-hidden
        />

        {/* nadpis */}
        <motion.div
          style={{ opacity: titleOpacity, filter: titleBlur, scale: titleScale }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10 px-6 text-center"
        >
          <h1 className="max-w-3xl text-4xl font-medium tracking-tight text-background md:text-6xl">
            {title}
          </h1>
        </motion.div>
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 bottom-10 z-10 flex items-center justify-center gap-1 text-sm text-background/70"
        >
          {scrollHint}
          <ChevronDown className="size-4" />
        </motion.div>

        {/* terminál */}
        <div className="absolute inset-0 grid place-items-center pb-[24svh] lg:pb-0">
          <motion.div
            style={{ scale, y, rotate }}
            className="relative aspect-[1128/1901] h-[56svh] will-change-transform lg:h-[74svh]"
          >
            <Image
              src="/images/terminal.webp"
              alt={imageAlt}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 90vw"
              className="object-contain"
            />
          </motion.div>
        </div>

        {/* popisky: na mobile stĺpec dole, na desktope po bokoch terminálu */}
        <div className="absolute inset-x-4 bottom-6 z-10 flex flex-col gap-2 lg:contents">
          {captions.map((text, i) => (
            <Caption
              key={text}
              p={p}
              text={text}
              from={0.45 + i * 0.1}
              className={CAPTION_POSITIONS[i]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Na desktope okolo terminálu (stred ± pevný odstup), na menších šírkach stĺpec dole
const CAPTION_POSITIONS = [
  "lg:left-[calc(50%-27rem)] lg:top-[26%]",
  "lg:left-[calc(50%+12rem)] lg:top-[44%]",
  "lg:left-[calc(50%-25rem)] lg:top-[64%]",
];

function Caption({
  p,
  text,
  from,
  className,
}: {
  p: MotionValue<number>;
  text: string;
  from: number;
  className: string;
}) {
  const opacity = useTransform(p, [from, from + 0.06, 0.8, 0.88], [0, 1, 1, 0]);
  const y = useTransform(p, [from, from + 0.06], [24, 0]);
  return (
    <motion.p
      style={{ opacity, y }}
      className={`rounded-xl bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-lg lg:absolute lg:w-60 lg:text-base ${className}`}
    >
      {text}
    </motion.p>
  );
}

/** Varianta pre prefers-reduced-motion: žiadny pohyb, hotový stav. */
function HeroStatic({ title, imageAlt, captions }: Props) {
  return (
    <section className="bg-primary px-6 py-20 text-primary-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
        <h1 className="text-4xl font-medium tracking-tight md:text-6xl">
          {title}
        </h1>
        <div className="relative aspect-[1128/1901] h-[60svh]">
          <Image
            src="/images/terminal.webp"
            alt={imageAlt}
            fill
            priority
            sizes="40vw"
            className="object-contain"
          />
        </div>
        <ul className="flex flex-col gap-2">
          {captions.map((c) => (
            <li key={c} className="rounded-xl bg-card px-4 py-3 text-card-foreground">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
