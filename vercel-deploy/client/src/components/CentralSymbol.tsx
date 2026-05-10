/**
 * CentralSymbol — Artefato misterioso central com mecânica hold-to-charge
 * 
 * Estados: idle → hover (energia sutil) → holding (carregamento progressivo) → exploded (revelação)
 * Efeitos: brilho vermelho, rachaduras luminosas, partículas orbitais, anel de progresso, explosão
 */

import { useEffect, useRef, useCallback } from "react";

interface Props {
  phase: "idle" | "hover" | "charging" | "exploded";
  chargeProgress: number; // 0 to 1
  onExplosionComplete?: () => void;
}

const SYMBOL_NORMAL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028932804/7WrbVrvwDLeEBvNpzxHUmt/dota-symbol-central-PywdDKgCJ8amYUKAivg6BE.webp";
const SYMBOL_GLOW = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028932804/7WrbVrvwDLeEBvNpzxHUmt/dota-symbol-glow-XXzrDGmyJH2RqgjU59aNko.webp";

interface OrbitalParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  opacity: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
  type: "spark" | "ember" | "ring";
}

export default function CentralSymbol({ phase, chargeProgress, onExplosionComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbitalsRef = useRef<OrbitalParticle[]>([]);
  const explosionRef = useRef<ExplosionParticle[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const explosionTriggeredRef = useRef(false);
  const imgNormalRef = useRef<HTMLImageElement | null>(null);
  const imgGlowRef = useRef<HTMLImageElement | null>(null);
  const explosionCallbackFiredRef = useRef(false);
  const explosionStartTimeRef = useRef(0);

  // Preload images
  useEffect(() => {
    const imgN = new Image();
    imgN.crossOrigin = "anonymous";
    imgN.src = SYMBOL_NORMAL;
    imgNormalRef.current = imgN;

    const imgG = new Image();
    imgG.crossOrigin = "anonymous";
    imgG.src = SYMBOL_GLOW;
    imgGlowRef.current = imgG;
  }, []);

  // Reset explosion state when phase changes away from exploded
  useEffect(() => {
    if (phase !== "exploded") {
      explosionTriggeredRef.current = false;
      explosionCallbackFiredRef.current = false;
      explosionRef.current = [];
    }
  }, [phase]);

  // Initialize orbital particles
  useEffect(() => {
    const orbitals: OrbitalParticle[] = [];
    for (let i = 0; i < 24; i++) {
      orbitals.push({
        angle: (Math.PI * 2 * i) / 24 + Math.random() * 0.3,
        radius: 100 + Math.random() * 60,
        speed: 0.005 + Math.random() * 0.01,
        size: 1 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.5,
        trail: [],
      });
    }
    orbitalsRef.current = orbitals;
  }, []);

  const spawnExplosion = useCallback((cx: number, cy: number) => {
    const particles: ExplosionParticle[] = [];
    // Sparks — fast, small, bright
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 14;
      const life = 30 + Math.random() * 50;
      particles.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 3,
        opacity: 0.8 + Math.random() * 0.2,
        life,
        maxLife: life,
        color: Math.random() > 0.4
          ? `rgba(${180 + Math.random() * 75}, ${10 + Math.random() * 30}, ${10 + Math.random() * 20}, 1)`
          : `rgba(255, ${180 + Math.random() * 75}, ${50 + Math.random() * 50}, 1)`,
        type: "spark",
      });
    }
    // Embers — slower, larger, glowing
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      const life = 60 + Math.random() * 80;
      particles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 3 + Math.random() * 5,
        opacity: 0.6 + Math.random() * 0.3,
        life,
        maxLife: life,
        color: `rgba(${120 + Math.random() * 60}, ${5 + Math.random() * 15}, ${5 + Math.random() * 10}, 1)`,
        type: "ember",
      });
    }
    // Expanding rings
    for (let i = 0; i < 3; i++) {
      const life = 40 + i * 15;
      particles.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        size: 10 + i * 5,
        opacity: 0.6 - i * 0.15,
        life,
        maxLife: life,
        color: `rgba(180, 20, 20, 1)`,
        type: "ring",
      });
    }
    explosionRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += 1;
      const t = timeRef.current;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      const isCharging = phase === "charging";
      const isHover = phase === "hover";
      const isExploded = phase === "exploded";
      const progress = chargeProgress;

      // ===== SYMBOL IMAGE RENDERING =====
      const symbolSize = Math.min(canvas.width * 0.28, 340);
      const imgN = imgNormalRef.current;
      const imgG = imgGlowRef.current;

      if (!isExploded || (isExploded && t < 10)) {
        // Floating idle animation
        const floatY = Math.sin(t * 0.015) * 10;
        const floatX = Math.sin(t * 0.01) * 3;

        // Tremor during charge
        const tremorX = isCharging ? (Math.random() - 0.5) * progress * 8 : 0;
        const tremorY = isCharging ? (Math.random() - 0.5) * progress * 8 : 0;

        // Scale up during charge
        const chargeScale = isCharging ? 1 + progress * 0.12 : isHover ? 1.03 : 1;

        const drawX = cx + floatX + tremorX - (symbolSize * chargeScale) / 2;
        const drawY = cy + floatY + tremorY - (symbolSize * chargeScale) / 2;
        const drawSize = symbolSize * chargeScale;

        // Deep background glow
        const glowRadius = Math.max(1, symbolSize * (0.6 + progress * 0.8));
        const glowAlpha = isCharging ? 0.15 + progress * 0.5 : isHover ? 0.12 : 0.04;
        if (!isFinite(cx) || !isFinite(cy) || !isFinite(floatY) || !isFinite(glowRadius)) {
          animRef.current = requestAnimationFrame(animate);
          return;
        }
        const grad = ctx.createRadialGradient(cx, cy + floatY, 0, cx, cy + floatY, glowRadius);
        grad.addColorStop(0, `rgba(140, 10, 10, ${glowAlpha})`);
        grad.addColorStop(0.5, `rgba(80, 0, 0, ${glowAlpha * 0.4})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - glowRadius, cy + floatY - glowRadius, glowRadius * 2, glowRadius * 2);

        // Draw normal image
        if (imgN && imgN.complete) {
          ctx.save();
          const normalAlpha = isCharging ? Math.max(0, 1 - progress * 1.5) : 1;
          const brightness = isHover ? 1.2 : isCharging ? 1.1 + progress * 0.4 : 0.85;
          ctx.globalAlpha = normalAlpha;
          ctx.filter = `brightness(${brightness})`;
          ctx.drawImage(imgN, drawX, drawY, drawSize, drawSize);
          ctx.restore();
        }

        // Draw glow image (fades in during charge)
        if (imgG && imgG.complete) {
          ctx.save();
          const glowImgAlpha = isCharging ? Math.min(1, progress * 2) : isHover ? 0.15 : 0;
          const glowBrightness = 1.2 + progress * 0.6;
          ctx.globalAlpha = glowImgAlpha;
          ctx.filter = `brightness(${glowBrightness})`;
          ctx.drawImage(imgG, drawX, drawY, drawSize, drawSize);
          ctx.restore();
        }

        // ===== CRACKS / ENERGY LINES during charge =====
        if (isCharging && progress > 0.15) {
          const crackCount = Math.floor(progress * 12);
          ctx.save();
          for (let i = 0; i < crackCount; i++) {
            const angle = (Math.PI * 2 * i) / crackCount + t * 0.002;
            const len = symbolSize * 0.2 * (0.3 + progress * 0.7);
            const startR = symbolSize * 0.15;
            const sx = cx + Math.cos(angle) * startR + tremorX;
            const sy = cy + floatY + Math.sin(angle) * startR + tremorY;
            const ex = cx + Math.cos(angle) * (startR + len) + tremorX;
            const ey = cy + floatY + Math.sin(angle) * (startR + len) + tremorY;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            // Jagged crack
            const midX = (sx + ex) / 2 + (Math.random() - 0.5) * 10;
            const midY = (sy + ey) / 2 + (Math.random() - 0.5) * 10;
            ctx.lineTo(midX, midY);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = `rgba(200, 30, 30, ${0.3 + progress * 0.5})`;
            ctx.lineWidth = 0.8 + progress * 1.5;
            ctx.shadowColor = "rgba(255, 50, 50, 0.8)";
            ctx.shadowBlur = 8 + progress * 12;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // ===== PROGRESS RING =====
      if (isCharging && progress > 0) {
        const ringRadius = symbolSize * 0.42;
        const floatY = Math.sin(t * 0.015) * 10;

        // Background ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy + floatY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(80, 10, 10, 0.2)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Progress arc
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + progress * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy + floatY, ringRadius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(200, 30, 30, ${0.4 + progress * 0.5})`;
        ctx.lineWidth = 2.5 + progress * 1.5;
        ctx.shadowColor = "rgba(255, 30, 30, 0.6)";
        ctx.shadowBlur = 10 + progress * 15;
        ctx.stroke();

        // Glowing tip at progress end
        const tipX = cx + Math.cos(endAngle) * ringRadius;
        const tipY = cy + floatY + Math.sin(endAngle) * ringRadius;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 3 + progress * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 60, 60, ${0.6 + progress * 0.4})`;
        ctx.shadowColor = "rgba(255, 50, 50, 1)";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
      }

      // ===== ORBITAL PARTICLES =====
      if ((isCharging || isHover) && !isExploded) {
        const orbitals = orbitalsRef.current;
        orbitals.forEach((p) => {
          const speedMult = isCharging ? 1 + progress * 4 : 0.5;
          p.angle += p.speed * speedMult;

          // During charge, particles spiral inward
          const targetRadius = isCharging
            ? Math.max(symbolSize * 0.25, p.radius * (1 - progress * 0.6))
            : p.radius;
          const currentRadius = targetRadius;

          const floatY = Math.sin(t * 0.015) * 10;
          const px = cx + Math.cos(p.angle) * currentRadius;
          const py = cy + floatY + Math.sin(p.angle) * currentRadius;

          // Trail
          p.trail.push({ x: px, y: py, alpha: p.opacity });
          if (p.trail.length > 8) p.trail.shift();

          // Draw trail
          ctx.save();
          p.trail.forEach((tr, idx) => {
            const trailAlpha = (idx / p.trail.length) * 0.3 * (isCharging ? progress : 0.3);
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 30, 30, ${trailAlpha})`;
            ctx.fill();
          });

          // Draw particle
          const particleAlpha = isCharging ? p.opacity * (0.5 + progress * 0.5) : p.opacity * 0.3;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 40, 40, ${particleAlpha})`;
          ctx.shadowColor = "rgba(255, 50, 50, 0.5)";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.restore();
        });
      }

      // ===== EXPLOSION =====
      if (isExploded) {
        if (!explosionTriggeredRef.current) {
          explosionTriggeredRef.current = true;
          explosionStartTimeRef.current = t;
          spawnExplosion(cx, cy);
        }

        // Flash
        const flashElapsed = t - explosionStartTimeRef.current;
        const flashProgress = Math.min(flashElapsed / 20, 1);
        if (flashProgress < 1) {
          ctx.save();
          ctx.globalAlpha = (1 - flashProgress) * 0.6;
          const flashRadius = Math.max(1, canvas.width * 0.5);
          const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashRadius);
          flashGrad.addColorStop(0, "rgba(255, 80, 80, 1)");
          flashGrad.addColorStop(0.3, "rgba(200, 20, 20, 0.5)");
          flashGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = flashGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        // Update and draw explosion particles
        let aliveCount = 0;
        explosionRef.current = explosionRef.current.filter((p) => {
          p.life -= 1;
          if (p.life <= 0) return false;
          aliveCount++;

          const lifeRatio = p.life / p.maxLife;

          if (p.type === "ring") {
            // Expanding ring
            const expansion = (1 - lifeRatio) * 300;
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + expansion, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(180, 20, 20, ${lifeRatio * p.opacity * 0.5})`;
            ctx.lineWidth = 2 + lifeRatio * 3;
            ctx.shadowColor = "rgba(255, 30, 30, 0.4)";
            ctx.shadowBlur = 20;
            ctx.stroke();
            ctx.restore();
          } else {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.vy += 0.02; // gravity

            ctx.save();
            ctx.globalAlpha = lifeRatio * p.opacity;

            if (p.type === "spark") {
              // Motion blur line
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
              ctx.strokeStyle = p.color;
              ctx.lineWidth = p.size * lifeRatio;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 4;
              ctx.stroke();
            } else {
              // Ember glow
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 10;
              ctx.fill();
            }
            ctx.restore();
          }
          return true;
        });

        // Fire callback when explosion is mostly done
        if (aliveCount < 20 && !explosionCallbackFiredRef.current) {
          explosionCallbackFiredRef.current = true;
          onExplosionComplete?.();
        }
      }

      // ===== HOVER SUBTLE PARTICLES =====
      if (isHover && !isCharging && !isExploded) {
        const floatY = Math.sin(t * 0.015) * 10;
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = symbolSize * 0.3 + Math.random() * symbolSize * 0.15;
          const px = cx + Math.cos(angle) * dist;
          const py = cy + floatY + Math.sin(angle) * dist;
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, 0.5 + Math.random() * 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 30, 30, ${0.1 + Math.random() * 0.2})`;
          ctx.fill();
          ctx.restore();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [phase, chargeProgress, spawnExplosion, onExplosionComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[6] pointer-events-none"
    />
  );
}
