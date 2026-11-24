"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { RevealWords } from "./reveal-words";
import {
  SEQUENCE,
  TerminalSequence,
  sequenceSrc,
} from "./terminal-sequence";

type Props = {
  title: string;
  titleAccent: string;
  scrollHint: string;
  imageAlt: string;
  features: { title: string; text: string }[];
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
 * p = (H - 200svh) / (H - 100svh); pre H = 480svh je to ≈ 0.74.
 *
 *  0.44–0.66  karty s výhodami sa postupne zjavujú (glassmorphism, FeatureCard)
 */
const HERO_HEIGHT = "h-[480svh]";
const ROTATE_START = 0.22;
const ROTATE_END = 0.68;
const ZOOM_END = 0.45;

// Displej v prvej (čelnej) snímke sekvencie, ako zlomok rozmerov snímky
// (zmerané: x 118–706, y 460–1690 z 813 × 1788 px)
const SCREEN = {
  left: 118 / 813,
  right: 706 / 813,
  top: 460 / 1788,
  bottom: 1690 / 1788,
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

function HeroAnimated({
  title,
  titleAccent,
  scrollHint,
  imageAlt,
  features,
}: Props) {
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

  // Kurzor (0 až 1 v rámci okna): posúva pásy odlesku a vedie mäkký reflektor.
  // Kým sa myš nepohne (alebo na dotykových zariadeniach), reflektor pomaly sám pláva.
  const px = useMotionValue(0.62);
  const py = useMotionValue(0.35);
  const sx = useSpring(px, { stiffness: 50, damping: 20 });
  const sy = useSpring(py, { stiffness: 50, damping: 20 });
  useEffect(() => {
    const idle = [
      animate(px, [0.62, 0.4, 0.58, 0.62], {
        duration: 22,
        repeat: Infinity,
        ease: "easeInOut",
      }),
      animate(py, [0.35, 0.5, 0.4, 0.35], {
        duration: 26,
        repeat: Infinity,
        ease: "easeInOut",
      }),
    ];
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      idle.forEach((a) => a.stop());
      px.set(e.clientX / window.innerWidth);
      py.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      idle.forEach((a) => a.stop());
      window.removeEventListener("pointermove", onMove);
    };
  }, [px, py]);
  const spotX = useTransform(sx, (v) => v * 100);
  const spotY = useTransform(sy, (v) => v * 100);
  const spotlight = useMotionTemplate`radial-gradient(45vmax circle at ${spotX}% ${spotY}%, color-mix(in oklch, var(--primary-foreground) 15%, transparent), transparent 62%)`;
  const introLightOpacity = useTransform(p, [0, 0.14], [1, 0]);

  // Sklo displeja: drží sa, kým je pohľad takmer čelný, potom sa rozplynie do UI
  const glassOpacity = useTransform(p, [0.2, 0.4], [1, 0]);
  // pásy odlesku: posun podľa scrollu + jemný paralax podľa kurzora
  const streakX = useTransform([p, sx], ([pv, m]: number[]) => {
    const scroll = 8 + (-16 - 8) * Math.min(1, pv / 0.4);
    return `${scroll + (m - 0.5) * 10}%`;
  });
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

        {/* úvodné sklo: reflektor pod kurzorom a občasný prejazd svetla */}
        <motion.div
          aria-hidden
          style={{ opacity: introLightOpacity }}
          className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
        >
          <motion.div style={{ background: spotlight }} className="absolute inset-0" />
          <div className="glint absolute -inset-y-[10%] left-0 w-[22vw]" />
        </motion.div>

        {/* nadpis + hint (hint hneď pod nadpisom ako pri Cleo) */}
        <motion.div
          style={{ opacity: titleOpacity, filter: titleBlur, scale: titleScale }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-16 px-6 text-center md:gap-24"
        >
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-background md:text-6xl">
            <RevealWords text={title} />{" "}
            <RevealWords
              text={titleAccent}
              start={title.split(" ").length}
              className="font-normal text-background/90"
            />
          </h1>
          <motion.div style={{ opacity: hintOpacity }}>
            <div className="hint-in flex flex-col items-center gap-3 text-xl text-background/80 md:text-2xl">
              {scrollHint}
              <div className="scroll-drip" aria-hidden />
            </div>
          </motion.div>
        </motion.div>

        {/* karty s výhodami: po bokoch terminálu (desktop) / jedna po druhej dole (mobil) */}
        {features.map((f, i) => (
          <FeatureCard
            key={f.title}
            p={p}
            vw={vw}
            index={i}
            count={features.length}
            title={f.title}
            text={f.text}
          />
        ))}

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

/** Kedy sa karta objaví (scroll progress); karty sa striedajú v rozstupe STEP. */
const CARD_START = 0.44;
const CARD_STEP = 0.075;

// Desktop: po bokoch terminálu (jeho šírka ≈ 34svh), striedavo vľavo/vpravo
const CARD_POS = [
  "lg:left-[calc(50%-18svh-1.5rem-17rem)] lg:top-[24%]",
  "lg:left-[calc(50%+18svh+1.5rem)] lg:top-[42%]",
  "lg:left-[calc(50%-18svh-1.5rem-17rem)] lg:top-[60%]",
];

/**
 * Glassmorphism karta s výhodou. Objaví sa pri scrolle (fade + posun), na desktope
 * ostane; na mobile je viditeľná vždy len jedna (v spodnom slote) a ďalšia ju strieda.
 */
function FeatureCard({
  p,
  vw,
  index,
  count,
  title,
  text,
}: {
  p: MotionValue<number>;
  vw: MotionValue<number>;
  index: number;
  count: number;
  title: string;
  text: string;
}) {
  const from = CARD_START + index * CARD_STEP;
  const opacity = useTransform([p, vw], ([pv, w]: number[]) => {
    const fadeIn = clamp01((pv - from) / 0.05);
    if (w >= 1024 || index === count - 1) return fadeIn;
    const next = from + CARD_STEP;
    return fadeIn * (1 - clamp01((pv - next) / 0.04)); // mobil: ustúpi ďalšej karte
  });
  const y = useTransform(p, (pv) => 28 * (1 - clamp01((pv - from) / 0.05)));
  return (
    <motion.div
      style={{ opacity, y }}
      className={`pointer-events-none absolute inset-x-5 bottom-6 z-10 rounded-3xl bg-background/15 px-6 py-5 text-background shadow-[0_8px_32px_-8px] shadow-foreground/30 ring-1 ring-background/30 backdrop-blur-xl backdrop-saturate-150 lg:inset-x-auto lg:bottom-auto lg:w-[17rem] lg:py-6 ${CARD_POS[index] ?? ""}`}
    >
      {/* jemný odlesk na hrane skla */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-background/25 via-transparent to-transparent"
      />
      <h2 className="relative text-xl font-extrabold tracking-tight lg:text-2xl">
        {title}
      </h2>
      <p className="relative mt-1 text-sm leading-snug text-background/85 lg:text-base">
        {text}
      </p>
    </motion.div>
  );
}

/** Varianta pre prefers-reduced-motion: žiadny pohyb, hotový stav. */
function HeroStatic({ title, titleAccent, imageAlt, features }: Props) {
  return (
    <section data-header-theme="dark" className="bg-stage relative isolate overflow-hidden px-6 py-24 text-primary-foreground">
      <div className="bg-soft-glow absolute inset-0 -z-10" aria-hidden />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
          {title} <span className="font-normal">{titleAccent}</span>
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
        <ul className="grid w-full gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <li
              key={f.title}
              className="rounded-3xl bg-background/15 px-5 py-4 ring-1 ring-background/30 backdrop-blur-xl"
            >
              <h2 className="text-xl font-extrabold tracking-tight">{f.title}</h2>
              <p className="mt-1 text-sm text-background/85">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
