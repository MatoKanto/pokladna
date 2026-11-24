"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ChevronDown } from "lucide-react";
import {
  SEQUENCE,
  TerminalSequence,
  sequenceSrc,
} from "./terminal-sequence";

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
 *  0.03–0.30  terminál vyjde zdola a usadí sa v strede
 *  0.05–0.66  terminál sa plynule otáča z čelného pohľadu do finálneho uhla
 *             (sekvencia snímok z 360° videa, pozri terminal-sequence.tsx)
 *  0.15–0.55  pozadie prejde na brandové, za terminálom sa rozsvieti mäkká žiara
 *  od 0.70    ďalšia sekcia ho prekryje zdola
 *
 * Prekrytie zabezpečuje `Intro` so záporným horným okrajom 100svh. Začína sa pri
 * p = (H - 200svh) / (H - 100svh); pre H = 440svh je to ≈ 0.71, preto sa otáčanie
 * musí dokončiť skôr.
 */
const HERO_HEIGHT = "h-[440svh]";
const ROTATE_START = 0.05;
const ROTATE_END = 0.66;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

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

  // Terminál: do 0.03 mimo obrazovky (čisté intro), potom vyjde a usadí sa v strede
  const scale = useTransform(p, [0, 0.3], [1.1, 1]);
  const y = useTransform(p, [0, 0.03, 0.3], ["130%", "130%", "0%"]);
  // Postup otáčania 0 (čelný pohľad) až 1 (finálny uhol), zjemnený na začiatku a konci
  const rotation = useTransform(p, (v) =>
    smoothstep(clamp01((v - ROTATE_START) / (ROTATE_END - ROTATE_START))),
  );

  return (
    <section
      ref={ref}
      data-header-theme="dark"
      className={`relative ${HERO_HEIGHT}`}
    >
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
            style={{
              scale,
              y,
              aspectRatio: `${SEQUENCE.width} / ${SEQUENCE.height}`,
            }}
            className="relative h-[68svh] will-change-transform lg:h-[74svh]"
          >
            <TerminalSequence
              progress={rotation}
              alt={imageAlt}
              className="h-full w-full"
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
    <section data-header-theme="dark" className="bg-stage relative isolate overflow-hidden px-6 py-24 text-primary-foreground">
      <div className="bg-soft-glow absolute inset-0 -z-10" aria-hidden />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
        <h1 className="text-4xl font-medium tracking-tight md:text-6xl">
          {title}
        </h1>
        <div
          className="relative h-[70svh]"
          style={{ aspectRatio: `${SEQUENCE.width} / ${SEQUENCE.height}` }}
        >
          <Image
            src={sequenceSrc(SEQUENCE.frames - 1)}
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
