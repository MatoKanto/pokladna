import sys, numpy as np, cv2
from collections import deque

def matte(rgb):
    """Vyreže biele pozadie. rgb: HxWx3 uint8 (pozadie čisto biele). Vráti RGBA uint8."""
    h, w, _ = rgb.shape
    f = rgb.astype(np.int16)
    d = (255 - f.min(axis=2)).astype(np.uint8)          # "tmavosť" voči bielej
    # 1) pozadie = takmer biele pixely spojené s okrajom obrázka
    near_white = (d <= 5).astype(np.uint8)
    n, lab = cv2.connectedComponents(near_white, connectivity=4)
    border_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border_labels.discard(0)
    bg = np.isin(lab, list(border_labels)) & (near_white == 1)
    # 2) odstrániť kontaktný tieň: všetko pod spodnou hranou zariadenia
    strong = d > 60
    ys = np.where(strong.any(axis=1))[0]
    bottom = ys.max()
    # 3) popredie = nie pozadie, nad spodnou hranou, len v blízkosti tmavých pixelov
    #    (zvyšky kontaktného tieňa sú svetlé a bez tmavého okolia, displej s bielym UI
    #    je obklopený tmavým rámom, takže po vyplnení dier zostane)
    dil = cv2.dilate((d > 60).astype(np.uint8), np.ones((5, 5), np.uint8))
    ff = (1 - dil).copy()
    mask = np.zeros((h + 2, w + 2), np.uint8)
    # vyplniť vonkajšok zo štyroch rohov
    for pt in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if ff[pt[1], pt[0]] == 1:
            cv2.floodFill(ff, mask, pt, 2)
    allowed = ff != 2
    fg = (~bg) & allowed
    fg[bottom + 2:, :] = False
    fg = fg.astype(np.uint8)
    # odstrániť drobné ostrovčeky (zvyšky tieňa / šum)
    n, lab2, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if n > 1:
        keep = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
        fg = (lab2 == keep).astype(np.uint8)
    # 4) alfa: jadro = 1, okraj podľa tmavosti voči odhadu farby popredia (difference matting)
    core = cv2.erode(fg, np.ones((3, 3), np.uint8), iterations=2)
    dist, labels = cv2.distanceTransformWithLabels(1 - core, cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL)
    # farba najbližšieho pixelu jadra
    ys_c, xs_c = np.where(core == 1)
    lut = np.zeros((labels.max() + 1, 3), np.float32)
    # labely v distanceTransformWithLabels číslujú pixely s nulovou vzdialenosťou (jadro)
    idx = labels[ys_c, xs_c]
    lut[idx] = rgb[ys_c, xs_c]
    fgc = lut[labels]
    alpha = np.where(core == 1, 1.0, 0.0).astype(np.float32)
    edge = (fg == 1) & (core == 0)
    c = rgb.astype(np.float32)
    bgc = np.full_like(c, 255.0)
    num = ((bgc - c) * (bgc - fgc)).sum(axis=2)
    den = ((bgc - fgc) ** 2).sum(axis=2) + 1e-3
    a_edge = np.clip(num / den, 0, 1)
    alpha[edge] = a_edge[edge]
    # vonkajší 1px lem (antialias mimo fg masky)
    ring = cv2.dilate(fg, np.ones((3, 3), np.uint8)) - fg
    ring_m = (ring == 1)
    ring_m[bottom + 2:, :] = False
    a_ring = np.clip(num / den, 0, 1)
    alpha[ring_m] = np.maximum(alpha[ring_m], a_ring[ring_m] * (d[ring_m] > 4))
    # odfarbiť odtieň bieleho pozadia z polopriehľadných pixelov: F = (C - (1-a)*255)/a
    a3 = np.clip(alpha[..., None], 1e-3, 1)
    F = np.clip((c - (1 - a3) * 255.0) / a3, 0, 255)
    F = np.where(alpha[..., None] > 0.995, c, F)
    out = np.dstack([F.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    out[alpha <= 0.003] = 0
    return out
