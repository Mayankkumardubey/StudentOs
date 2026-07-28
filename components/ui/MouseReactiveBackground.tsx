"use client";

import { useEffect, useRef } from "react";

interface MouseReactiveBackgroundProps {
  color?: string;
  particleCount?: number;
  speed?: number;
}

const perm = new Uint8Array(512);
(function seedPerm() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
})();

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function noise2D(x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = perm[perm[xi] + yi];
  const ab = perm[perm[xi] + yi + 1];
  const ba = perm[perm[xi + 1] + yi];
  const bb = perm[perm[xi + 1] + yi + 1];
  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}

export default function MouseReactiveBackground({
  color = "#006a61",
  particleCount = 400,
  speed = 1,
}: MouseReactiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function hexToRgb(hex: string) {
      const v = parseInt(hex.replace("#", ""), 16);
      return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
    }
    const rgb = hexToRgb(color);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const noiseScale = 0.003;
    const noiseTimeStep = 0.0003;
    let noiseTime = 0;
    const interactionRadius = 150;
    const interactionRadiusSq = interactionRadius * interactionRadius;
    const repelStrength = 0.6;

    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }
    function onMouseLeave() {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    }
    window.addEventListener("mousemove", onMouseMove);
    canvas!.addEventListener("mouseleave", onMouseLeave);

    const trailAlpha = 0.08;

    function animate() {
      noiseTime += noiseTimeStep * speed;

      ctx!.fillStyle = `rgba(0,0,0,${trailAlpha})`;
      ctx!.fillRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const angle = noise2D(p.x * noiseScale, p.y * noiseScale + noiseTime) * Math.PI * 2;
        const fx = Math.cos(angle) * speed * 0.4;
        const fy = Math.sin(angle) * speed * 0.4;

        const dx = p.x - mx;
        const dy = p.y - my;
        const distSq = dx * dx + dy * dy;
        let rx = 0;
        let ry = 0;
        if (distSq < interactionRadiusSq && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / interactionRadius) * repelStrength;
          rx = (dx / dist) * force;
          ry = (dy / dist) * force;
        }

        p.vx = (p.vx + fx + rx) * 0.92;
        p.vy = (p.vy + fy + ry) * 0.92;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.alpha})`;
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      canvas!.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [color, particleCount, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-20"
      aria-hidden="true"
    />
  );
}
