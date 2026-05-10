/**
 * NONSTOP DOTA 2 — Landing Page Interativa
 * Design: "Vault Protocol" — Brutalismo Digital Cinematográfico
 * 
 * Interação: Hold-to-charge no símbolo central
 * Fluxo: idle → hover → hold (charging) → explosion → formulário revelado
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MouseTrail from "@/components/MouseTrail";
import CentralSymbol from "@/components/CentralSymbol";
import RegistrationForm from "@/components/RegistrationForm";
import BackgroundParticles from "@/components/BackgroundParticles";
import RegistrantsTicker from "@/components/RegistrantsTicker";

type Phase = "idle" | "hover" | "charging" | "exploded";

const CHARGE_DURATION = 2800; // ms to fully charge

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [chargeProgress, setChargeProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formRevealed, setFormRevealed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [screenDarken, setScreenDarken] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const chargeStartRef = useRef<number | null>(null);
  const chargeAnimRef = useRef<number>(0);
  const isHoldingRef = useRef(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ESC to close form
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showForm) {
        handleFormClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showForm]);

  // Charge animation loop
  const startCharging = useCallback(() => {
    if (phase === "exploded" || formRevealed) return;
    isHoldingRef.current = true;
    chargeStartRef.current = Date.now();
    setPhase("charging");

    const tick = () => {
      if (!isHoldingRef.current || !chargeStartRef.current) return;
      const elapsed = Date.now() - chargeStartRef.current;
      const progress = Math.min(elapsed / CHARGE_DURATION, 1);
      setChargeProgress(progress);
      setScreenDarken(progress * 0.4);

      if (progress >= 1) {
        // Fully charged — explode!
        setPhase("exploded");
        setScreenDarken(0.6);
        isHoldingRef.current = false;
        return;
      }
      chargeAnimRef.current = requestAnimationFrame(tick);
    };
    chargeAnimRef.current = requestAnimationFrame(tick);
  }, [phase, formRevealed]);

  const stopCharging = useCallback(() => {
    isHoldingRef.current = false;
    cancelAnimationFrame(chargeAnimRef.current);
    if (phase === "charging") {
      // Released early — reset
      setPhase("hover");
      setChargeProgress(0);
      setScreenDarken(0);
    }
  }, [phase]);

  const handleExplosionComplete = useCallback(() => {
    setFormRevealed(true);
    setScreenDarken(0);
    setTimeout(() => {
      setShowForm(true);
    }, 400);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setFormRevealed(false);
    setPhase("idle");
    setChargeProgress(0);
    setScreenDarken(0);
  }, []);

  // Mouse enter/leave symbol area
  const handleSymbolEnter = useCallback(() => {
    if (phase === "idle") setPhase("hover");
  }, [phase]);

  const handleSymbolLeave = useCallback(() => {
    if (phase === "hover") setPhase("idle");
    if (phase === "charging") {
      stopCharging();
    }
  }, [phase, stopCharging]);

  // Mouse down/up on symbol
  const handleSymbolDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (phase === "exploded" && !showForm && formRevealed) {
      setShowForm(true);
      return;
    }
    startCharging();
  }, [phase, showForm, formRevealed, startCharging]);

  const handleSymbolUp = useCallback(() => {
    stopCharging();
  }, [stopCharging]);

  // Mobile: long press
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (phase === "idle") setPhase("hover");
    setTimeout(() => startCharging(), 100);
  }, [phase, startCharging]);

  const handleTouchEnd = useCallback(() => {
    stopCharging();
    if (phase === "hover") setPhase("idle");
  }, [phase, stopCharging]);

  // Symbol area size — bigger and more prominent
  const symbolAreaSize = isMobile ? 280 : 380;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-black select-none"
      style={{ cursor: isMobile ? "default" : "none" }}
      onMouseUp={handleSymbolUp}
      onTouchEnd={handleTouchEnd}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-[1]"
        style={{
          backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310419663028932804/7WrbVrvwDLeEBvNpzxHUmt/noise-texture-dark-jveaRsXDKhk5EFVKTa9bTt.webp')`,
          backgroundSize: "cover",
        }}
      />

      {/* Vignette — intensifies during charge */}
      <div
        className="absolute inset-0 pointer-events-none z-[2] transition-all duration-300"
        style={{
          background: `radial-gradient(ellipse at center, transparent ${30 - chargeProgress * 15}%, rgba(0,0,0,${0.85 + chargeProgress * 0.1}) 100%)`,
        }}
      />

      {/* Screen darken overlay during charge */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none z-[3]"
        animate={{ opacity: screenDarken }}
        transition={{ duration: 0.3 }}
      />

      {/* Background particles */}
      <BackgroundParticles />

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none z-[3] opacity-[0.015]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          }}
        />
      </div>

      {/* Mouse trail — desktop only */}
      {!isMobile && <MouseTrail containerRef={containerRef} isActivated={phase === "charging" || phase === "exploded"} />}

      {/* ===== TOP CENTER — Event name ===== */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 md:top-8 z-10 text-center"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: phase === "charging" ? 1 - chargeProgress * 0.7 : 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.3 }}
      >
        <h1
          className="text-[10px] md:text-[11px] font-semibold tracking-[0.3em] text-white/70 uppercase"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          NONSTOP CLÁSSICO DOTA 2
        </h1>
        <p
          className="text-[7px] md:text-[9px] tracking-[0.12em] text-white/20 mt-1 uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Pré-inscrição fechada para jogadores selecionados.
        </p>
      </motion.div>

      {/* Bottom center — Event info */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-8 z-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase === "charging" ? 1 - chargeProgress * 0.7 : 1, y: 0 }}
        transition={{ duration: 1.5, delay: 1.5 }}
      >
        <p
          className="text-[8px] md:text-[9px] tracking-[0.12em] text-white/20 uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Evento presencial na lan house BASE GAMING.
        </p>
        <p
          className="text-[7px] md:text-[8px] tracking-[0.12em] text-white/10 mt-0.5 uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Previsto para JULHO.
        </p>
      </motion.div>

      {/* ===== CENTRAL SYMBOL CANVAS (renders image + effects) ===== */}
      <CentralSymbol
        phase={phase}
        chargeProgress={chargeProgress}
        onExplosionComplete={handleExplosionComplete}
      />

      {/* ===== INTERACTIVE HIT AREA (invisible, on top) ===== */}
      <div className="absolute inset-0 flex items-center justify-center z-[8]">
        <div className="flex flex-col items-center">
          {/* Tagline above symbol */}
          <motion.p
            className="text-[9px] md:text-[10px] tracking-[0.25em] text-white/15 uppercase mb-6 md:mb-8"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase === "charging" ? Math.max(0.05, 1 - chargeProgress * 1.5) : phase === "exploded" ? 0 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            8 HORAS, ENERGIA DE LAN HOUSE. SEM PAUSA.
          </motion.p>

          {/* Vagas counter */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-6 md:mb-8"
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase === "charging" ? Math.max(0, 1 - chargeProgress * 2) : phase === "exploded" ? 0 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="text-[8px] md:text-[9px] tracking-[0.15em] text-white/25 uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              07/20 VAGAS RESERVADAS
            </span>
            <div className="w-1 h-1 rounded-full bg-red-800/50 relative">
              <div className="w-1 h-1 rounded-full bg-red-800/50 animate-ping absolute inset-0" />
            </div>
          </motion.div>

          {/* Invisible clickable area over the symbol */}
          <div
            className="relative"
            style={{
              width: symbolAreaSize,
              height: symbolAreaSize,
              cursor: isMobile ? "pointer" : "none",
            }}
            onMouseEnter={!isMobile ? handleSymbolEnter : undefined}
            onMouseLeave={!isMobile ? handleSymbolLeave : undefined}
            onMouseDown={!isMobile ? handleSymbolDown : undefined}
            onTouchStart={isMobile ? handleTouchStart : undefined}
          >
            {/* This div is just the hit area — the symbol is rendered on the canvas */}
          </div>

          {/* Status text below symbol */}
          <AnimatePresence mode="wait">
            {phase === "idle" && !formRevealed && (
              <motion.p
                key="idle-hint"
                className="text-[7px] md:text-[8px] tracking-[0.2em] text-white/12 uppercase mt-8 md:mt-10"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0.2, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {isMobile ? "[ TOQUE E SEGURE O SÍMBOLO ]" : "[ APROXIME O CURSOR DO SÍMBOLO ]"}
              </motion.p>
            )}

            {phase === "hover" && !formRevealed && (
              <motion.p
                key="hover-hint"
                className="text-[8px] md:text-[9px] tracking-[0.3em] text-red-600/50 uppercase mt-8 md:mt-10"
                style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: [0.4, 0.7, 0.4], y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isMobile ? "[ SEGURE PARA DESPERTAR ]" : "[ CLIQUE E SEGURE PARA DESPERTAR ]"}
              </motion.p>
            )}

            {phase === "charging" && (
              <motion.div
                key="charging-status"
                className="mt-8 md:mt-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="text-[9px] md:text-[10px] tracking-[0.35em] uppercase"
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    color: `rgba(200, ${40 + chargeProgress * 20}, ${30 + chargeProgress * 20}, ${0.5 + chargeProgress * 0.4})`,
                  }}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  CANALIZANDO ENERGIA... {Math.floor(chargeProgress * 100)}%
                </motion.p>
                <motion.p
                  className="text-[7px] tracking-[0.15em] text-white/15 uppercase mt-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  MANTENHA PRESSIONADO PARA LIBERAR O ACESSO
                </motion.p>
              </motion.div>
            )}

            {phase === "exploded" && !showForm && (
              <motion.p
                key="exploded-status"
                className="text-[10px] md:text-[11px] tracking-[0.4em] text-red-500/80 uppercase mt-8 md:mt-10 font-bold"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0.8, 1], scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                ACESSO DESBLOQUEADO
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Registrants ticker */}
      <RegistrantsTicker />

      {/* Registration form modal */}
      <AnimatePresence>
        {showForm && (
          <RegistrationForm onClose={handleFormClose} />
        )}
      </AnimatePresence>

      {/* Custom cursor — desktop only */}
      {!isMobile && <CustomCursor phase={phase} />}
    </div>
  );
}

function CustomCursor({ phase }: { phase: Phase }) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
    };
  }, [visible]);

  if (!visible) return null;

  const isCharging = phase === "charging";
  const isHover = phase === "hover";

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Outer ring — grows and glows during charge */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45"
        animate={{
          width: isCharging ? 32 : isHover ? 28 : 24,
          height: isCharging ? 32 : isHover ? 28 : 24,
          borderColor: isCharging
            ? "rgba(200, 40, 40, 0.6)"
            : isHover
            ? "rgba(200, 40, 40, 0.3)"
            : "rgba(255, 255, 255, 0.2)",
          boxShadow: isCharging
            ? "0 0 12px rgba(200, 40, 40, 0.4)"
            : "none",
        }}
        transition={{ duration: 0.3 }}
        style={{ border: "1px solid" }}
      />
      {/* Inner dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{
          width: isCharging ? 4 : 3,
          height: isCharging ? 4 : 3,
          backgroundColor: isCharging
            ? "rgba(200, 50, 50, 0.8)"
            : "rgba(255, 255, 255, 0.5)",
        }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}
