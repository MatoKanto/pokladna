"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import meta from "../../../../public/images/terminal-seq/meta.json";

export const SEQUENCE = meta; // { frames, width, height }
const { frames: FRAME_COUNT } = meta;

export const sequenceSrc = (i: number) =>
  `/images/terminal-seq/${String(i).padStart(3, "0")}.webp`;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Okno dekódovaných snímok okolo aktuálnej (zvyšok ostáva len ako stiahnutý súbor). */
const KEEP_BEHIND = 4;
const KEEP_AHEAD = 10;

/**
 * Terminál ako sekvencia snímok (360° video → priehľadné WebP, pozri
 * scripts/terminal-sequence). `progress` (0 až 1) určuje, ktorá snímka sa kreslí;
 * medzi susednými snímkami sa prelína, takže pohyb je plynulý.
 *
 * Výkon: všetkých 76 snímok dekódovaných naraz by zaberalo stovky MB a prehliadač by
 * ich vyhadzoval z cache (dekódovanie pri každom kreslení = sekanie). Preto sa
 * stiahnu ako súbory (Blob) a ako ImageBitmap sa dekódujú len v okne okolo aktuálnej
 * snímky; ostatné sa uvoľnia.
 */
export function TerminalSequence({
  progress,
  alt,
  className,
}: {
  progress: MotionValue<number>;
  alt: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobs = useRef<(Blob | undefined)[]>([]);
  const bitmaps = useRef<(ImageBitmap | undefined)[]>([]);
  const pending = useRef<Set<number>>(new Set());
  const lastKey = useRef("");

  /** Najbližšia dostupná dekódovaná snímka. */
  const pick = (i: number) => {
    const list = bitmaps.current;
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (list[i - d]) return list[i - d];
      if (list[i + d]) return list[i + d];
    }
    return undefined;
  };

  const draw = useCallback(function redraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const v = clamp01(progress.get()) * (FRAME_COUNT - 1);
    const i0 = Math.floor(v);
    const f = v - i0;
    const i1 = Math.min(i0 + 1, FRAME_COUNT - 1);

    // dekódovať okno okolo aktuálnej snímky, vzdialené uvoľniť
    const lo = Math.max(0, i0 - KEEP_BEHIND);
    const hi = Math.min(FRAME_COUNT - 1, i1 + KEEP_AHEAD);
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (i >= lo && i <= hi) {
        const blob = blobs.current[i];
        if (blob && !bitmaps.current[i] && !pending.current.has(i)) {
          pending.current.add(i);
          createImageBitmap(blob)
            .then((bm) => {
              pending.current.delete(i);
              bitmaps.current[i] = bm;
              redraw();
            })
            .catch(() => pending.current.delete(i));
        }
      } else if (bitmaps.current[i]) {
        bitmaps.current[i]?.close();
        bitmaps.current[i] = undefined;
      }
    }

    const a = pick(i0);
    const b = f > 0.02 ? pick(i1) : undefined;
    // nekresliť znova, ak sa nič nezmenilo (rovnaké snímky a miešanie)
    const key = `${i0}|${f > 0.02 ? f.toFixed(2) : 0}|${a ? 1 : 0}${b ? 1 : 0}|${canvas.width}`;
    if (key === lastKey.current && a) return;
    lastKey.current = key;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (a) ctx.drawImage(a, 0, 0, canvas.width, canvas.height);
    if (b && b !== a) {
      ctx.globalAlpha = f;
      ctx.drawImage(b, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  }, [progress]);

  useMotionValueEvent(progress, "change", draw);

  // Stiahnutie snímok (prvá a posledná ako prvé) ako Blob; dekódovanie rieši draw()
  useEffect(() => {
    let cancelled = false;
    const order = [
      0,
      FRAME_COUNT - 1,
      ...Array.from({ length: FRAME_COUNT - 2 }, (_, k) => k + 1),
    ];
    const load = async (i: number) => {
      try {
        const res = await fetch(sequenceSrc(i));
        const blob = await res.blob();
        if (cancelled) return;
        blobs.current[i] = blob;
        draw();
      } catch {
        /* snímka sa preskočí, kreslí sa najbližšia dostupná */
      }
    };
    // pár súbežných sťahovaní, nech nezahltia sieť
    let next = 0;
    const worker = async () => {
      while (!cancelled && next < order.length) await load(order[next++]);
    };
    for (let w = 0; w < 4; w++) void worker();
    const bms = bitmaps.current;
    return () => {
      cancelled = true;
      bms.forEach((bm) => bm?.close());
    };
  }, [draw]);

  // Plátno má rozlíšenie plnej snímky (nie veľkosť na obrazovke), lebo scéna terminál
  // pri štarte mnohonásobne zväčšuje; prehliadač ho podľa potreby zmenší.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = meta.width;
    canvas.height = meta.height;
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
    />
  );
}
