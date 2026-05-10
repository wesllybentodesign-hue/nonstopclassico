/**
 * MouseTrail — Rastro de partículas digitais que segue o cursor
 * Composto por caracteres, cruzes, quadrados e fragmentos
 * Reage à velocidade do mouse: rápido = mais partículas + glitch
 * Partículas são atraídas para o centro quando o mouse se aproxima
 */

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  char: string;
  opacity: number;
  scale: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  fontSize: number;
}

const CHARS = [
  "╋", "◻", "◇", "⊞", "⊡", "▪", "▫", "⬡", "⊕", "⊗",
  "░", "▒", "┃", "━", "╳", "⬢", "◈", "▣", "⊟", "⊠",
  "+", "×", "·", "■", "□", "▸", "◂",
];

const COLORS_BASE = [
  "rgba(255,255,255,0.5)",
  "rgba(255,255,255,0.35)",
  "rgba(200,200,210,0.4)",
  "rgba(160,160,170,0.3)",
];

const COLORS_ACCENT = [
  "rgba(139,20,20,0.5)",
  "rgba(180,30,30,0.4)",
  "rgba(0,160,220,0.25)",
];

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isActivated: boolean;
}

export default function MouseTrail({ containerRef, isActivated }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -100, y: -100, speed: 0 });
  const animFrameRef = useRef<number>(0);

  const spawnParticle = useCallback((x: number, y: number, speed: number) => {
    const count = Math.min(Math.floor(speed / 6) + 1, 5);
    for (let i = 0; i < count; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const useAccent = Math.random() > 0.75;
      const colorPool = useAccent ? COLORS_ACCENT : COLORS_BASE;
      const color = colorPool[Math.floor(Math.random() * colorPool.length)];
      const spread = Math.min(speed * 0.4, 25);
      const life = 35 + Math.random() * 35;

      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        char,
        opacity: 0.5 + Math.random() * 0.5,
        scale: 0.4 + Math.random() * 0.6 + (speed > 25 ? 0.3 : 0),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life,
        maxLife: life,
        color,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        fontSize: 8 + Math.random() * 4,
      });
    }

    if (particlesRef.current.length > 150) {
      particlesRef.current = particlesRef.current.slice(-100);
    }
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

    const handleMouseMove = (e: MouseEvent) => {
      const prev = mouseRef.current;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        speed,
      };

      if (speed > 2) {
        spawnParticle(e.clientX, e.clientY, speed);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Center of screen for attraction
    const centerX = () => window.innerWidth / 2;
    const centerY = () => window.innerHeight / 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = centerX();
      const cy = centerY();
      const mouse = mouseRef.current;

      // Check if mouse is near center (symbol area)
      const distToCenter = Math.sqrt(
        (mouse.x - cx) ** 2 + (mouse.y - cy) ** 2
      );
      const nearCenter = distToCenter < 200;

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= 1;
        if (p.life <= 0) return false;

        // Attraction to center when mouse is near
        if (nearCenter) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 20) {
            const force = 0.15 / (dist * 0.01 + 1);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.rotation += p.rotationSpeed;

        const progress = p.life / p.maxLife;
        const alpha = progress * p.opacity;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        const s = p.scale * (0.3 + progress * 0.7);
        ctx.scale(s, s);
        ctx.font = `${p.fontSize}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        // Glitch effect for fast movement
        if (mouse.speed > 35 && Math.random() > 0.6) {
          ctx.fillText(
            p.char,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
          );
          ctx.globalAlpha = alpha * 0.3;
        }
        ctx.fillText(p.char, 0, 0);
        ctx.restore();

        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [spawnParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[4] pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
