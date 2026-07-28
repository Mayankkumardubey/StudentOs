"use client";

import { useEffect, useRef } from "react";

interface AnimatedBackgroundProps {
  particleCount?: number;
}

/* ── Perlin noise (flow field) ────────────────────────────────── */
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

export default function AnimatedBackground({
  particleCount = 180,
}: AnimatedBackgroundProps) {
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    /* ── Particles ──────────────────────────────────────────── */
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      hue: number; // 0 = teal, 1 = coral, 2 = white
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const hueRoll = Math.random();
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.8 + 0.3,
        alpha: Math.random() * 0.35 + 0.05,
        hue: hueRoll < 0.5 ? 0 : hueRoll < 0.8 ? 2 : 1,
      });
    }

    const noiseScale = 0.002;
    const noiseTimeStep = 0.00015;
    let noiseTime = 0;
    const interactionRadius = 140;
    const interactionRadiusSq = interactionRadius * interactionRadius;

    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }
    function onMouseLeave() {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    }
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    /* ── Animation loop ─────────────────────────────────────── */
    function animate() {
      noiseTime += noiseTimeStep;

      // Clear fully each frame — no trail effect, particles sit on the CSS gradient
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Flow-field steering
        const angle =
          noise2D(p.x * noiseScale, p.y * noiseScale + noiseTime) *
          Math.PI *
          2;
        const fx = Math.cos(angle) * 0.3;
        const fy = Math.sin(angle) * 0.3;

        // Mouse interaction — gentle push outward
        const dx = p.x - mx;
        const dy = p.y - my;
        const distSq = dx * dx + dy * dy;
        let rx = 0;
        let ry = 0;
        if (distSq < interactionRadiusSq && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / interactionRadius) * 0.8;
          rx = (dx / dist) * force;
          ry = (dy / dist) * force;
        }

        p.vx = (p.vx + fx + rx) * 0.94;
        p.vy = (p.vy + fy + ry) * 0.94;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;

        // Color: teal, coral, or soft white
        let r: number, g: number, b: number;
        if (p.hue === 0) {
          // Teal: light mode #006a61 / dark mode #57f1db → use mid teal
          r = 0;
          g = 180;
          b = 168;
        } else if (p.hue === 1) {
          // Coral
          r = 251;
          g = 113;
          b = 133;
        } else {
          // Soft white
          r = 220;
          g = 230;
          b = 240;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [particleCount]);

  return (
    <>
      {/* ── CSS gradient base ──────────────────────────────────── */}
      <div className="fixed inset-0 -z-30 bg-background" />

      {/* ── Animated gradient mesh blobs ───────────────────────── */}
      <div className="fixed inset-0 -z-20 overflow-hidden">
        {/* Large teal blob — drifts top-right to bottom-left */}
        <div
          className="absolute -top-1/4 -left-1/4 h-[80vh] w-[80vh] rounded-full opacity-30 dark:opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(0,106,97,0.6) 0%, rgba(0,106,97,0) 70%)",
            animation: "orbDrift1 25s ease-in-out infinite",
          }}
        />
        {/* Coral blob — drifts bottom-right to top-left */}
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full opacity-20 dark:opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(251,113,133,0.5) 0%, rgba(251,113,133,0) 70%)",
            animation: "orbDrift2 30s ease-in-out infinite",
          }}
        />
        {/* Small teal accent — orbits center */}
        <div
          className="absolute top-1/3 right-1/4 h-[40vh] w-[40vh] rounded-full opacity-25 dark:opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(134,242,228,0.4) 0%, rgba(134,242,228,0) 70%)",
            animation: "orbDrift3 20s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Subtle grid texture (production polish) ──────────── */}
      <div
        className="fixed inset-0 -z-15 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Center spotlight — draws eye to card ─────────────── */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 100%)",
        }}
      />

      {/* ── Floating energy spheres ──────────────────────────── */}
      <div className="fixed inset-0 -z-8 pointer-events-none overflow-hidden">
        {/* Sphere 1 — large teal, left */}
        <div className="sphere-container" style={{ left: "12%", top: "18%" }}>
          <div className="sphere sphere-1" />
          <div className="sphere-glow sphere-glow-1" />
        </div>
        {/* Sphere 2 — medium coral, right */}
        <div className="sphere-container" style={{ right: "15%", top: "52%" }}>
          <div className="sphere sphere-2" />
          <div className="sphere-glow sphere-glow-2" />
        </div>
        {/* Sphere 3 — small teal-white, center-left */}
        <div className="sphere-container" style={{ left: "38%", top: "72%" }}>
          <div className="sphere sphere-3" />
          <div className="sphere-glow sphere-glow-3" />
        </div>
        {/* Sphere 4 — tiny coral, top-right */}
        <div className="sphere-container" style={{ right: "25%", top: "15%" }}>
          <div className="sphere sphere-4" />
          <div className="sphere-glow sphere-glow-4" />
        </div>
        {/* Sphere 5 — medium teal, bottom-center */}
        <div className="sphere-container" style={{ left: "55%", top: "82%" }}>
          <div className="sphere sphere-5" />
          <div className="sphere-glow sphere-glow-5" />
        </div>
        {/* Sphere 6 — small white-teal, left-center */}
        <div className="sphere-container" style={{ left: "8%", top: "58%" }}>
          <div className="sphere sphere-6" />
          <div className="sphere-glow sphere-glow-6" />
        </div>
      </div>

      {/* ── Canvas particles ─────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-5"
        aria-hidden="true"
      />

      {/* ── CSS keyframes ────────────────────────────────────── */}
      <style>{`
        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10vw, 15vh) scale(1.1); }
          50% { transform: translate(5vw, 25vh) scale(0.95); }
          75% { transform: translate(-5vw, 10vh) scale(1.05); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-15vw, -10vh) scale(1.15); }
          66% { transform: translate(-8vw, -20vh) scale(0.9); }
        }
        @keyframes orbDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(-10vw, 15vh) scale(1.2) rotate(180deg); }
        }

        /* ── Sphere float + collapse ──────────────────────────── */
        @keyframes sphereFloat1 {
          0%   { transform: translateY(0)      scale(1);    opacity: 0.7; }
          15%  { transform: translateY(-8vh)   scale(1.05); opacity: 0.8; }
          30%  { transform: translateY(-18vh)  scale(0.6);  opacity: 0.5; }
          40%  { transform: translateY(-25vh)  scale(0.08); opacity: 0.3; }
          50%  { transform: translateY(-20vh)  scale(0.6);  opacity: 0.5; }
          70%  { transform: translateY(-5vh)   scale(1.1);  opacity: 0.8; }
          85%  { transform: translateY(5vh)    scale(0.95); opacity: 0.7; }
          100% { transform: translateY(0)      scale(1);    opacity: 0.7; }
        }
        @keyframes sphereFloat2 {
          0%   { transform: translateY(0)      scale(0.9);  opacity: 0.6; }
          20%  { transform: translateY(12vh)   scale(1.1);  opacity: 0.75; }
          35%  { transform: translateY(22vh)   scale(0.5);  opacity: 0.45; }
          45%  { transform: translateY(30vh)   scale(0.06); opacity: 0.25; }
          55%  { transform: translateY(22vh)   scale(0.5);  opacity: 0.45; }
          75%  { transform: translateY(5vh)    scale(1.05); opacity: 0.7; }
          100% { transform: translateY(0)      scale(0.9);  opacity: 0.6; }
        }
        @keyframes sphereFloat3 {
          0%   { transform: translateY(0)      scale(0.8);  opacity: 0.5; }
          25%  { transform: translateY(-15vh)  scale(1.15); opacity: 0.7; }
          40%  { transform: translateY(-22vh)  scale(0.4);  opacity: 0.35; }
          48%  { transform: translateY(-28vh)  scale(0.05); opacity: 0.2; }
          58%  { transform: translateY(-20vh)  scale(0.7);  opacity: 0.5; }
          80%  { transform: translateY(-3vh)   scale(1.0);  opacity: 0.6; }
          100% { transform: translateY(0)      scale(0.8);  opacity: 0.5; }
        }
        @keyframes sphereFloat4 {
          0%   { transform: translateY(0)      scale(0.7);  opacity: 0.55; }
          18%  { transform: translateY(10vh)   scale(1.0);  opacity: 0.7; }
          32%  { transform: translateY(18vh)   scale(0.35); opacity: 0.3; }
          42%  { transform: translateY(24vh)   scale(0.04); opacity: 0.15; }
          55%  { transform: translateY(16vh)   scale(0.6);  opacity: 0.4; }
          78%  { transform: translateY(3vh)    scale(0.9);  opacity: 0.6; }
          100% { transform: translateY(0)      scale(0.7);  opacity: 0.55; }
        }
        @keyframes sphereFloat5 {
          0%   { transform: translateY(0)      scale(1);    opacity: 0.65; }
          12%  { transform: translateY(-6vh)   scale(1.08); opacity: 0.75; }
          28%  { transform: translateY(-16vh)  scale(0.55); opacity: 0.45; }
          38%  { transform: translateY(-22vh)  scale(0.07); opacity: 0.25; }
          50%  { transform: translateY(-15vh)  scale(0.65); opacity: 0.5; }
          72%  { transform: translateY(-4vh)   scale(1.05); opacity: 0.7; }
          88%  { transform: translateY(2vh)    scale(0.92); opacity: 0.65; }
          100% { transform: translateY(0)      scale(1);    opacity: 0.65; }
        }
        @keyframes sphereFloat6 {
          0%   { transform: translateY(0)      scale(0.6);  opacity: 0.45; }
          22%  { transform: translateY(-12vh)  scale(0.95); opacity: 0.6; }
          38%  { transform: translateY(-20vh)  scale(0.3);  opacity: 0.28; }
          46%  { transform: translateY(-26vh)  scale(0.03); opacity: 0.12; }
          58%  { transform: translateY(-18vh)  scale(0.55); opacity: 0.4; }
          80%  { transform: translateY(-2vh)   scale(0.85); opacity: 0.55; }
          100% { transform: translateY(0)      scale(0.6);  opacity: 0.45; }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.6); }
        }

        /* ── Sphere base ──────────────────────────────────────── */
        .sphere-container {
          position: absolute;
          transform: translate(-50%, -50%);
        }
        .sphere {
          border-radius: 50%;
          position: relative;
          z-index: 1;
        }
        .sphere-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          z-index: 0;
          filter: blur(40px);
        }

        /* ── Sphere 1 — teal, large ───────────────────────────── */
        .sphere-1 {
          width: 18px; height: 18px;
          background: radial-gradient(circle at 35% 35%, rgba(134,242,228,0.95), rgba(87,241,219,0.7) 40%, rgba(0,106,97,0.4) 70%, transparent);
          box-shadow: 0 0 12px 2px rgba(87,241,219,0.5), 0 0 30px 6px rgba(87,241,219,0.2), inset 0 -2px 6px rgba(0,0,0,0.2);
          animation: sphereFloat1 12s ease-in-out infinite;
        }
        .sphere-glow-1 {
          width: 60px; height: 60px;
          background: radial-gradient(circle, rgba(87,241,219,0.35), transparent 70%);
          animation: glowPulse 4s ease-in-out infinite, sphereFloat1 12s ease-in-out infinite;
        }

        /* ── Sphere 2 — coral, medium ─────────────────────────── */
        .sphere-2 {
          width: 14px; height: 14px;
          background: radial-gradient(circle at 35% 35%, rgba(255,178,185,0.95), rgba(251,113,133,0.7) 40%, rgba(200,60,80,0.4) 70%, transparent);
          box-shadow: 0 0 10px 2px rgba(251,113,133,0.5), 0 0 24px 5px rgba(251,113,133,0.2), inset 0 -2px 5px rgba(0,0,0,0.2);
          animation: sphereFloat2 15s ease-in-out infinite;
        }
        .sphere-glow-2 {
          width: 50px; height: 50px;
          background: radial-gradient(circle, rgba(251,113,133,0.3), transparent 70%);
          animation: glowPulse 5s ease-in-out infinite 1s, sphereFloat2 15s ease-in-out infinite;
        }

        /* ── Sphere 3 — teal-white, small ─────────────────────── */
        .sphere-3 {
          width: 10px; height: 10px;
          background: radial-gradient(circle at 35% 35%, rgba(220,240,238,0.95), rgba(134,242,228,0.6) 40%, rgba(0,106,97,0.3) 70%, transparent);
          box-shadow: 0 0 8px 1px rgba(134,242,228,0.5), 0 0 18px 4px rgba(134,242,228,0.15), inset 0 -1px 4px rgba(0,0,0,0.15);
          animation: sphereFloat3 9s ease-in-out infinite;
        }
        .sphere-glow-3 {
          width: 36px; height: 36px;
          background: radial-gradient(circle, rgba(134,242,228,0.25), transparent 70%);
          animation: glowPulse 3.5s ease-in-out infinite 0.5s, sphereFloat3 9s ease-in-out infinite;
        }

        /* ── Sphere 4 — coral, tiny ───────────────────────────── */
        .sphere-4 {
          width: 8px; height: 8px;
          background: radial-gradient(circle at 35% 35%, rgba(255,190,196,0.95), rgba(251,113,133,0.6) 40%, rgba(180,50,70,0.3) 70%, transparent);
          box-shadow: 0 0 6px 1px rgba(251,113,133,0.45), 0 0 14px 3px rgba(251,113,133,0.15), inset 0 -1px 3px rgba(0,0,0,0.15);
          animation: sphereFloat4 11s ease-in-out infinite;
        }
        .sphere-glow-4 {
          width: 30px; height: 30px;
          background: radial-gradient(circle, rgba(251,113,133,0.25), transparent 70%);
          animation: glowPulse 4.5s ease-in-out infinite 1.5s, sphereFloat4 11s ease-in-out infinite;
        }

        /* ── Sphere 5 — teal, medium ──────────────────────────── */
        .sphere-5 {
          width: 12px; height: 12px;
          background: radial-gradient(circle at 35% 35%, rgba(134,242,228,0.9), rgba(0,106,97,0.6) 40%, rgba(0,60,55,0.35) 70%, transparent);
          box-shadow: 0 0 9px 2px rgba(87,241,219,0.45), 0 0 22px 4px rgba(87,241,219,0.18), inset 0 -2px 5px rgba(0,0,0,0.2);
          animation: sphereFloat5 14s ease-in-out infinite;
        }
        .sphere-glow-5 {
          width: 44px; height: 44px;
          background: radial-gradient(circle, rgba(87,241,219,0.3), transparent 70%);
          animation: glowPulse 5s ease-in-out infinite 2s, sphereFloat5 14s ease-in-out infinite;
        }

        /* ── Sphere 6 — white-teal, small ─────────────────────── */
        .sphere-6 {
          width: 9px; height: 9px;
          background: radial-gradient(circle at 35% 35%, rgba(230,245,243,0.9), rgba(134,242,228,0.55) 40%, rgba(0,106,97,0.25) 70%, transparent);
          box-shadow: 0 0 7px 1px rgba(134,242,228,0.4), 0 0 16px 3px rgba(134,242,228,0.12), inset 0 -1px 3px rgba(0,0,0,0.12);
          animation: sphereFloat6 10s ease-in-out infinite;
        }
        .sphere-glow-6 {
          width: 32px; height: 32px;
          background: radial-gradient(circle, rgba(134,242,228,0.2), transparent 70%);
          animation: glowPulse 3.8s ease-in-out infinite 0.8s, sphereFloat6 10s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
