# Pro Hands — Visual & 3D Design System Notes
**Agent: Visual & 3D Design**
**File: `css/visual-3d.css`**
**Date: 2026-03-25**

---

## Overview

`visual-3d.css` is a pure-CSS visual enhancement layer that loads after `style.css`. It does not break or replace existing rules — it upgrades them using higher-specificity selectors, additional pseudo-elements, and CSS custom properties that extend the existing token set.

---

## Key Design Decisions

### 1. Color Philosophy — Warm Earth + Tech Navy
The brand operates in two emotional registers: nature/earth (puppetry, sustainability, Jordan) and professionalism/authority (NGO credibility). The gradient system resolves this tension by pairing the existing `#F5C518` / `#F5A623` warm golds against `#2D3B55` / `#1E2A3D` deep navies, with `#3E9E67` / `#2D7A4F` earth greens bridging them. No new hue families were introduced — all palette expansions derive from the existing three brand primaries.

### 2. 3D Sphere — Pure CSS, No JS Required
The hero globe uses five stacked elements (`hero__sphere-core`, `hero__sphere-grid`, `hero__sphere-ring`, `hero__sphere-ring-2`, `hero__sphere-dot`) inside a `transform-style: preserve-3d` wrapper. The illusion of a 3D sphere relies on:
- Radial gradient with offset highlight center (35% 30%) to fake directional lighting
- `inset` box-shadow for rim darkening
- A `::before` specular highlight oval in the top-left quadrant
- A `::after` teal/gold atmospheric bounce light in the bottom-right
- Conic grid lines via `repeating-linear-gradient` clipped to the circle
- Two orbit rings at `rotateX(75deg)` — one gold, one teal

The floating animation runs at 6s and sphere spin at 20s, both on separate keyframes so they compound naturally.

### 3. 3D Card Hover System — Two Approaches
**MVV Cards (Mission/Vision/Values):** Soft Apple-style floating. Uses `box-shadow` layering (4 layers: diffuse, medium, inset highlight, inset rim) plus a `rotateX(2deg)` micro-tilt on hover to convey depth without disorientation. Each card has a unique pastel tinted background and icon accent color (teal, gold, green).

**Project Cards:** More dramatic tilt — `rotateX(-8deg) rotateY(6deg)` — because project cards are visually image-led and can support stronger 3D movement. Alternating `nth-child(even)` flips the Y axis to create a natural "fanned" effect across the row. A shine sweep `::after` slides across on hover using `left` transition.

### 4. Blob Shapes — Organic Backgrounds
`hero::before` and `hero::after` use animating `border-radius` values (6 values in the shorthand) to morph between leaf/teardrop shapes over a 10–12s loop with `alternate-reverse`. This avoids the "always wobbling" feel of some blob animations. The blobs are radial gradients, not solid shapes, so they blend naturally with the underlying gradient.

### 5. Noise Texture — Perception Over Visibility
The SVG noise texture (`body::before`, `position: fixed`, `z-index: 9999`) runs at `opacity: 0.035`. At this level it is not consciously visible but breaks up the "too clean" digital flatness of large gradient blocks — a technique common in premium brand sites. It uses an inline SVG data URI with `feTurbulence` + `feColorMatrix` to generate organic grain without a PNG asset.

### 6. Typography Elevation — Background-clip Gradient Text
Section headings use `background-clip: text` with a navy-to-teal gradient. This avoids the "too colorful" feel of yellow gradient headings while still differentiating them from plain black text. H1 on dark backgrounds adds a `text-shadow` glow in muted yellow (15% opacity) — perceptible as warmth, not as visible shadow.

### 7. Circular Progress — CSS Conic-gradient
Impact metric rings use `conic-gradient` with a `--progress` CSS custom property (0–100). Set from HTML via `style="--progress: 82"`. A `@keyframes ringGrow` animation transitions from 0 to the target value on page load. The donut cutout is achieved with an `inset: 10px` pseudo-element rather than `background` masking, making it simpler to overlay text.

### 8. Impact Section — Dark Glass Panels
When impact metrics are displayed over the dark hero gradient, the card style switches to glassmorphism: `background: rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)` + `border: 1px solid rgba(255,255,255,0.12)`. This pattern reads as "floating panel" against the dark gradient, consistent with modern data-driven nonprofit sites.

### 9. Shimmer Button Effect
The `.btn--gradient` shimmer is a `linear-gradient` pseudo-element animated via `left` from `-100%` to `100%` on hover. This runs on the transform layer (no repaints) and uses `overflow: hidden` on the button for natural clipping. Duration is 0.55s with `cubic-bezier(0.19,1,0.22,1)` for a fast-start, slow-end feel.

### 10. Accessibility — Reduced Motion Compliance
A `@media (prefers-reduced-motion: reduce)` block at the end collapses all animation durations to `0.01ms` and sets `animation-iteration-count: 1`. Scroll-reveal `[data-reveal]` elements are immediately set to full opacity and no transform, so no content is hidden if the user has reduced motion enabled.

### 11. Responsive Strategy
- Sphere is hidden (`display: none`) below 768px — it competes with hero text on small screens
- 3D card tilts degrade to simple `translateY(-4px)` on mobile — expensive GPU compositing layers unnecessary at this size
- Blob shapes reduce to 280px on mobile to avoid edge clipping artifacts
- Particles above index 5 are hidden on mobile (via `nth-child(n+5) { display: none }`)

---

## File Organization — Sections
| # | Section | Lines (approx) |
|---|---------|----------------|
| 1 | Extended CSS Custom Properties | 1–85 |
| 2 | Global visual (noise texture) | 86–96 |
| 3 | Gradient utility classes | 97–120 |
| 4 | Hero background + blobs | 121–195 |
| 5 | 3D Sphere element | 196–320 |
| 6 | Typography elevation | 321–385 |
| 7 | Gradient buttons + shimmer | 386–440 |
| 8 | 3D MVV Value Cards | 441–555 |
| 9 | 3D Project Cards | 556–660 |
| 10 | Section backgrounds + transitions | 661–740 |
| 11 | Brand textures + leaf decor | 741–820 |
| 12 | Impact metrics + conic rings | 821–940 |
| 13 | Newsletter CTA section | 941–1005 |
| 14 | Navbar glass scrolled state | 1006–1030 |
| 15 | Footer gradient | 1031–1060 |
| 16 | Scroll reveal animations | 1061–1100 |
| 17 | Role cards enhanced | 1101–1150 |
| 18 | Split/About image polish | 1151–1215 |
| 19 | Keyframe library | 1216–1285 |
| 20 | Responsive + reduced motion | 1286–end |

---

## Integration Checklist for HTML Agent

1. Add `<link rel="stylesheet" href="css/visual-3d.css">` **after** `style.css`
2. Hero sphere: Insert `.hero__3d-sphere > .hero__sphere-wrap > (.hero__sphere-core + .hero__sphere-grid + .hero__sphere-ring > .hero__sphere-dot + .hero__sphere-ring-2 + .hero__sphere-shadow)` inside `.hero`
3. Hero particles: Insert `.hero__particles > .hero__particle × 7` inside `.hero`
4. Impact rings: Add `style="--progress: 82; --ring-delay: 0.2s;"` inline on `.impact-ring` elements
5. Scroll reveal: Add `data-reveal="true"` (or `fade-left`, `fade-right`, `scale`) to cards/sections; wire `IntersectionObserver` in JS to add class `revealed`
6. Display numbers: Wrap large metric numbers in `<span class="display-number">`
7. Gradient text headings: Add class `text-gradient-yellow` or `text-gradient-earth` to hero taglines
