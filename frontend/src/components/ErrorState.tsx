interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
    <p className="text-sm font-semibold text-red-700">{message}</p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Retry
      </button>
    ) : null}
  </div>
);
