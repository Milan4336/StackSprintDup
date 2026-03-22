export const LoadingState = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10">
    <p className="text-sm font-medium text-slate-600">{label}</p>
  </div>
);
