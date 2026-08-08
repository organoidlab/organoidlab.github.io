#!/usr/bin/env python3
"""
유기적인 오가노이드 모식도 SVG 생성기.

핵심은 '불규칙성'입니다. 모든 위치, 크기, 각도, 색에 난수를 섞어
자로 잰 듯한 느낌을 없앱니다. seed 를 바꾸면 다른 배치가 나옵니다.
"""
import math, random

import sys
SEED = int(sys.argv[2]) if len(sys.argv) > 2 else 20260808
random.seed(SEED)

# 전체 진하기 배율. 이 값만 바꾸면 농도가 한꺼번에 조절됩니다.
GAIN = 2.4

W = H = 580

# ── 색: 채도를 낮춘 세포 유형별 팔레트 ──────────────────────────
C = {
    "vrg":    "#9aa4d4",   # 심실 방사교세포 (안쪽)
    "org":    "#6f6ab0",   # 외측 방사교세포
    "ip":     "#7fa9c8",   # 중간전구세포
    "deep":   "#4d87a4",   # 심층 뉴런
    "upper":  "#8b9c5e",   # 표층 뉴런
    "astro":  "#b8695f",   # 성상교세포 (드물게)
    "reelin": "#c98a78",   # 카할-레치우스 (드물게)
    "fiber":  "#7b86b8",   # 돌기
}

def j(v, amt):
    """지터: 값에 ±amt 만큼 흔들림을 줍니다."""
    return v + random.uniform(-amt, amt)

def blob(cx, cy, r, wobble=0.18, n=11):
    """불규칙한 닫힌 곡선. 원에 난수를 섞고 부드럽게 잇습니다."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n + random.uniform(-0.09, 0.09)
        rr = r * (1 + random.uniform(-wobble, wobble))
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    # Catmull-Rom 을 베지어로 변환해 매끄럽게
    d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"
    for i in range(len(pts)):
        p0 = pts[(i - 1) % len(pts)]
        p1 = pts[i]
        p2 = pts[(i + 1) % len(pts)]
        p3 = pts[(i + 2) % len(pts)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d + " Z"

def taper(cx, cy, ang, L, w, bulge=0.42):
    """방사형 세포 하나. 안쪽이 뾰족하고 중간이 불룩한 물방울 모양."""
    dx, dy = math.cos(ang), math.sin(ang)
    px, py = -dy, dx                      # 수직 방향
    x0, y0 = cx, cy                       # 정단 (안쪽)
    x1, y1 = cx + dx * L, cy + dy * L     # 기저 (바깥)
    bx, by = cx + dx * L * bulge, cy + dy * L * bulge
    lx, ly = bx + px * w, by + py * w
    rx, ry = bx - px * w, by - py * w
    return (f"M{x0:.1f},{y0:.1f} "
            f"Q{lx:.1f},{ly:.1f} {x1:.1f},{y1:.1f} "
            f"Q{rx:.1f},{ry:.1f} {x0:.1f},{y0:.1f} Z")

out = []
add = out.append

def rosette(cx, cy, r, layers, spread=1.0):
    """로제트 하나. 루멘 + 방사형 세포층 + 흩어진 뉴런."""
    g = []
    # 루멘 (중심 공동)
    g.append(f'<path d="{blob(cx, cy, r, 0.20)}" fill="none" '
             f'stroke="{C["vrg"]}" stroke-opacity="0.30" stroke-width="1.2"/>')

    base = r
    for depth, (key, thick, op, dens) in enumerate(layers):
        n = max(8, int(2 * math.pi * (base + thick / 2) / (7.0 / dens)))
        for i in range(n):
            a = 2 * math.pi * i / n + random.uniform(-0.05, 0.05)
            L = j(thick, thick * 0.26) * spread
            wd = j(3.1, 0.9) + depth * 0.5
            sx = cx + math.cos(a) * base
            sy = cy + math.sin(a) * base
            g.append(f'<path d="{taper(sx, sy, a, L, wd)}" fill="{C[key]}" '
                     f'fill-opacity="{op*GAIN:.3f}"/>')
            # 핵
            nr = j(2.5, 0.6)
            nx = sx + math.cos(a) * L * j(0.45, 0.16)
            ny = sy + math.sin(a) * L * j(0.45, 0.16)
            g.append(f'<circle cx="{nx:.1f}" cy="{ny:.1f}" r="{nr:.1f}" '
                     f'fill="{C[key]}" fill-opacity="{min(op*GAIN*1.9,0.62):.3f}"/>')
        base += thick * 0.86
    return g, base

def neuron(x, y, key, op, size=1.0):
    """가지가 몇 개 뻗은 뉴런. 가지 수와 방향 모두 난수."""
    g = []
    for _ in range(random.randint(3, 5)):
        a = random.uniform(0, 2 * math.pi)
        l = j(11, 4.5) * size
        mx = x + math.cos(a + j(0, 0.5)) * l * 0.55
        my = y + math.sin(a + j(0, 0.5)) * l * 0.55
        ex = x + math.cos(a) * l
        ey = y + math.sin(a) * l
        g.append(f'<path d="M{x:.1f},{y:.1f} Q{mx:.1f},{my:.1f} {ex:.1f},{ey:.1f}" '
                 f'fill="none" stroke="{C[key]}" stroke-opacity="{op*0.7:.3f}" '
                 f'stroke-width="{j(0.9,0.25):.2f}" stroke-linecap="round"/>')
    g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{j(3.4,0.8)*size:.1f}" '
             f'fill="{C[key]}" fill-opacity="{min(op*GAIN,0.62):.3f}"/>')
    return g

# ── 큰 로제트 (우하단, 주인공) ─────────────────────────────────
g1, edge1 = rosette(352, 372, 62, [
    ("vrg",   34, 0.115, 1.05),
    ("org",   30, 0.100, 0.92),
    ("ip",    24, 0.085, 0.80),
])
out += g1

# ── 작은 로제트 두 개 (겹쳐서 조직 덩어리처럼) ──────────────────
g2, edge2 = rosette(232, 250, 34, [
    ("vrg",   26, 0.100, 0.95),
    ("org",   22, 0.085, 0.82),
])
out += g2

g3, edge3 = rosette(470, 486, 28, [
    ("vrg",   22, 0.090, 0.90),
    ("ip",    18, 0.075, 0.78),
])
out += g3

# ── 바깥 뉴런층: 심층 → 표층 순으로 흩뿌림 ─────────────────────
def scatter(cx, cy, r0, r1, key, op, count, size=1.0):
    g = []
    for _ in range(count):
        a = random.uniform(0, 2 * math.pi)
        rr = random.uniform(r0, r1)
        g += neuron(cx + math.cos(a) * rr, cy + math.sin(a) * rr, key, op, size)
    return g

out += scatter(352, 372, edge1 - 6,  edge1 + 26, "deep",  0.185, 34)
out += scatter(352, 372, edge1 + 18, edge1 + 52, "upper", 0.155, 30, 1.1)
out += scatter(232, 250, edge2 - 4,  edge2 + 22, "deep",  0.150, 16)
out += scatter(232, 250, edge2 + 14, edge2 + 40, "upper", 0.125, 14, 1.05)
out += scatter(470, 486, edge3 - 4,  edge3 + 20, "deep",  0.140, 12)

# ── 드문 강조 세포: 성상교세포와 카할-레치우스 ──────────────────
for _ in range(5):
    a = random.uniform(0, 2 * math.pi); rr = random.uniform(edge1 + 14, edge1 + 54)
    out += neuron(352 + math.cos(a) * rr, 372 + math.sin(a) * rr, "astro", 0.20, 1.25)
for _ in range(7):
    a = random.uniform(0, 2 * math.pi); rr = random.uniform(edge1 + 30, edge1 + 62)
    x, y = 352 + math.cos(a) * rr, 372 + math.sin(a) * rr
    out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{j(6.5,1.4):.1f}" '
               f'ry="{j(4.2,0.9):.1f}" transform="rotate({j(0,60):.0f} {x:.1f} {y:.1f})" '
               f'fill="{C["reelin"]}" fill-opacity="0.30"/>')

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="presentation" aria-hidden="true">
  <defs>
    <radialGradient id="oFade" cx="62%" cy="66%" r="54%">
      <stop offset="0%"   stop-color="#fff" stop-opacity="1"/>
      <stop offset="50%"  stop-color="#fff" stop-opacity="0.88"/>
      <stop offset="82%"  stop-color="#fff" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="oMask"><rect x="-160" y="-160" width="900" height="900" fill="url(#oFade)"/></mask>
  </defs>
  <g mask="url(#oMask)">
    {chr(10).join("    " + s for s in out)}
  </g>
</svg>
'''

open(sys.argv[1] if len(sys.argv) > 1 else "organoid.svg", "w", encoding="utf-8").write(svg)
print(f"{len(out)} shapes, {len(svg)/1024:.1f} KB")
