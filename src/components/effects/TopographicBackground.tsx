"use client";

/**
 * A live WebGL terrain-line field for the dark canvas, adapted from ChaosUI's
 * TopographicLines (D-079, D-083). Light keeps the plain static fields in
 * `layout.css` — the accent colours this reads (violet, cyan, warm gold) are
 * the dark palette, and the same shader over the warm light ground would fight
 * it rather than sit under it.
 *
 * This is intentionally a real WebGL animation, not a CSS approximation of
 * one: DESIGN-RULES 11's ban on a perpetual loop is amended by D-083 for
 * exactly this decorative layer, on the condition that every stopping rule the
 * ban exists to protect is still enforced in code, not left to discipline:
 *
 * 1. `prefers-reduced-motion` freezes time rather than skipping the effect —
 *    `elapsed` never advances, so the shader keeps painting the same frame.
 *    A canvas that renders nothing until JS runs would be worse for a reduced-
 *    motion reader than one that paints its still frame immediately.
 * 2. The render loop pauses when the tab is hidden and when the canvas
 *    scrolls out of view, through `document.hidden` and IntersectionObserver.
 * 3. Nothing here carries information the interface depends on — it never
 *    gates content, and a reader who never sees WebGL initialise still gets
 *    the CSS canvas underneath.
 */

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const VERTEX = `
precision highp float;
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Contour lines over a drifting height field, coloured by elevation. Ported
 * from ChaosUI's TopographicLines fragment shader; the noise and contour math
 * is unchanged, the pointer-driven ripple is kept, and the palette arrives as
 * uniforms rather than as colours written into the shader.
 */
const FRAGMENT = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;
uniform vec3 uBackground;
uniform float uIntensity;
varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float weight = 0.5;
  mat2 rotate = mat2(0.82, -0.57, 0.57, 0.82);
  for (int i = 0; i < 5; i++) {
    value += noise(p) * weight;
    p = rotate * p * 2.03 + 11.7;
    weight *= 0.5;
  }
  return value;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  vec2 mouse = (uPointer - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.34;
  vec2 drift = vec2(t * 0.08, -t * 0.045);
  float height = fbm(p * 2.25 + drift);
  height += fbm(p * 4.6 - drift * 0.7) * 0.22;
  float pointerDistance = length(p - mouse);
  height += sin(pointerDistance * 22.0 - t * 4.0) * exp(-pointerDistance * 4.0) * 0.035;

  float fineBand = abs(fract(height * 10.0) - 0.5);
  float majorBand = abs(fract(height * 2.5 + 0.08) - 0.5);
  float fine = 1.0 - smoothstep(0.018, 0.06, fineBand);
  float major = 1.0 - smoothstep(0.016, 0.045, majorBand);
  float slope = smoothstep(0.32, 0.78, height);
  float ripple = exp(-pointerDistance * 3.2) * (0.5 + 0.5 * sin(pointerDistance * 28.0 - t * 5.0));

  vec3 terrain = mix(uBackground, uPrimary * 0.25, slope * 0.34 * uIntensity);
  vec3 lineColor = mix(uPrimary, uSecondary, smoothstep(0.28, 0.82, height));
  lineColor = mix(lineColor, uAccent, major * 0.72 + ripple * 0.25);
  vec3 color = terrain + lineColor * (fine * 0.72 + major * 0.72) * uIntensity;
  float vignette = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.72;
  float grain = hash21(gl_FragCoord.xy + floor(uTime * 12.0)) - 0.5;
  color = color * vignette + grain * 0.018;
  gl_FragColor = vec4(color, 1.0);
}
`;

type Rgb = [number, number, number];

function readColorToken(name: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const hex = raw.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const full =
      hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
    const value = Number.parseInt(full, 16);
    return [
      ((value >> 16) & 255) / 255,
      ((value >> 8) & 255) / 255,
      (value & 255) / 255,
    ];
  }
  const rgb = raw.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) {
    return [
      Number(rgb[1] ?? 0) / 255,
      Number(rgb[2] ?? 0) / 255,
      Number(rgb[3] ?? 0) / 255,
    ];
  }
  return fallback;
}

function isEffectivelyDark(): boolean {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export function TopographicBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: Renderer | null = null;
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let visibilityObserver: IntersectionObserver | null = null;

    const start = () => {
      renderer = new Renderer({
        alpha: false,
        dpr: Math.min(devicePixelRatio || 1, 1.6),
      });
      const gl = renderer.gl;
      gl.canvas.className = "topographic-canvas";
      gl.canvas.setAttribute("aria-hidden", "true");
      mount.appendChild(gl.canvas);

      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] as [number, number] },
        uPointer: { value: [0.5, 0.5] as [number, number] },
        uPrimary: { value: readColorToken("--primary", [0.541, 0.247, 0.91]) },
        uSecondary: { value: readColorToken("--cyan", [0.31, 0.769, 0.812]) },
        uAccent: { value: readColorToken("--warning", [0.984, 0.867, 0.455]) },
        uBackground: {
          value: readColorToken("--canvas", [0.059, 0.055, 0.09]),
        },
        uIntensity: { value: 0.55 },
      };

      const program = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms,
        depthTest: false,
        depthWrite: false,
        cullFace: false,
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      let visible = true;
      let elapsed = 0;
      let previous = performance.now();
      const target: [number, number] = [0.5, 0.5];
      const pointer = uniforms.uPointer.value;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const resize = () => {
        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);
        renderer?.setSize(width, height);
        uniforms.uResolution.value = [width, height];
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          visible = entry.isIntersecting;
          previous = performance.now();
        },
        { rootMargin: "120px" },
      );
      visibilityObserver.observe(mount);

      const onPointerMove = (event: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        target[0] = (event.clientX - rect.left) / Math.max(rect.width, 1);
        target[1] = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      const render = (now: number) => {
        frame = requestAnimationFrame(render);
        if (!visible || document.hidden) {
          previous = now;
          return;
        }
        const delta = Math.min((now - previous) / 1000, 0.05);
        previous = now;
        // Reduced motion freezes time rather than skipping rendering, so the
        // canvas still paints its (now unmoving) frame.
        if (!reducedMotion) elapsed += delta;
        pointer[0] += (target[0] - pointer[0]) * 0.055;
        pointer[1] += (target[1] - pointer[1]) * 0.055;
        uniforms.uTime.value = elapsed;
        renderer?.render({ scene: mesh });
      };
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(render);

      return () => {
        window.removeEventListener("pointermove", onPointerMove);
      };
    };

    let stopPointer: (() => void) | undefined;

    function teardown() {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      stopPointer?.();
      stopPointer = undefined;
      if (renderer) {
        renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
        renderer.gl.canvas.remove();
        renderer = null;
      }
    }

    function sync() {
      const shouldRun = isEffectivelyDark();
      const isRunning = renderer !== null;
      if (shouldRun === isRunning) return;
      if (shouldRun) {
        stopPointer = start();
      } else {
        teardown();
      }
    }

    sync();

    const themeObserver = new MutationObserver(sync);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      themeObserver.disconnect();
      teardown();
    };
  }, []);

  return (
    <div className="topographic-mount" ref={mountRef} aria-hidden="true" />
  );
}
