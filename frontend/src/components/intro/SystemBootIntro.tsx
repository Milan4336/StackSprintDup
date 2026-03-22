import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useEffect, useState } from 'react';

interface SystemBootIntroProps {
  onComplete: () => void;
}

const BOOT_MESSAGES = [
  'Connecting to transaction stream...',
  'Initializing fraud detection engine...',
  'Loading ML risk model...',
  'Connecting to realtime monitoring...',
  'Verifying system integrity...',
  'Fraud command center ready'
] as const;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

// Generate deterministic orbit positions for rings
const RINGS = [
  { size: 320, duration: 18, delay: 0, opacity: 0.18, borderWidth: 1.5, color: '59,130,246' },
  { size: 480, duration: 26, delay: -6, opacity: 0.13, borderWidth: 1, color: '16,185,129' },
  { size: 640, duration: 34, delay: -12, opacity: 0.10, borderWidth: 1, color: '139,92,246' },
  { size: 780, duration: 42, delay: -20, opacity: 0.08, borderWidth: 0.5, color: '59,130,246' },
  { size: 920, duration: 52, delay: -8, opacity: 0.06, borderWidth: 0.5, color: '16,185,129' },
];

const DOTS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  ringIdx: i % RINGS.length,
  angle: (i * 360) / 14,
  size: i % 3 === 0 ? 6 : 4,
  color: i % 2 === 0 ? '56,189,248' : '52,211,153',
  glow: i % 3 === 0,
  pulseDuration: 1.8 + (i % 4) * 0.4,
}));

const GRID_LINES = 8;

export const SystemBootIntro = ({ onComplete }: SystemBootIntroProps) => {
  const hasCompletedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const messageStartMs = 460;
    const messageStepMs = 360;
    const progressDurationMs = 2800;
    const readyAtMs = 3000;
    const totalDurationMs = 3450;
    const startedAt = performance.now();

    let rafId = 0;
    const frame = (now: number) => {
      const elapsed = now - startedAt;
      setProgress(clamp((elapsed / progressDurationMs) * 100, 0, 100));

      const count =
        elapsed < messageStartMs
          ? 0
          : Math.min(BOOT_MESSAGES.length, Math.floor((elapsed - messageStartMs) / messageStepMs) + 1);
      setVisibleMessageCount(count);

      if (elapsed >= readyAtMs) setIsReady(true);

      if (elapsed >= totalDurationMs) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete();
        }
        return;
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  const visibleMessages = useMemo(() => BOOT_MESSAGES.slice(0, visibleMessageCount), [visibleMessageCount]);

  return (
    <motion.div
      className="fixed inset-0 z-[140] overflow-hidden bg-[#020617]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Forever-running animated background ────────────────────────── */}

      {/* Slow deep gradient sweeps */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(59,130,246,0.18) 0%, transparent 55%),' +
              'radial-gradient(ellipse 70% 55% at 80% 15%, rgba(16,185,129,0.13) 0%, transparent 50%),' +
              'radial-gradient(ellipse 90% 40% at 50% 95%, rgba(139,92,246,0.12) 0%, transparent 55%)',
            animation: 'boot-sweep 12s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage:
          `linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px),` +
          `linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        animation: 'boot-grid-drift 20s linear infinite',
      }} />

      {/* Central orb */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 0, height: 0 }}>

        {/* Orbiting rings */}
        {RINGS.map((ring, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: ring.size,
              height: ring.size,
              left: -ring.size / 2,
              top: -ring.size / 2,
              border: `${ring.borderWidth}px solid rgba(${ring.color},${ring.opacity})`,
              animation: `boot-ring-spin ${ring.duration}s linear ${ring.delay}s infinite`,
              boxShadow: `0 0 24px rgba(${ring.color},${ring.opacity * 0.5})`,
            }}
          >
            {/* Highlight arc effect */}
            <div className="absolute inset-0 rounded-full" style={{
              background: `conic-gradient(from 0deg, rgba(${ring.color},${ring.opacity * 1.5}) 0deg, transparent 60deg, transparent 360deg)`,
            }} />
          </div>
        ))}

        {/* Orbiting dots on rings */}
        {DOTS.map((dot) => {
          const ring = RINGS[dot.ringIdx];
          return (
            <div
              key={dot.id}
              className="absolute rounded-full"
              style={{
                width: dot.size,
                height: dot.size,
                left: -dot.size / 2,
                top: -ring.size / 2,
                background: `rgba(${dot.color},0.9)`,
                boxShadow: dot.glow ? `0 0 12px 3px rgba(${dot.color},0.6)` : 'none',
                transformOrigin: `${dot.size / 2}px ${ring.size / 2}px`,
                transform: `rotate(${dot.angle}deg)`,
                animation: `boot-ring-spin ${ring.duration}s linear ${ring.delay}s infinite, boot-dot-pulse ${dot.pulseDuration}s ease-in-out infinite alternate`,
              }}
            />
          );
        })}

        {/* Core glowing orb */}
        <div
          className="absolute rounded-full"
          style={{
            width: 80, height: 80,
            left: -40, top: -40,
            background: 'radial-gradient(circle, rgba(56,189,248,0.9) 0%, rgba(59,130,246,0.6) 40%, transparent 70%)',
            boxShadow: '0 0 40px 10px rgba(56,189,248,0.5), 0 0 80px 20px rgba(59,130,246,0.25)',
            animation: 'boot-core-pulse 3s ease-in-out infinite',
          }}
        />
        {/* Inner sharp core */}
        <div
          className="absolute rounded-full"
          style={{
            width: 20, height: 20,
            left: -10, top: -10,
            background: 'radial-gradient(circle, #fff 0%, rgba(56,189,248,0.8) 60%, transparent 100%)',
          }}
        />

        {/* Scan line sweeping across */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            width: RINGS[RINGS.length - 1].size,
            height: RINGS[RINGS.length - 1].size,
            left: -RINGS[RINGS.length - 1].size / 2,
            top: -RINGS[RINGS.length - 1].size / 2,
            animation: `boot-ring-spin 8s linear infinite`,
          }}
        >
          <div
            className="absolute"
            style={{
              top: 0,
              left: '50%',
              height: '50%',
              width: '50%',
              background: 'conic-gradient(from 0deg, rgba(56,189,248,0.22) 0deg, transparent 55deg)',
              transformOrigin: '0 100%',
            }}
          />
        </div>
      </div>

      {/* Floating data packets — horizontal scan lines */}
      {Array.from({ length: GRID_LINES }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0"
          style={{
            top: `${10 + i * 10.5}%`,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.25), rgba(56,189,248,0.06), transparent)',
            animation: `boot-scanline ${4 + i * 0.7}s ease-in-out ${i * 0.45}s infinite alternate`,
          }}
        />
      ))}

      {/* ── UI overlay ─────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-blue-200/90"
        >
          Initializing Platform
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="boot-glow text-4xl font-black tracking-tight text-slate-50 sm:text-5xl"
        >
          FRAUD COMMAND CENTER
        </motion.h1>

        <div className="glass-panel mt-8 max-w-3xl rounded-2xl border border-blue-400/25 bg-slate-950/55 p-5 backdrop-blur-sm">
          <div className="space-y-2 font-mono text-sm text-blue-100/90">
            <AnimatePresence>
              {visibleMessages.map((line) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-cyan-300">{'>'}</span>
                  <span>{line}</span>
                </motion.p>
              ))}
            </AnimatePresence>

            {!isReady ? (
              <p className="flex items-center gap-2 text-blue-200/70">
                <span className="text-cyan-300">{'>'}</span>
                <span className="boot-cursor">_</span>
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/95">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear', duration: 0.12 }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-300/80">
              <span>System Bootstrap</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          <AnimatePresence>
            {isReady ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200"
              >
                SYSTEM READY
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Keyframe injection ──────────────────────────────────────────── */}
      <style>{`
        @keyframes boot-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes boot-core-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.9; }
          50%       { transform: scale(1.18); opacity: 1;   }
        }
        @keyframes boot-dot-pulse {
          from { opacity: 0.6; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.5); }
        }
        @keyframes boot-sweep {
          0%   { opacity: 0.85; transform: scale(1) rotate(0deg);   }
          50%  { opacity: 1;    transform: scale(1.04) rotate(2deg); }
          100% { opacity: 0.85; transform: scale(1) rotate(-2deg);  }
        }
        @keyframes boot-grid-drift {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
        @keyframes boot-scanline {
          from { opacity: 0;    transform: scaleX(0.4); }
          to   { opacity: 0.9;  transform: scaleX(1);   }
        }
      `}</style>
    </motion.div>
  );
};
