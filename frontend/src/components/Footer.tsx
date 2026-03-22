export const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/70 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 p-4 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Fraud Score Calculation Logic</p>

        <div className="mt-3 grid gap-4 text-sm text-slate-300 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
            <p className="font-semibold text-slate-100">Fraud Score is calculated using Hybrid Intelligence:</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              <li>Rule Engine (40%)</li>
              <li>High transaction amount</li>
              <li>Rapid repeat transactions</li>
              <li>Suspicious device usage</li>
              <li>Location anomalies</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
            <p className="font-semibold text-slate-100">Machine Learning Model (60%)</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              <li>Isolation Forest anomaly detection</li>
              <li>Behavioral deviation analysis</li>
              <li>Historical user pattern comparison</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-xs text-slate-300 lg:grid-cols-2">
          <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
            Final Risk Score = (ruleScore × 0.4) + (mlProbability × 100 × 0.6)
          </p>
          <p className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
            0-30 Low Risk | 31-70 Medium Risk | 71-100 High Risk
          </p>
        </div>
      </div>
    </footer>
  );
};
