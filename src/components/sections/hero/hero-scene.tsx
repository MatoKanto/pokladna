"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
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
 *
 * Scéna začína zo samotného displeja: obrazovka terminálu vypĺňa celé okno a je
 * zakrytá tmavým sklom s odleskom. Scrollom sa kamera vzďaľuje, objaví sa rám a
 * telo terminálu, sklo sa rozplynie do UI a terminál sa z čelného pohľadu plynule
 * otáča (sekvencia snímok z 360° videa) do finálneho uhla.
 *
 * Choreografiu riadi jediná hodnota `p` (scroll progress 0 až 1):
 *  0.00–0.10  nadpis sa rozmaže a zmizne
 *  0.00–0.45  zoom out: displej (vypĺňal okno) sa zmenší na celý terminál v strede
 *  0.22–0.68  otáčanie z čelného pohľadu do finálneho uhla (pomalý štart, aby sklo
 *             sedelo na displeji, kým je pohľad ešte takmer čelný)
 *  0.20–0.40  sklo displeja sa rozplynie do UI (až pri menšom zoome, UI je z videa
 *             s malým rozlíšením a pri veľkom priblížení by bolo rozmazané)
 *  0.25–0.55  pozadie prejde na brandové, za terminálom sa rozsvieti mäkká žiara
 *  od 0.70    ďalšia sekcia ho prekryje zdola
 *
 * Prekrytie zabezpečuje `Intro` so záporným horným okrajom 100svh. Začína sa pri
 * p = (H - 200svh) / (H - 100svh); pre H = 440svh je to ≈ 0.71.
 */
const HERO_HEIGHT = "h-[440svh]";
const ROTATE_START = 0.22;
const ROTATE_END = 0.68;
const ZOOM_END = 0.45;

// Displej v prvej (čelnej) snímke sekvencie, ako zlomok rozmerov snímky
// (zmerané: x 55–320, y 210–760 z 370 × 812 px)
const SCREEN = {
  left: 55 / 370,
  right: 320 / 370,
  top: 210 / 812,
  bottom: 760 / 812,
};
const SCREEN_CX = (SCREEN.left + SCREEN.right) / 2;
const SCREEN_CY = (SCREEN.top + SCREEN.bottom) / 2;

const SEQ_W = SEQUENCE.width;
const SEQ_H = SEQUENCE.height;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
  const titleOpacity = useTransform(p, [0, 0.1], [1, 0]);
  const titleBlur = useTransform(p, [0, 0.1], ["blur(0px)", "blur(14px)"]);
  const titleScale = useTransform(p, [0, 0.1], [1, 0.94]);
  const hintOpacity = useTransform(p, [0, 0.05], [1, 0]);

  // Veľkosť okna a terminálu (výška = 74svh na desktope, 68svh na mobile)
  const vw = useMotionValue(0);
  const vh = useMotionValue(0);
  useEffect(() => {
    const measure = () => {
      vw.set(window.innerWidth);
      vh.set(window.innerHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [vw, vh]);

  // Postup otáčania 0 (čelný pohľad) až 1 (finálny uhol): pomalý štart (x^1.6 po
  // vyhladení), aby bol pohľad dlho takmer čelný a sklo sedelo na displeji
  const rotation = useTransform(p, (v) => {
    const x = smoothstep(clamp01((v - ROTATE_START) / (ROTATE_END - ROTATE_START)));
    return Math.pow(x, 1.6);
  });

  // Zoom out + posun tak, aby displej na štarte vypĺňal okno a stred displeja ležal
  // v strede okna. Škálujeme okolo stredu displeja.
  const zoom = useTransform([p, vw, vh], ([pv, w, h]: number[]) => {
    if (!w || !h) return 1;
    const th = (w >= 1024 ? 0.74 : 0.68) * h; // výška terminálu v strede
    const tw = th * (SEQ_W / SEQ_H);
    const s0 =
      Math.max(w / (tw * (SCREEN.right - SCREEN.left)), h / (th * (SCREEN.bottom - SCREEN.top))) * 1.04;
    return lerp(s0, 1, easeInOut(clamp01(pv / ZOOM_END)));
  });
  const shift = useTransform([p, vw, vh], ([pv, w, h]: number[]) => {
    if (!w || !h) return { x: 0, y: 0 };
    const th = (w >= 1024 ? 0.74 : 0.68) * h;
    const tw = th * (SEQ_W / SEQ_H);
    const k = 1 - easeInOut(clamp01(pv / ZOOM_END));
    return { x: -(SCREEN_CX - 0.5) * tw * k, y: -(SCREEN_CY - 0.5) * th * k };
  });
  const shiftX = useTransform(shift, (v) => v.x);
  const shiftY = useTransform(shift, (v) => v.y);
  // Pred prvým meraním okna je terminál skrytý (žiadny záblesk neumiestneného obrázka)
  const terminalOpacity = useTransform(vw, (w) => (w ? 1 : 0));

  // Sklo displeja: drží sa, kým je pohľad takmer čelný, potom sa rozplynie do UI
  const glassOpacity = useTransform(p, [0.2, 0.4], [1, 0]);
  const streakX = useTransform(p, [0, 0.4], ["8%", "-16%"]);
  // Pri štarte (displej = celé okno) je nadpis nad sklom a rozmaže sa spolu s ním

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
              scale: zoom,
              x: shiftX,
              y: shiftY,
              opacity: terminalOpacity,
              aspectRatio: `${SEQ_W} / ${SEQ_H}`,
              transformOrigin: `${SCREEN_CX * 100}% ${SCREEN_CY * 100}%`,
            }}
            className="relative h-[68svh] will-change-transform lg:h-[74svh]"
          >
            <TerminalSequence
              progress={rotation}
              alt={imageAlt}
              className="h-full w-full"
            />
            {/* sklo s odleskom na displeji (sedí na displeji čelného pohľadu) */}
            <motion.div
              aria-hidden
              style={{
                opacity: glassOpacity,
                left: `${SCREEN.left * 100}%`,
                top: `${SCREEN.top * 100}%`,
                width: `${(SCREEN.right - SCREEN.left) * 100}%`,
                height: `${(SCREEN.bottom - SCREEN.top) * 100}%`,
              }}
              className="glass-base pointer-events-none absolute overflow-hidden rounded-[7%/3.5%]"
            >
              <motion.div
                style={{ x: streakX }}
                className="glass-streaks absolute -inset-x-1/3 inset-y-0"
              />
            </motion.div>
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
          style={{ aspectRatio: `${SEQ_W} / ${SEQ_H}` }}
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
