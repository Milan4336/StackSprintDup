import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Info,
  Radio,
  ShieldAlert,
  TriangleAlert
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityEventType,
  ActivityFeedFilter,
  ActivityFeedItem,
  useActivityFeedStore
} from '../../store/activityFeedStore';
import { formatSafeDate } from '../../utils/date';

const filterOptions: Array<{ label: string; value: ActivityFeedFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Transactions', value: 'transaction' },
  { label: 'Alerts', value: 'alert' },
  { label: 'Cases', value: 'case' },
  { label: 'Simulation', value: 'simulation' },
  { label: 'ML', value: 'ml' },
  { label: 'System', value: 'system' }
];

// Dual-mode severity tones — readable in both light and dark
const toneBySeverity = {
  info: 'text-sky-700 border-sky-400/40 bg-sky-50/90 dark:text-sky-300 dark:border-sky-500/30 dark:bg-sky-500/10',
  warning: 'text-amber-700 border-amber-400/40 bg-amber-50/90 dark:text-amber-300 dark:border-amber-500/30 dark:bg-amber-500/10',
  critical: 'text-red-700 border-red-400/40 bg-red-50/90 dark:text-red-300 dark:border-red-500/30 dark:bg-red-500/10'
} as const;

const timestampClass = 'text-[10px] text-slate-500 dark:text-slate-400';
const messageClass = 'text-xs leading-relaxed text-slate-700 dark:text-slate-100';

const iconFor = (entry: ActivityFeedItem) => {
  if (entry.severity === 'critical') return ShieldAlert;
  if (entry.severity === 'warning') return TriangleAlert;
  if (entry.type === 'transaction') return Bell;
  if (entry.type === 'simulation') return Radio;
  if (entry.type === 'system') return Info;
  return CircleDot;
};

const isTypeMatch = (itemType: ActivityEventType, filter: ActivityFeedFilter): boolean =>
  filter === 'all' ? true : itemType === filter;

export const LiveActivityFeed = () => {
  const isOpen = useActivityFeedStore((state) => state.isOpen);
  const toggleOpen = useActivityFeedStore((state) => state.toggleOpen);
  const paused = useActivityFeedStore((state) => state.paused);
  const setPaused = useActivityFeedStore((state) => state.setPaused);
  const filter = useActivityFeedStore((state) => state.filter);
  const setFilter = useActivityFeedStore((state) => state.setFilter);
  const clear = useActivityFeedStore((state) => state.clear);
  const items = useActivityFeedStore((state) => state.items);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const filteredItems = useMemo(
    () => items.filter((item) => isTypeMatch(item.type, filter)),
    [filter, items]
  );

  useEffect(() => {
    if (paused) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [filteredItems, paused]);

  if (!isOpen) {
    return (
      <motion.button
        type="button"
        onClick={toggleOpen}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-lg backdrop-blur transition hover:border-blue-400/60 hover:bg-white dark:border-slate-600/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-blue-400/60"
      >
        <Radio size={14} className="text-blue-500 dark:text-blue-400" />
        Live Feed
        <ChevronUp size={14} />
      </motion.button>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-4 right-4 z-40 w-[23rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 shadow-2xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/90"
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-3 py-2.5 dark:border-slate-700/70 dark:bg-slate-900/60">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live Activity Feed
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            className="rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-blue-400/50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-blue-300"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={toggleOpen}
            className="rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
          >
            <ChevronDown size={13} />
          </button>
        </div>
      </header>

      {/* ── Filter Row ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-2 dark:border-slate-800">
        <select
          className="h-8 rounded-lg border border-slate-200/80 bg-white/85 px-2 py-0 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring dark:border-slate-700/80 dark:bg-slate-950/65 dark:text-slate-200"
          value={filter}
          onChange={(event) => setFilter(event.target.value as ActivityFeedFilter)}
        >
          {filterOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-red-400/50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-red-300"
        >
          Clear
        </button>
      </div>

      {/* ── Feed Items ───────────────────────────────────────── */}
      <div ref={scrollRef} className="max-h-[24rem] space-y-2 overflow-y-auto px-3 py-2">
        <AnimatePresence initial={false}>
          {filteredItems.map((entry) => {
            const Icon = iconFor(entry);
            return (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18 }}
                className={`rounded-xl border px-2.5 py-2 ${toneBySeverity[entry.severity]}`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    <Icon size={12} />
                    {entry.type}
                  </p>
                  <span className={timestampClass}>{formatSafeDate(entry.timestamp)}</span>
                </div>
                <p className={messageClass}>{entry.message}</p>
              </motion.article>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
            No activity events for the selected filter.
          </div>
        ) : null}
      </div>
    </motion.section>
  );
};
