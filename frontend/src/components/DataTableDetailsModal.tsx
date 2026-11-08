import { ReactNode } from 'react';
import { X } from 'lucide-react';

export type DataTableDetail = {
  label: string;
  value: ReactNode;
};

type DataTableDetailsModalProps = {
  title: string;
  details: DataTableDetail[];
  onClose: () => void;
};

export function DataTableDetailsModal({ title, details, onClose }: DataTableDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-table-details-title"
        className="mx-auto my-4 w-full max-w-xl rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-2xl shadow-black/50 sm:my-8 sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h4 id="data-table-details-title" className="text-lg font-semibold text-white">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <dl className="divide-y divide-white/10">
          {details.map(({ label, value }) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-[minmax(8rem,0.7fr)_minmax(0,1.3fr)] sm:gap-4">
              <dt className="text-sm text-slate-400">{label}</dt>
              <dd className="break-all text-sm text-white">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
