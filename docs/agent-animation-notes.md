# Pro Hands — Animation & Motion Design Notes
**Agent:** Animation & Interaction Agent
**Deliverables:** `css/animations.css`, `js/animations.js`

---

## 1. Animation Timing Philosophy

The guiding principle for Pro Hands is **purposeful restraint**. Every animation must earn its place by communicating information (this element just entered the viewport), conveying hierarchy (important items arrive first), or reinforcing brand warmth (organic, unhurried motion that matches the human-centred mission).

### Duration scale

| Token       | Value  | Used for                                    |
|-------------|--------|---------------------------------------------|
| `--dur-xs`  | 150ms  | Micro-states: button active press, focus ring |
| `--dur-sm`  | 250ms  | Hover transitions: color, underline, icon scale |
| `--dur-md`  | 400ms  | UI feedback: ripple, nav compact, form focus  |
| `--dur-lg`  | 600ms  | Scroll-reveal entrances for single elements  |
| `--dur-xl`  | 900ms  | Hero headline entrance, slide-bottom reveals |
| `--dur-2xl` | 1200ms | Reserved: complex hero sequences only        |

The 600ms sweet spot for scroll reveals was chosen because it is long enough for the audience to perceive a graceful entrance but short enough that fast scrollers never feel blocked. Research consistently shows that UI transitions feel "snappy" below ~400ms and "cinematic" in the 600–900ms range.

---

## 2. Easing Choices

Four easing curves are defined, each selected for a specific physical metaphor:

### `--ease-out-expo` — `cubic-bezier(0.16, 1, 0.3, 1)`
Used for scroll reveals and hero entrance animations. Starts fast (the element is "shot" into position) and decelerates gently to rest — mimicking a physical object that loses momentum as it arrives. The aggressive deceleration keeps the motion feeling energetic rather than sluggish.

### `--ease-out-quart` — `cubic-bezier(0.25, 1, 0.5, 1)`
Used for hover states, nav transitions, and card interactions. Slightly gentler than expo; suited for continuous interactions where the user's cursor is still moving. The smooth deceleration matches the gesture metaphor of "placing" an element.

### `--ease-spring` — `cubic-bezier(0.34, 1.56, 0.64, 1)`
Used for buttons, icons, and scale transforms. The slight overshoot past the target value (the "spring" character) adds life and personality — echoing the playful, handcraft nature of puppetry. Used sparingly so it reads as deliberate, not cheap.

### `--ease-organic` — `cubic-bezier(0.45, 0.05, 0.35, 0.95)`
Used exclusively for the morphBlob background animation. A slow S-curve that suggests living, breathing material — organic forms rather than mechanical interpolation.

### Why not `ease-in-out`?
Standard `ease-in-out` starts and ends slowly. For scroll reveals, a slow start means the element appears to "hesitate" before moving — which reads as lag. Out-only curves give instant responsiveness that matches user expectation.

---

## 3. Performance Considerations

### GPU Compositing — the golden rule
Only `opacity` and `transform` are animated. These are the only two CSS properties that the browser can animate entirely on the GPU compositor thread, meaning they never trigger layout recalculation or paint. Every other property (color, background, border-radius in some cases, width, height, margin) forces a main thread repaint.

Key decisions made in service of this:
- Nav underline uses `transform: scaleX()` instead of `width: 0 → 100%`. The visual result is identical; the performance is dramatically better.
- Card hover lifts use `translateY(-8px)` not `margin-top: -8px` or `top: -8px`.
- The cursor glow uses a CSS custom property on `<html>` + a fixed `radial-gradient` background — only the property value changes, and the browser repaints only the gradient element (not the entire page).

### `will-change` — used conservatively
`will-change: transform` and `will-change: opacity` are set only on elements that definitely animate:
- `.hero__bg` (parallax scroll transform)
- `.hero__globe` / `.hero__floating` (continuous float animation)
- `.card-3d .card-3d__inner` (per-frame tilt updates)
- `.reveal` variants (transition during scroll)

`will-change` is a hint to the browser to create a new compositor layer. Each layer consumes GPU memory (roughly proportional to the element's pixel area). On low-end mobile devices (common in Jordan), excessive layers cause jank rather than fixing it. The rule of thumb: only set `will-change` if the animation is imminent or already running.

### `requestAnimationFrame` batching
All JavaScript that writes to the DOM (parallax, counter, card tilt, cursor glow) uses `requestAnimationFrame`. A `ticking` boolean flag ensures only one rAF is queued per scroll/mousemove event, preventing the "spiral of death" where rapid events spawn hundreds of pending rAF callbacks.

### IntersectionObserver vs. scroll events
Scroll-reveal uses IntersectionObserver rather than `window.scroll`. The IO callback runs off the main thread and is far more efficient — no repeated getBoundingClientRect() calls per scroll event. The `unobserve()` call after trigger ensures elements are no longer tracked once visible, keeping the observer's internal list small.

### Passive event listeners
All `scroll` and `touch` event listeners are registered with `{ passive: true }`. This tells the browser the handler will never call `preventDefault()`, allowing it to begin scrolling immediately without waiting for JavaScript to complete. This eliminates a common source of scroll jank.

---

## 4. Motion Language for Pro Hands

The motion language is an extension of the visual brand — it must feel **human, warm, and grounded** rather than corporate or mechanical.

### Metaphors
- **Entrances** — elements arrive like a performer stepping on stage: purposeful, from below, decelerating naturally to their mark.
- **Hover / touch** — a response to human contact: slight lift (`translateY`) as if an object is being picked up; scale expansion like a person brightening when engaged.
- **Hero globe** — continuous breathing motion (`float` keyframe) suggests a living world, relevant to the environmental sustainability pillar.
- **Background blobs** — slow morphing organic shapes echo the handmade, craft-based world of puppetry; never sharp or mechanical.
- **Counters** — numbers counting up celebrate achievement; the eased acceleration mirrors a crowd's growing excitement as a milestone approaches.
- **Ripple** — a physical metaphor for human touch; the wave emanates from exactly where the finger/cursor made contact.

### What is deliberately avoided
- No `bounce` on entrance elements (reserved only for the existing scroll indicator arrow which already uses it in style.css).
- No rotation on reveal entrances — rotation suggests confusion or instability; up/down and scale reveals feel more confident.
- No flash or strobe effects.
- No decorative animations that loop at high frequency when on-screen (all loops are slow: 6s–26s).

### Cultural context
Pro Hands serves a Jordanian/Arabic-speaking community. The motion palette is deliberately calm and deliberate — rapid, flashy animations can read as unsophisticated or dismissive in design traditions that prioritise craft and intentionality. The 6-second float, 12-second blob morph, and generous 600ms reveal durations all reflect this consideration.

---

## 5. Accessibility

- All animations respect `prefers-reduced-motion: reduce`. When this media query is active, every animation and transition duration is collapsed to `0.01ms` (effectively instant), and all `.reveal` elements are forced to `opacity: 1; transform: none` so content is never hidden.
- The cursor glow overlay has `aria-hidden="true"` and `pointer-events: none` — invisible to screen readers and non-blocking to interaction.
- The mobile menu Escape key handler (`animations.js §8`) returns focus to the hamburger button on close.

---

## 6. Integration Notes

To activate the animation system, add the following to each HTML page's `<head>`:

```html
<link rel="stylesheet" href="css/animations.css">
```

And before the closing `</body>` tag (after `main.js`):

```html
<script src="js/animations.js" defer></script>
```

The `defer` attribute ensures the script runs after the DOM is parsed, matching the `DOMContentLoaded` wrapper already used in `main.js`. Loading `animations.js` after `main.js` is safe — the two scripts are independent and do not share state, though both handle `.nav-scrolled` / `.scrolled` class toggling in a compatible way (both set the same class name, so no conflict).

### Class naming convention for new HTML
- Scroll-reveal: add `class="reveal"` (or `reveal--left`, `reveal--right`, `reveal--scale`) to any element that should animate in.
- Staggered groups: add `class="reveal-children"` to the parent container; each direct child will be staggered automatically.
- 3D tilt: add `class="card-3d"` to the outer container; optionally add `class="card-3d__inner"` to the inner element that receives the transform.
- Counter: add `data-count="2500"` (and optionally `data-prefix`, `data-suffix`, `data-duration`) to any number element.
- CTA pulse: `.btn--yellow` receives the pulse animation automatically; disable with `animation: none` override if needed on a per-instance basis.
