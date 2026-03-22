import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Shield } from 'lucide-react';
import { useThreatStore } from '../../store/threatStore';

export const IncidentBanner = () => {
  const threatLevel = useThreatStore((state) => state.threatLevel);
  const reason = useThreatStore((state) => state.reason);
  const safeMode = useThreatStore((state) => state.safeMode);

  return (
    <div className="flex flex-col w-full z-20 relative">
      <AnimatePresence>
        {safeMode && (
          <motion.div
            key="safemode-banner"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="border-b border-blue-500/40 bg-gradient-to-r from-blue-900/60 via-blue-800/40 to-[#020617] px-4 py-2.5 text-blue-100 backdrop-blur-md"
          >
            <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 text-sm">
              <Shield size={16} className="text-blue-400" />
              <p className="font-bold tracking-wide uppercase text-blue-300">System running in Fraud Protection Mode.</p>
              <p className="hidden text-blue-200/80 lg:block ml-4 border-l border-blue-500/30 pl-4">High-value transactions require manual approval. New payee addition disabled.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {threatLevel === 'CRITICAL' && (
          <motion.div
            key="critical-banner"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="border-b border-red-500/40 bg-gradient-to-r from-red-900/60 via-red-800/40 to-[#020617] px-4 py-2.5 text-red-100 shadow-[0_10px_40px_-20px_rgba(239,68,68,0.75)] backdrop-blur-md"
          >
            <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 text-sm">
              <ShieldAlert size={16} className="text-red-400" />
              <p className="font-bold tracking-wide uppercase text-red-300">Critical Threat Alert — Micro-Isolation Active.</p>
              <p className="hidden text-red-200/80 lg:block ml-4 border-l border-red-500/30 pl-4">{reason}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
