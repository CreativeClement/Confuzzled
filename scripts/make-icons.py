import zlib
import struct
from pathlib import Path

NAVY = (42, 51, 140)
GOLD = (245, 185, 66)


def chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def png(size: int) -> bytes:
    raw = bytearray()
    radius = int(size * 0.22)
    for y in range(size):
        raw.append(0)
        for x in range(size):
            inside = True
            corners = (
                (x < radius and y < radius, x - radius, y - radius),
                (x >= size - radius and y < radius, x - (size - 1 - radius), y - radius),
                (x < radius and y >= size - radius, x - radius, y - (size - 1 - radius)),
                (x >= size - radius and y >= size - radius, x - (size - 1 - radius), y - (size - 1 - radius)),
            )
            for hit, dx, dy in corners:
                if hit and dx * dx + dy * dy > radius * radius:
                    inside = False
                    break
            if not inside:
                raw.extend((250, 247, 242))
                continue
            # gold path: a thick S-curve
            t = x / max(size - 1, 1)
            curve_y = int((0.28 + 0.44 * (1 - abs(2 * t - 1))) * size)
            on_curve = abs(y - curve_y) < max(3, size // 28)
            dot = (x - int(size * 0.72)) ** 2 + (y - int(size * 0.72)) ** 2 < (size * 0.07) ** 2
            if on_curve or dot:
                raw.extend(GOLD)
            else:
                raw.extend(NAVY)
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
