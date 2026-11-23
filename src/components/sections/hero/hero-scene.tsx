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
} from "motion/react";
import { RevealWords } from "./reveal-words";
import {
  type Pt,
  clamp01,
  easeInOutSine,
  homography,
  lerp,
  mul,
  scale,
  smoothstep,
  toMatrix3d,
  translate,
} from "@/lib/homography";

type Props = {
  title: string;
  titleAccent: string;
  scrollHint: string;
  imageAlt: string;
};

/**
 * Scroll-driven hero (inšpirácia: meetcleo.com).
 *
 * Scéna začína zo samotného displeja: obrazovka vypĺňa celé okno a odráža sa v nej
 * tmavé sklo so svetelnými pásmi. Scrollom sa kamera vzďaľuje, objaví sa rám a telo
 * terminálu, odlesk sa rozplynie do UI a terminál sa z čelného (2D) pohľadu plynule
 * natočí do finálneho uhla (3D).
 *
 * Princíp: máme dva rendery toho istého terminálu, FRONT (čelný) a ANGLED (natočený).
 * Displej v oboch (FRONT_QUAD, QUAD) vždy zarovnáme na rovnaký štvoruholník D(t),
 * ktorý sa mení z obdĺžnika (čelný pohľad) na skutočnú perspektívu (natočený pohľad).
 * Obrázky sa tým deformujú homografiou (CSS matrix3d) a prelínajú, takže UI na
 * displeji ostáva na mieste, kým sa telo (rukoväť, tlačiareň) postupne vynára.
 * Celú choreografiu riadi scroll progress `p` (0 až 1).
 *
 *  0.00–0.12  nadpis sa rozmaže a zmizne
 *  0.00–0.42  odďaľovanie (zoom out), displej je čelný (2D) a zakrytý tmavým sklom
 *  0.18–0.76  plynulé natáčanie z čelného pohľadu do finálneho; väčšinu vidno, keď je
 *             terminál už usadený v strede (pripnutý). Na konci je to presne ANGLED.
 *  0.18–0.76  po skle displeja prechádza odlesk svetla (zvýrazňuje otáčanie)
 *  0.56–0.76  sklo sa rozplynie a odhalí UI z PNG (UI nikdy neprelíname, aby sa
 *             nezdvojil; prelínajú sa len telá terminálov pod sklom)
 *  od 0.78    ďalšia sekcia ho prekryje zdola
 *
 * Prekrytie zabezpečuje `Intro` so záporným horným okrajom 100svh. Začína sa pri
 * p = (H - 200svh) / (H - 100svh); pre H = 560svh je to ≈ 0.78, preto sa natáčanie
 * musí dokončiť skôr (pozri ROTATE_END).
 */
const HERO_HEIGHT = "h-[560svh]";
const ZOOM_END = 0.42;
const ROTATE_START = 0.18;
const ROTATE_END = 0.76;

// ANGLED: natočený render (public/images/terminal.webp), finálny stav scény
const IMG_W = 1128;
const IMG_H = 1901;
// FRONT: čelný render (public/images/terminal-front.webp)
const FRONT_W = 648;
const FRONT_H = 1588;
// Displej (biela plocha UI) v čelnom rendri: obdĺžnik (TL, TR, BR, BL)
const FRONT_QUAD: readonly Pt[] = [
  [56, 303],
  [591, 303],
  [591, 1442],
  [56, 1442],
];
// Rohy displeja v obrázku (TL, TR, BR, BL), zmerané z obrázka
const QUAD: readonly Pt[] = [
  [133.0, 337.3],
  [589.1, 312.9],
  [610.6, 1633.4],
  [134.5, 1611.8],
];
// Plochý displej v súradniciach ANGLED: výška ~ priemer ľavej a pravej hrany,
// pomer strán z čelného rendra (535 × 1139).
const FLAT_H = 1297;
const FLAT_W = FLAT_H * (535 / 1139);
const QUAD_CENTER: Pt = [
  QUAD.reduce((s, p) => s + p[0], 0) / 4,
  QUAD.reduce((s, p) => s + p[1], 0) / 4,
];
const FLAT: readonly Pt[] = [
  [QUAD_CENTER[0] - FLAT_W / 2, QUAD_CENTER[1] - FLAT_H / 2],
  [QUAD_CENTER[0] + FLAT_W / 2, QUAD_CENTER[1] - FLAT_H / 2],
  [QUAD_CENTER[0] + FLAT_W / 2, QUAD_CENTER[1] + FLAT_H / 2],
  [QUAD_CENTER[0] - FLAT_W / 2, QUAD_CENTER[1] + FLAT_H / 2],
];
const IMG_CENTER: Pt = [IMG_W / 2, IMG_H / 2];

// Odlesk je nakreslený v "plochom" priestore displeja a statickou homografiou
// (FLAT_RECT → QUAD) uložený na displej v obrázku.
const FLAT_RECT: readonly Pt[] = [
  [0, 0],
  [FLAT_W, 0],
  [FLAT_W, FLAT_H],
  [0, FLAT_H],
];
// Odlesk je o OVERLAY_M px (v plochých jednotkách) väčší než displej, aby okolo neprezeral
// biely okraj UI; prekryje tak aj tmavú hranu rámu.
const OVERLAY_M = 10;
const REFLECTION_TRANSFORM = toMatrix3d(
  mul(homography(FLAT_RECT, QUAD), translate(-OVERLAY_M, -OVERLAY_M)),
);
const SCREEN_TRANSFORM = toMatrix3d(homography(FLAT_RECT, QUAD));

/** Postup natáčania 0 (čelný pohľad) až 1 (finálny uhol), zjemnený na začiatku a konci. */
function rotationProgress(p: number): number {
  return smoothstep(clamp01((p - ROTATE_START) / (ROTATE_END - ROTATE_START)));
}

/** CSS transformácia jednej vrstvy (čelný alebo natočený render) pre daný scroll progress. */
function deviceMatrix(
  p: number,
  vw: number,
  vh: number,
  layer: "front" | "angled",
): string {
  if (!vw || !vh) return "none";

  // Cieľová veľkosť terminálu v strede (výška obrázka v px)
  const k = ((vw >= 1024 ? 0.74 : 0.68) * vh) / IMG_H;

  // Počiatočný zoom: čelný displej pokrýva celé okno
  const zoom0 = Math.max(vw / (FLAT_W * k), vh / (FLAT_H * k)) * 1.25;

  const ez = easeInOutSine(clamp01(p / ZOOM_END));
  const zoom = Math.exp(lerp(Math.log(zoom0), 0, ez));
  const t = rotationProgress(p); // 0 = čelný displej, 1 = uhol v PNG

  // Cieľový štvoruholník displeja D(t): obdĺžnik → skutočná perspektíva
  const dst = QUAD.map((q, i) => [
    lerp(FLAT[i][0], q[0], t),
    lerp(FLAT[i][1], q[1], t),
  ]) as unknown as readonly Pt[];
  const H = homography(layer === "front" ? FRONT_QUAD : QUAD, dst);

  // Bod, ktorý drží stred okna: najprv stred displeja, nakoniec stred obrázka
  const fx = lerp(QUAD_CENTER[0], IMG_CENTER[0], ez);
  const fy = lerp(QUAD_CENTER[1], IMG_CENTER[1], ez);

  const M = mul(
    translate(vw / 2, vh / 2),
    mul(scale(k * zoom), mul(translate(-fx, -fy), H)),
  );
  return toMatrix3d(M);
}

export function HeroScene(props: Props) {
  const reduced = useReducedMotion();
  return reduced ? <HeroStatic {...props} /> : <HeroAnimated {...props} />;
}

function HeroAnimated({ title, titleAccent, scrollHint, imageAlt }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Veľkosť okna (potrebná pre výpočet matice)
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
  const introGlassOpacity = useTransform(p, [0, 0.12], [1, 0]);
  // Plné sklo cez celé okno: zaručí čistý prvý záber, hneď po začiatku scrollu sa rozplynie
  const fullGlassOpacity = useTransform(p, [0, 0.1], [1, 0]);

  // Zostava je skrytá, kým nepoznáme veľkosť okna (žiadny záblesk neumiestneného obrázka)
  const deviceOpacity = useTransform(vw, (w) => (w ? 1 : 0));

  // Pozadie scény: stále brand červená; biela žiara sa rozsvieti po usadení
  const glowOpacity = useTransform(p, [0.34, 0.52], [0, 1]);
  const glowScale = useTransform(p, [0.34, 0.52], [0.7, 1]);

  // Nadpis a hint
  const titleOpacity = useTransform(p, [0, 0.12], [1, 0]);
  const titleBlur = useTransform(p, [0, 0.12], ["blur(0px)", "blur(14px)"]);
  const titleScale = useTransform(p, [0, 0.12], [1, 0.94]);
  const hintOpacity = useTransform(p, [0, 0.04], [1, 0]);

  // Zostava terminálu: dve vrstvy (čelný a natočený render) so spoločným displejom
  const deviceFront = useTransform([p, vw, vh], ([pv, w, h]: number[]) =>
    deviceMatrix(pv, w, h, "front"),
  );
  const deviceAngled = useTransform([p, vw, vh], ([pv, w, h]: number[]) =>
    deviceMatrix(pv, w, h, "angled"),
  );
  // Prelínanie: natočený render sa vynára, čelný ustúpi, na konci ostáva len natočený
  const angledOpacity = useTransform(p, (pv) =>
    smoothstep(clamp01((rotationProgress(pv) - 0.1) / 0.6)),
  );
  const frontOpacity = useTransform([p, vw], ([pv, w]: number[]) =>
    w ? 1 - smoothstep(clamp01((rotationProgress(pv) - 0.4) / 0.35)) : 0,
  );
  // Sklo displeja zakrýva UI počas celého natáčania (UI v oboch renderoch nesedí presne,
  // takže by sa pri prelínaní zdvojilo) a rozplynie sa až na konci do UI z PNG.
  const reflectionOpacity = useTransform(p, [0.56, ROTATE_END], [1, 0]);
  // Odlesk svetla na displeji počas natáčania: objaví sa, prejde cez displej, na konci zmizne
  const sheenX = useTransform(p, [ROTATE_START, ROTATE_END], ["-42%", "42%"]);
  const sheenOpacity = useTransform(
    p,
    [ROTATE_START, 0.4, 0.62, ROTATE_END],
    [0, 1, 1, 0],
  );

  // pásy odlesku: posun podľa scrollu + jemný paralax podľa kurzora
  const streakX = useTransform([p, sx], ([pv, m]: number[]) => {
    const scroll = lerp(10, -14, clamp01(pv / ROTATE_END));
    return `${scroll + (m - 0.5) * 10}%`;
  });

  return (
    <section
      ref={ref}
      data-header-theme="dark"
      className={`relative ${HERO_HEIGHT}`}
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-primary">
        {/* pozadie */}
        <motion.div
          style={{ opacity: glowOpacity, scale: glowScale }}
          className="bg-soft-glow absolute inset-0"
          aria-hidden
        />

        {/* terminál: čelný render (spodná vrstva) */}
        <motion.div
          style={{
            transform: deviceFront,
            width: FRONT_W,
            height: FRONT_H,
            opacity: frontOpacity,
          }}
          className="absolute left-0 top-0 origin-top-left will-change-transform"
        >
          <Image
            src="/images/terminal-front.webp"
            alt=""
            width={FRONT_W}
            height={FRONT_H}
            priority
            quality={90}
            draggable={false}
            className="pointer-events-none block max-w-none select-none"
          />
        </motion.div>

        {/* terminál: natočený render (finálny stav) + odlesky na displeji */}
        <motion.div
          style={{
            transform: deviceAngled,
            width: IMG_W,
            height: IMG_H,
            opacity: deviceOpacity,
          }}
          className="absolute left-0 top-0 origin-top-left will-change-transform"
        >
          <motion.div style={{ opacity: angledOpacity }}>
            <Image
              src="/images/terminal.webp"
              alt={imageAlt}
              width={IMG_W}
              height={IMG_H}
              priority
              quality={90}
              draggable={false}
              className="pointer-events-none block max-w-none select-none"
            />
          </motion.div>
          {/* odlesk na displeji */}
          <motion.div
            aria-hidden
            style={{
              width: FLAT_W + 2 * OVERLAY_M,
              height: FLAT_H + 2 * OVERLAY_M,
              transform: REFLECTION_TRANSFORM,
              opacity: reflectionOpacity,
            }}
            className="glass-base absolute left-0 top-0 origin-top-left overflow-hidden rounded-[20px]"
          >
            <motion.div
              style={{ x: streakX }}
              className="glass-streaks absolute -inset-x-1/3 inset-y-0"
            />
          </motion.div>
          {/* odlesk svetla, ktorý sa posúva po displeji počas natáčania */}
          <motion.div
            aria-hidden
            style={{
              width: FLAT_W,
              height: FLAT_H,
              transform: SCREEN_TRANSFORM,
              opacity: sheenOpacity,
            }}
            className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-[20px]"
          >
            <motion.div
              style={{ x: sheenX }}
              className="glass-sheen absolute -inset-x-full inset-y-0"
            />
          </motion.div>
        </motion.div>

        {/* plné sklo displeja cez celé okno (čistý štart) */}
        <motion.div
          aria-hidden
          style={{ opacity: fullGlassOpacity }}
          className="glass-base pointer-events-none absolute inset-0 overflow-hidden"
        >
          <motion.div
            style={{ x: streakX }}
            className="glass-streaks absolute -inset-x-1/3 inset-y-0"
          />
        </motion.div>

        {/* úvodné sklo: reflektor pod kurzorom a občasný prejazd svetla */}
        <motion.div
          aria-hidden
          style={{ opacity: introGlassOpacity }}
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <motion.div
            style={{ background: spotlight }}
            className="absolute inset-0"
          />
          <div className="glint absolute -inset-y-[10%] left-0 w-[22vw]" />
        </motion.div>

        {/* nadpis + hint */}
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
      </div>
    </section>
  );
}

/** Varianta pre prefers-reduced-motion: žiadny pohyb, hotový stav. */
function HeroStatic({ title, titleAccent, imageAlt }: Props) {
  return (
    <section
      data-header-theme="dark"
      className="relative isolate overflow-hidden bg-primary px-6 py-24 text-primary-foreground"
    >
      <div className="bg-soft-glow absolute inset-0 -z-10" aria-hidden />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
          {title} <span className="font-normal">{titleAccent}</span>
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
