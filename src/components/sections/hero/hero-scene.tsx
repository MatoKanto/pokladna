"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  scrollHint: string;
  imageAlt: string;
};

/**
 * Scroll-driven hero (inšpirácia: meetcleo.com).
 * Jedna sticky scéna; choreografiu riadi jediná hodnota `p` (scroll progress 0 až 1).
 *
 *  0.00–0.14  nadpis sa rozmaže a zmizne
 *  0.04–0.55  terminál vyjde zdola ako obrovský a zmenší sa do stredu
 *  0.15–0.55  pozadie prejde na brandové, za terminálom sa rozsvieti mäkká žiara
 *  0.55–1.00  terminál stojí v strede (pripnutý); ďalšia sekcia ho prekryje zdola
 *
 * Prekrytie zabezpečuje `Intro` so záporným horným okrajom 100svh, preto musí
 * byť terminál usadený pred p ≈ 0.6 (pozri HERO_HEIGHT).
 */
const HERO_HEIGHT = "h-[360svh]";

export function HeroScene(props: Props) {
  const reduced = useReducedMotion();
  return reduced ? <HeroStatic {...props} /> : <HeroAnimated {...props} />;
}

function HeroAnimated({ title, scrollHint, imageAlt }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Pozadie: tmavá scéna → brandové, potom sa rozsvieti žiara
  const stageOpacity = useTransform(p, [0.05, 0.4], [0, 1]);
  const glowOpacity = useTransform(p, [0.15, 0.55], [0, 1]);
  const glowScale = useTransform(p, [0.15, 0.55], [0.7, 1]);

  // Nadpis a hint
  const titleOpacity = useTransform(p, [0, 0.14], [1, 0]);
  const titleBlur = useTransform(p, [0, 0.14], ["blur(0px)", "blur(14px)"]);
  const titleScale = useTransform(p, [0, 0.14], [1, 0.94]);
  const hintOpacity = useTransform(p, [0, 0.05], [1, 0]);

  // Terminál: do 0.04 mimo obrazovky (čisté intro), potom vyjde a usadí sa v strede
  const scale = useTransform(p, [0, 0.55], [2.6, 1]);
  const y = useTransform(p, [0, 0.04, 0.3, 0.55], ["320%", "320%", "30%", "0%"]);
  const rotate = useTransform(p, [0, 0.55], [7, 0]);

  return (
    <section ref={ref} className={`relative ${HERO_HEIGHT}`}>
      <div className="sticky top-0 h-svh overflow-hidden bg-foreground">
        {/* pozadie */}
        <motion.div
          style={{ opacity: stageOpacity }}
          className="bg-stage absolute inset-0"
          aria-hidden
        />
        <motion.div
          style={{ opacity: glowOpacity, scale: glowScale }}
          className="bg-soft-glow absolute inset-0"
          aria-hidden
        />

        {/* nadpis + hint (hint hneď pod nadpisom ako pri Cleo) */}
        <motion.div
          style={{ opacity: titleOpacity, filter: titleBlur, scale: titleScale }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-16 px-6 text-center md:gap-24"
        >
          <h1 className="max-w-3xl text-4xl font-medium tracking-tight text-background md:text-6xl">
            {title}
          </h1>
          <motion.p
            style={{ opacity: hintOpacity }}
            className="flex items-center gap-1.5 text-xl text-background/80 md:text-2xl"
          >
            {scrollHint}
            <ChevronDown className="size-5 md:size-6" />
          </motion.p>
        </motion.div>

        {/* terminál */}
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            style={{ scale, y, rotate }}
            className="relative aspect-[1128/1901] h-[68svh] will-change-transform lg:h-[74svh]"
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
      </div>
    </section>
  );
}

/** Varianta pre prefers-reduced-motion: žiadny pohyb, hotový stav. */
function HeroStatic({ title, imageAlt }: Props) {
  return (
    <section className="bg-stage relative isolate overflow-hidden px-6 py-24 text-primary-foreground">
      <div className="bg-soft-glow absolute inset-0 -z-10" aria-hidden />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
        <h1 className="text-4xl font-medium tracking-tight md:text-6xl">
          {title}
        </h1>
        <div className="relative aspect-[1128/1901] h-[70svh]">
          <Image
            src="/images/terminal.webp"
            alt={imageAlt}
            fill
            priority
            sizes="40vw"
            className="object-contain"
          />
        </div>
      </div>
    </section>
  );
}
