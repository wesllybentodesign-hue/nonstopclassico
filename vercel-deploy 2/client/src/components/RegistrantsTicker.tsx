/**
 * RegistrantsTicker — Faixa animada com nicknames dos inscritos
 * Passa horizontalmente na tela em loop contínuo
 */

import { useState, useEffect, useRef } from "react";
import { getRegistrants, STORAGE_KEY, type Registrant } from "./RegistrationForm";

export default function RegistrantsTicker() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to storage changes
  useEffect(() => {
    setRegistrants(getRegistrants());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setRegistrants(getRegistrants());
      }
    };

    // Also poll for same-tab updates (localStorage events don't fire in same tab)
    const interval = setInterval(() => {
      setRegistrants(getRegistrants());
    }, 2000);

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  if (registrants.length === 0) return null;

  // Build ticker items — duplicate for seamless loop
  const items = [...registrants, ...registrants];

  const separator = (
    <span className="mx-6 text-red-900/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      //
    </span>
  );

  return (
    <div
      className="absolute left-0 right-0 z-[9] overflow-hidden pointer-events-none"
      style={{ bottom: "52px" }}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #000 0%, transparent 100%)" }}
      />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #000 0%, transparent 100%)" }}
      />

      {/* Ticker track */}
      <div
        ref={tickerRef}
        className="flex items-center whitespace-nowrap"
        style={{
          animation: `ticker-scroll ${Math.max(18, registrants.length * 5)}s linear infinite`,
        }}
      >
        {items.map((r, i) => (
          <span key={i} className="inline-flex items-center">
            <span
              className="text-[8px] md:text-[9px] tracking-[0.15em] uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="text-red-500/60">{r.nickname}</span>
              <span className="text-white/15">, confirmou sua pré-inscrição</span>
            </span>
            {separator}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
