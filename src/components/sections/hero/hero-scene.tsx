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
  scrollHint: string;
  imageAlt: string;
};

/**
 * Scroll-driven hero (inšpirácia: meetcleo.com).
 *
 * Scéna začína zo samotného displeja: obrazovka vypĺňa celé okno a odráža sa v nej
 * tmavé sklo so svetelnými pásmi. Scrollom sa kamera vzďaľuje, objaví sa rám a telo
 * terminálu, pohľad sa z plochého (2D) plynule natáča do perspektívy (3D) a odlesk
 * sa rozplynie do UI aplikácie.
 *
 * Princíp: obrázok terminálu je už vyrenderovaný v perspektíve. Štyri rohy displeja
 * (QUAD) interpolujeme medzi "plochým" obdĺžnikom (FLAT) a skutočnou perspektívou
 * a z nich počítame homografiu → CSS matrix3d. Celú choreografiu riadi scroll
 * progress `p` (0 až 1) cez `deviceMatrix`.
 *
 *  0.00–0.14  nadpis sa rozmaže a zmizne
 *  0.00–0.50  odďaľovanie (zoom out)
 *  0.05–0.50  natočenie z 2D do 3D
 *  0.28–0.50  odlesk sa rozplynie do UI
 *  0.50–1.00  terminál stojí v strede (pripnutý); ďalšia sekcia ho prekryje zdola
 *
 * Prekrytie zabezpečuje `Intro` so záporným horným okrajom 100svh, preto musí
 * byť všetko usadené pred p ≈ 0.6 (pozri HERO_HEIGHT).
 */
const HERO_HEIGHT = "h-[360svh]";

// Rozmery zdrojového obrázka (public/images/terminal.webp)
const IMG_W = 1128;
const IMG_H = 1901;
// Rohy displeja v obrázku (TL, TR, BR, BL), zmerané z obrázka
const QUAD: readonly Pt[] = [
  [133.0, 337.3],
  [589.1, 312.9],
  [610.6, 1633.4],
  [134.5, 1611.8],
];
// Skutočný (plochý) displej: výška ~ priemer ľavej a pravej hrany, pomer strán odhadnutý
// tak, aby boli ikony v UI okrúhle.
const FLAT_H = 1297;
const FLAT_W = FLAT_H * 0.38;
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

/** CSS transformácia celej zostavy (obrázok + odlesk) pre daný scroll progress. */
function deviceMatrix(p: number, vw: number, vh: number): string {
  if (!vw || !vh) return "none";

  // Cieľová veľkosť terminálu v strede (výška obrázka v px)
  const k = ((vw >= 1024 ? 0.74 : 0.68) * vh) / IMG_H;

  // Počiatočný zoom: plochý displej pokrýva celé okno
  const zoom0 = Math.max(vw / (FLAT_W * k), vh / (FLAT_H * k)) * 1.03;

  const zp = clamp01(p / 0.5);
  const ez = easeInOutSine(zp);
  const zoom = Math.exp(lerp(Math.log(zoom0), 0, ez));
  const t = smoothstep(clamp01((p - 0.05) / 0.45)); // 0 = plochý, 1 = perspektíva

  const dst = QUAD.map((q, i) => [
    lerp(FLAT[i][0], q[0], t),
    lerp(FLAT[i][1], q[1], t),
  ]) as unknown as readonly Pt[];
  const H = homography(QUAD, dst);

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

function HeroAnimated({ title, scrollHint, imageAlt }: Props) {
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

  // Zostava je skrytá, kým nepoznáme veľkosť okna (žiadny záblesk neumiestneného obrázka)
  const deviceOpacity = useTransform(vw, (w) => (w ? 1 : 0));

  // Pozadie scény: tmavé → brandové, potom sa rozsvieti žiara
  const stageOpacity = useTransform(p, [0.08, 0.4], [0, 1]);
  const glowOpacity = useTransform(p, [0.3, 0.55], [0, 1]);
  const glowScale = useTransform(p, [0.3, 0.55], [0.7, 1]);

  // Nadpis a hint
  const titleOpacity = useTransform(p, [0, 0.14], [1, 0]);
  const titleBlur = useTransform(p, [0, 0.14], ["blur(0px)", "blur(14px)"]);
  const titleScale = useTransform(p, [0, 0.14], [1, 0.94]);
  const hintOpacity = useTransform(p, [0, 0.05], [1, 0]);

  // Zostava terminálu
  const device = useTransform([p, vw, vh], ([pv, w, h]: number[]) =>
    deviceMatrix(pv, w, h),
  );
  // Odlesk: drží sa do 0.28, potom sa rozplynie do UI; pásy sa pri natáčaní posúvajú
  const reflectionOpacity = useTransform(p, [0.28, 0.5], [1, 0]);
  const streakX = useTransform(p, [0, 0.5], ["10%", "-14%"]);

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

        {/* terminál */}
        <motion.div
          style={{
            transform: device,
            width: IMG_W,
            height: IMG_H,
            opacity: deviceOpacity,
          }}
          className="absolute left-0 top-0 origin-top-left will-change-transform"
        >
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
        </motion.div>

        {/* nadpis + hint */}
        <motion.div
          style={{ opacity: titleOpacity, filter: titleBlur, scale: titleScale }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-16 px-6 text-center md:gap-24"
        >
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-background md:text-6xl">
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
      </div>
    </section>
  );
}

/** Varianta pre prefers-reduced-motion: žiadny pohyb, hotový stav. */
function HeroStatic({ title, imageAlt }: Props) {
  return (
    <section
      data-header-theme="dark"
      className="bg-stage relative isolate overflow-hidden px-6 py-24 text-primary-foreground"
    >
      <div className="bg-soft-glow absolute inset-0 -z-10" aria-hidden />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
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
