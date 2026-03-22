import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="app-error">
    <p className="flex items-center gap-2 text-sm font-semibold">
      <AlertTriangle size={16} />
      {message}
    </p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
      >
        <RotateCw size={14} />
        Retry
      </button>
    ) : null}
  </div>
);
