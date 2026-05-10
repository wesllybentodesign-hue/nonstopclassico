/**
 * RegistrationForm — Formulário de pré-inscrição futurista
 * Campos: Primeiro Nome, Nickname mais usado, Role
 * Salva inscritos no localStorage para o ticker da Home
 */

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Props {
  onClose: () => void;
}

export interface Registrant {
  firstName: string;
  nickname: string;
  role: string;
  timestamp: number;
}

const ROLES = ["Carry", "Mid", "Offlane", "Suporte", "Hard Support"];

export const STORAGE_KEY = "nonstop_registrants";

export function getRegistrants(): Registrant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegistrant(r: Registrant) {
  const list = getRegistrants();
  list.push(r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function RegistrationForm({ onClose }: Props) {
  const [firstName, setFirstName] = useState("");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && nickname.trim() && role) {
      saveRegistrant({
        firstName: firstName.trim(),
        nickname: nickname.trim(),
        role,
        timestamp: Date.now(),
      });
      setSubmitted(true);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[50] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ cursor: "default" }}
    >
      <motion.div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="relative z-10 w-full max-w-[360px]"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="border border-white/[0.06] bg-[#050505]/95 p-6 md:p-7 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-900/40" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-900/40" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-900/40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-900/40" />
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-red-900/20 to-transparent" />
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-red-900/10 to-transparent" />

          {!submitted ? (
            <>
              <div className="mb-6">
                <p
                  className="text-[8px] tracking-[0.25em] text-red-900/50 uppercase mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // SISTEMA DE PRÉ-INSCRIÇÃO
                </p>
                <h2
                  className="text-[15px] tracking-[0.25em] text-white/80 uppercase font-bold"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  RESERVAR VAGA
                </h2>
                <p
                  className="text-[8px] tracking-[0.08em] text-white/20 mt-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Preencha os dados para garantir seu assento.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Primeiro Nome */}
                <div>
                  <label
                    className="block text-[7px] tracking-[0.2em] text-white/25 uppercase mb-2"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Primeiro Nome
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-[12px] text-white/80 placeholder-white/15 focus:outline-none focus:border-red-900/40 transition-colors duration-300"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    placeholder="Seu primeiro nome"
                    required
                    autoFocus
                  />
                </div>

                {/* Nickname */}
                <div>
                  <label
                    className="block text-[7px] tracking-[0.2em] text-white/25 uppercase mb-2"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Nickname mais usado
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-[12px] text-white/80 placeholder-white/15 focus:outline-none focus:border-red-900/40 transition-colors duration-300"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    placeholder="Ex: ShadowStrike"
                    required
                  />
                </div>

                {/* Role */}
                <div>
                  <label
                    className="block text-[7px] tracking-[0.2em] text-white/25 uppercase mb-2"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-red-900/40 transition-colors duration-300 appearance-none"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      required
                    >
                      <option value="" disabled className="bg-[#0a0a0a] text-white/30">
                        Selecione sua role
                      </option>
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-[#0a0a0a] text-white/80">
                          {r}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                        <path d="M0.5 0.5L4 4L7.5 0.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                      </svg>
                    </div>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full mt-2 py-3 border border-red-900/30 bg-red-950/15 text-[11px] tracking-[0.35em] text-white/60 uppercase font-semibold transition-all duration-300 hover:bg-red-900/25 hover:text-white/85 hover:border-red-800/50"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  RESERVAR VAGA
                </motion.button>
              </form>

              <p
                className="text-center text-[7px] tracking-[0.12em] text-white/10 mt-5 uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [ESC] ou clique fora para fechar
              </p>
            </>
          ) : (
            <motion.div
              className="text-center py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-10 h-10 mx-auto mb-5 border border-red-800/40 rotate-45 flex items-center justify-center"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 45 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <div className="w-2.5 h-2.5 bg-red-800/50" />
              </motion.div>
              <h3
                className="text-[14px] tracking-[0.35em] text-white/80 uppercase font-bold mb-3"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                VAGA RESERVADA
              </h3>
              <p
                className="text-[13px] tracking-[0.05em] text-red-500/70 leading-relaxed mb-0.5"
                style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}
              >
                {nickname}
              </p>
              <p
                className="text-[8px] tracking-[0.08em] text-white/25 leading-relaxed"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                confirmou sua pré-inscrição.
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <p
                  className="text-[7px] tracking-[0.1em] text-white/12"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  STATUS: PENDENTE // JULHO 2026
                </p>
              </div>
              <motion.button
                onClick={onClose}
                className="mt-5 px-6 py-2 border border-white/[0.06] text-[9px] tracking-[0.2em] text-white/30 uppercase hover:text-white/50 hover:border-white/10 transition-all duration-300"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                FECHAR
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
