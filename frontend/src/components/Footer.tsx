export const Footer = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white/35 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/35 sm:px-6">
      <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-slate-200/80 bg-white/65 p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900/55">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 dark:text-blue-300">Fraud Score Logic</p>

        <div className="mt-3 grid gap-4 text-sm text-slate-700 dark:text-slate-300 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700/70 dark:bg-slate-900/70">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Rule Engine</p>
            <ul className="mt-2 space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
              <li>Velocity & Threshold checks</li>
              <li>Location & Geo-velocity</li>
              <li>Device/IP Churn detection</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700/70 dark:bg-slate-900/70">
            <p className="font-semibold text-slate-900 dark:text-slate-100">ML Ensemble</p>
            <ul className="mt-2 space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
              <li>XGBoost anomaly scoring</li>
              <li>Isolation Forest profiling</li>
              <li>PyTorch Autoencoder (v2.5)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700/70 dark:bg-slate-900/70">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Behavioral Bias</p>
            <ul className="mt-2 space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
              <li>Historical footprint deviation</li>
              <li>Context-aware fingerprinting</li>
              <li>User entropy comparison</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700/70 dark:bg-slate-900/70">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Graph Forensics</p>
            <ul className="mt-2 space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
              <li>Collusion ring analysis</li>
              <li>User-Device edge linkage</li>
              <li>Entity relationship bias</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-xs text-slate-700 dark:text-slate-300 lg:grid-cols-2">
          <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 font-mono">
            Final Risk Score = Σ ( Layer_i * Weight_i )
          </p>
          <p className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60 font-mono">
            0-30 Low Risk | 31-70 Medium Risk | 71-100 High Risk
          </p>
        </div>
      </div>
    </footer>
  );
};
