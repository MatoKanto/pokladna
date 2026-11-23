/**
 * Minimálna 2D projektívna matematika (homografie) pre "nakláňanie" plochého
 * obrázka do perspektívy cez CSS `matrix3d`. Bez závislostí.
 */
export type Pt = readonly [number, number];
/** 3×3 matica po riadkoch: [a b c, d e f, g h i] */
export type Mat3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mul(A: Mat3, B: Mat3): Mat3 {
  const r: number[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]);
    }
  }
  return r as unknown as Mat3;
}

export const translate = (x: number, y: number): Mat3 => [1, 0, x, 0, 1, y, 0, 0, 1];
export const scale = (s: number): Mat3 => [s, 0, 0, 0, s, 0, 0, 0, 1];

/** Homografia, ktorá zobrazí 4 body `src` na 4 body `dst`. */
export function homography(src: readonly Pt[], dst: readonly Pt[]): Mat3 {
  // Sústava 8×8 pre h11..h32 (h33 = 1)
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  // Gaussova eliminácia s čiastočným pivotovaním
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = c + 1; r < 8; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  const h = new Array<number>(8).fill(0);
  for (let r = 7; r >= 0; r--) {
    let s = A[r][8];
    for (let k = r + 1; k < 8; k++) s -= A[r][k] * h[k];
    h[r] = s / A[r][r];
  }
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/** CSS `transform` hodnota (matrix3d) z 2D homografie. Používať s `transform-origin: 0 0`. */
export function toMatrix3d(M: Mat3): string {
  const n = M[8] || 1;
  const m = M.map((v) => v / n);
  return `matrix3d(${m[0]},${m[3]},0,${m[6]},${m[1]},${m[4]},0,${m[7]},0,0,1,0,${m[2]},${m[5]},0,1)`;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
