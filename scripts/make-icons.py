#!/usr/bin/env python3
"""Rasterize the Confuzzle mark for PWA icons. Pure stdlib — no Pillow."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
CYAN = (34, 211, 238)
PURPLE = (192, 132, 252)
INDIGO = (99, 102, 241)
BLUE = (59, 130, 246)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def mix(c0: tuple[int, int, int], c1: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return (
        int(lerp(c0[0], c1[0], t)),
        int(lerp(c0[1], c1[1], t)),
        int(lerp(c0[2], c1[2], t)),
    )


def hook_color(t: float) -> tuple[int, int, int]:
    if t < 0.48:
        return mix(PURPLE, INDIGO, t / 0.48)
    return mix(INDIGO, BLUE, (t - 0.48) / 0.52)


def rounded_mask(size: int, radius: int, x: int, y: int) -> bool:
    if x < radius and y < radius:
        return (x - radius) ** 2 + (y - radius) ** 2 <= radius ** 2
    if x >= size - radius and y < radius:
        return (x - (size - 1 - radius)) ** 2 + (y - radius) ** 2 <= radius ** 2
    if x < radius and y >= size - radius:
        return (x - radius) ** 2 + (y - (size - 1 - radius)) ** 2 <= radius ** 2
    if x >= size - radius and y >= size - radius:
        return (x - (size - 1 - radius)) ** 2 + (y - (size - 1 - radius)) ** 2 <= radius ** 2
    return True


def dist_point_segment(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    abx, aby = bx - ax, by - ay
    denom = abx * abx + aby * aby
    if denom == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * abx + (py - ay) * aby) / denom))
    return math.hypot(px - (ax + t * abx), py - (ay + t * aby))


def capsule(px: float, py: float, ax: float, ay: float, bx: float, by: float, r: float) -> bool:
    return dist_point_segment(px, py, ax, ay, bx, by) <= r


def cubic(p0: tuple[float, float], p1: tuple[float, float], p2: tuple[float, float], p3: tuple[float, float], t: float) -> tuple[float, float]:
    u = 1 - t
    x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
    return x, y


def dist_cubic(px: float, py: float) -> tuple[float, float]:
    best = 1e9
    best_t = 0.0
    p0, p1, p2, p3 = (80, 38), (108, 30), (118, 58), (97, 80)
    prev = p0
    steps = 48
    for i in range(1, steps + 1):
        t = i / steps
        cur = cubic(p0, p1, p2, p3, t)
        d = dist_point_segment(px, py, prev[0], prev[1], cur[0], cur[1])
        if d < best:
            best = d
            best_t = t
        prev = cur
    return best, best_t


def chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def png(size: int) -> bytes:
    scale = size / 128.0
    radius = int(size * 0.22)
    stroke = 5.5 * scale
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        sy = (y + 0.5) / scale
        for x in range(size):
            if not rounded_mask(size, radius, x, y):
                raw.extend((7, 7, 10))
                continue
            sx = (x + 0.5) / scale
            color = BLACK

            # white C arc, circle (56, 66) r=34, from ~-50deg to ~50deg the long way
            dx, dy = sx - 56.0, sy - 66.0
            r = math.hypot(dx, dy)
            ang = math.atan2(dy, dx)  # -pi..pi, 0 = right
            on_c = abs(r - 34.0) <= stroke / 2 + 0.4 and not (-0.87 < ang < 0.87)
            if on_c:
                color = WHITE

            # eyes
            for ex in (50.0, 64.0):
                if abs(sx - ex) <= 4.2 and 57 <= sy <= 75:
                    ey = max(57.0 + 4.0, min(75.0 - 4.0, sy))
                    if math.hypot(sx - ex, sy - ey) <= 4.2:
                        color = WHITE

            hook_d, hook_t = dist_cubic(sx, sy)
            if hook_d <= stroke / 2 + 0.35:
                color = hook_color(hook_t)

            if math.hypot(sx - 64.0, sy - 104.0) <= 6.5:
                color = CYAN

            sparks = (
                ((76.5, 16.0), (72.0, 29.0), PURPLE),
                ((88.5, 14.5), (90.5, 29.0), INDIGO),
                ((99.5, 19.0), (104.5, 32.5), CYAN),
            )
            for a, b, spark_color in sparks:
                if capsule(sx, sy, a[0], a[1], b[0], b[1], 2.6):
                    color = spark_color

            raw.extend(color)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


out = Path("/workspace/public")
out.mkdir(exist_ok=True)
(out / "icon-192.png").write_bytes(png(192))
(out / "icon-512.png").write_bytes(png(512))
(out / "apple-touch-icon.png").write_bytes(png(180))
print("wrote icons")
