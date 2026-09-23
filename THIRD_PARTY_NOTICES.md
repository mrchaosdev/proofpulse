# Third-party notices

## ChaosUI

ChaosUI is the product owner's own component library. No file from it is
imported wholesale into this repository; each pattern below is re-authored
against ProofPulse tokens, which decisions D-078 through D-083 record.

- Glass Navbar — the floating, blurred panel with a lit top edge and an active
  pill, re-authored as `src/app/layout.tsx` with
  `src/components/navigation/` and the command bar rules in
  `src/styles/layout.css`
- Aurora — its layered radial light fields, re-authored as the canvas rules in
  `src/styles/layout.css`, scroll-linked instead of self-animating (D-081)
- TopographicLines — its fragment shader is carried close to verbatim in
  `src/components/effects/TopographicBackground.tsx` (contour-line noise
  field, pointer ripple), with ProofPulse tokens supplied as uniforms in place
  of the component's own hardcoded palette, and the lifecycle it runs in
  (resize, visibility pausing, reduced motion, pointer damping) rebuilt rather
  than imported. Runs on [`ogl`](https://github.com/oframe/ogl)
  (Unlicense — public domain), the same minimal WebGL library ChaosUI itself
  depends on for this component. D-083 records why this one is a live WebGL
  layer rather than a CSS approximation, and what keeps it inside
  DESIGN-RULES 11's motion limits.

## React Bits Spotlight Card

ProofPulse includes a local adaptation of the pointer-tracking interaction from
the React Bits Spotlight Card:

- Project: [React Bits](https://github.com/DavidHDev/react-bits)
- Source component:
  [`SpotlightCard.tsx`](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Components/SpotlightCard/SpotlightCard.tsx)
- Adaptation: `src/components/effects/SpotlightCard.tsx` and
  `src/styles/components/spotlight.css`

The adaptation replaces the original presentation and API with ProofPulse
design tokens, semantic data attributes, touch handling, idle-state cleanup and
the repository's strict class-name rules.

### License

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, and distribute the Software **as part of an
application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

#### Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as
you do not sell, sublicense, or redistribute the components themselves-whether
alone, in a bundle, or as a ported version.**

#### No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE USE OR OTHER DEALINGS IN THE SOFTWARE.
