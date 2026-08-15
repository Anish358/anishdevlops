"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient equity-curve motif behind the hero. Deliberately abstract — it is a
 * generated random walk, not data about anything, so it carries the visual
 * language of the product without pretending to be a measurement.
 *
 * Pauses when offscreen or when the tab is hidden, and does not run at all
 * under prefers-reduced-motion (a static curve is drawn instead).
 */
export function TickChart({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const POINTS = 160;

    // Seeded so the silhouette is stable between renders rather than jumping.
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    let series: number[] = [];
    let drift = 0;
    for (let i = 0; i < POINTS; i++) {
      drift += (rand() - 0.46) * 0.9;
      series.push(drift);
    }

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);

      const min = Math.min(...series);
      const max = Math.max(...series);
      const span = max - min || 1;
      const padY = height * 0.18;

      const x = (i: number) => (i / (POINTS - 1)) * width;
      const y = (v: number) =>
        height - padY - ((v - min) / span) * (height - padY * 2);

      // Area fill under the curve.
      const fill = ctx.createLinearGradient(0, 0, 0, height);
      fill.addColorStop(0, "rgba(59,130,246,0.16)");
      fill.addColorStop(1, "rgba(59,130,246,0)");
      ctx.beginPath();
      ctx.moveTo(0, height);
      series.forEach((v, i) => ctx.lineTo(x(i), y(v)));
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // The line itself.
      ctx.beginPath();
      series.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
      ctx.strokeStyle = "rgba(96,165,250,0.85)";
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Leading dot.
      const lastY = y(series[series.length - 1]);
      ctx.beginPath();
      ctx.arc(width - 1, lastY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#60a5fa";
      ctx.fill();
    };

    let raf = 0;
    let last = 0;
    let running = !reduced;

    const tick = (now: number) => {
      // ~7 new ticks a second is enough to read as live without being busy.
      if (now - last > 140) {
        last = now;
        drift += (Math.random() - 0.46) * 0.9;
        series = [...series.slice(1), drift];
        draw();
      }
      if (running) raf = requestAnimationFrame(tick);
    };

    resize();
    draw();

    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && !document.hidden;
      if (visible && !reduced && !raf) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!visible && raf) {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    observer.observe(canvas);

    const onResize = () => {
      resize();
      draw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none h-full w-full ${className}`}
    />
  );
}
