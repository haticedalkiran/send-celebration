"""Generates icons/icon{16,48,128}.png from a 16x16 pixel-art grid (nearest-neighbor scaling)."""
import struct, zlib

PALETTE = {
    '.': None,
    'n': (0x1a, 0x1a, 0x2e), 'y': (0xff, 0xe6, 0x00), 'w': (0xff, 0xff, 0xff),
    'p': (0xff, 0x2e, 0x63), 'c': (0x08, 0xd9, 0xd6), 'g': (0x7c, 0xff, 0x4f),
    'u': (0xb9, 0x67, 0xff), 'o': (0xc9, 0xa8, 0x00),
}

GRID = [
    ".nnnnnnnnnnnnnn.",
    "nnpnnnnngnnnnunn",
    "nnnnnnnwnnnnnnnn",
    "nunnnnwwwnncnnpn",
    "nnnnnnnwnnnnnnnn",
    "nnyyyyyyyyyyyynn",
    "nnynyyyyyyyynynn",
    "nnyynyyyyyynyynn",
    "nnyyynyyyynyyynn",
    "nnyyyynyynyyyynn",
    "nnyyyyynnyyyyynn",
    "nnyyyyyyyyyyyynn",
    "nnyyyyyyyyyyyynn",
    "nngnnnnnnnnnnpnn",
    "nnnnnncnnnnnnnnn",
    ".nnnnnnnnnnnnnn.",
]

def png(pixels, w, h):
    raw = b''.join(b'\x00' + bytes(v for px in row for v in px) for row in pixels)
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

def render(scale):
    rows = []
    for line in GRID:
        row = []
        for ch in line:
            c = PALETTE[ch]
            row += [(*c, 255) if c else (0, 0, 0, 0)] * scale
        rows += [row] * scale
    return png(rows, 16 * scale, 16 * scale)

for size, scale in ((16, 1), (48, 3), (128, 8)):
    open(f'icons/icon{size}.png', 'wb').write(render(scale))
print('ok')
