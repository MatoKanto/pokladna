"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import meta from "../../../../public/images/terminal-seq/meta.json";

export const SEQUENCE = meta; // { frames, width, height }
const { frames: FRAME_COUNT } = meta;

export const sequenceSrc = (i: number) =>
  `/images/terminal-seq/${String(i).padStart(3, "0")}.webp`;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Terminál ako sekvencia snímok (360° video → priehľadné WebP, pozri
 * scripts/terminal-sequence). `progress` (0 až 1) určuje, ktorá snímka sa kreslí;
 * medzi susednými snímkami sa prelína, takže pohyb je plynulý.
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
  const images = useRef<(HTMLImageElement | undefined)[]>([]);

  /** Najbližšia už načítaná snímka (kým sa ostatné doťahujú). */
  const pick = (i: number) => {
    const list = images.current;
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (list[i - d]) return list[i - d];
      if (list[i + d]) return list[i + d];
    }
    return undefined;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const v = clamp01(progress.get()) * (FRAME_COUNT - 1);
    const i0 = Math.floor(v);
    const f = v - i0;
    const i1 = Math.min(i0 + 1, FRAME_COUNT - 1);
    const a = pick(i0);
    const b = pick(i1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (a) ctx.drawImage(a, 0, 0, canvas.width, canvas.height);
    if (b && b !== a && f > 0.01) {
      ctx.globalAlpha = f;
      ctx.drawImage(b, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  }, [progress]);

  useMotionValueEvent(progress, "change", draw);

  // Načítanie snímok (prvá ako prvá) a prekreslenie po každej načítanej
  useEffect(() => {
    const list = images.current;
    let cancelled = false;
    const load = (i: number) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (cancelled) return;
        list[i] = img;
        draw();
      };
      img.src = sequenceSrc(i);
    };
    load(0);
    load(FRAME_COUNT - 1);
    const t = window.setTimeout(() => {
      for (let i = 1; i < FRAME_COUNT - 1; i++) load(i);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [draw]);

  // Rozlíšenie plátna podľa veľkosti na obrazovke (a hustoty pixelov)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
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
