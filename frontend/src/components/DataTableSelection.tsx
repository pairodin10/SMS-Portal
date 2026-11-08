import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, FileText, Minus, PenLine, Trash2 } from 'lucide-react';

type DataTableCheckboxProps = {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function DataTableCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
}: DataTableCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <span className="relative inline-flex h-4 w-4 shrink-0 align-middle">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        aria-checked={indeterminate ? 'mixed' : checked}
        className={`peer h-4 w-4 cursor-pointer appearance-none rounded-[4px] border bg-slate-950/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked || indeterminate
            ? 'border-violet-400 bg-violet-500'
            : 'border-slate-500 hover:border-violet-300'
        }`}
      />
      {indeterminate ? (
        <Minus size={12} aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 text-white" />
      ) : checked ? (
        <Check size={12} aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 text-white" />
      ) : null}
    </span>
  );
}

export function useDeleteConfirmation(): { confirmDelete: (message: string) => Promise<boolean>; dialog: ReactNode } {
  const [message, setMessage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = (confirmed: boolean) => {
    if (animationTimer.current) {
      clearTimeout(animationTimer.current);
      animationTimer.current = null;
    }
    const resolve = resolver.current;
    resolver.current = null;
    setIsAnimating(false);
    setMessage(null);
    resolve?.(confirmed);
  };

  useEffect(() => () => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
    resolver.current?.(false);
  }, []);

  const confirmDelete = (confirmationMessage: string) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setMessage(confirmationMessage);
  });

  const startDeleteAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    animationTimer.current = setTimeout(() => finish(true), 850);
  };

  return {
    confirmDelete,
    dialog: message !== null ? (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (!isAnimating && event.target === event.currentTarget) finish(false);
        }}
      >
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-confirmation-title"
          aria-describedby="delete-confirmation-message"
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-2xl shadow-black/60 sm:p-6"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-500/10 text-rose-300">
              <AlertTriangle size={21} />
            </span>
            <div className="min-w-0">
              <h2 id="delete-confirmation-title" className="text-lg font-semibold text-white">Confirm deletion</h2>
              <p id="delete-confirmation-message" className="mt-2 break-words text-sm leading-6 text-slate-300">{message}</p>
              <p className="mt-2 text-xs text-rose-300">This action cannot be undone.</p>
            </div>
          </div>
          {isAnimating && (
            <div className="mt-5 flex flex-col items-center rounded-xl border border-rose-400/15 bg-slate-950/35 py-3" role="status" aria-live="polite">
              <div className="relative flex h-14 w-16 items-end justify-center text-rose-300">
                <FileText size={19} className="absolute left-5 top-0 z-10 animate-trash-drop text-violet-200" />
                <Trash2 size={30} className="relative z-0" />
              </div>
              <span className="mt-1 text-xs font-medium text-slate-300">Moving to trash…</span>
            </div>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => finish(false)}
              disabled={isAnimating}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              autoFocus
              onClick={startDeleteAnimation}
              disabled={isAnimating}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 disabled:cursor-wait disabled:opacity-70"
            >
              <Trash2 size={15} />
              {isAnimating ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </section>
      </div>
    ) : null,
  };
}

export function useSaveAnimation(): { playSaveAnimation: () => Promise<void>; overlay: ReactNode } {
  const [isVisible, setIsVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveAnimation = useRef<(() => void) | null>(null);

  const playSaveAnimation = () => new Promise<void>((resolve) => {
    if (timer.current) clearTimeout(timer.current);
    resolveAnimation.current = resolve;
    setIsVisible(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      resolveAnimation.current = null;
      setIsVisible(false);
      resolve();
    }, 1000);
  });

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    resolveAnimation.current?.();
  }, []);

  return {
    playSaveAnimation,
    overlay: isVisible ? (
      <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="status" aria-live="polite">
        <section className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#111a33] p-6 text-center shadow-2xl shadow-black/60">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
            <FileText size={42} strokeWidth={1.4} />
            <span className="absolute inset-x-5 top-6 flex flex-col gap-1.5" aria-hidden="true">
              <span className="h-0.5 w-full rounded bg-cyan-300/70" />
              <span className="h-0.5 w-3/4 rounded bg-violet-200/50" />
              <span className="h-0.5 w-4/5 rounded bg-violet-200/50" />
            </span>
            <PenLine size={20} className="absolute right-2 top-1 animate-document-rewrite text-cyan-200" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">Rewriting document…</h2>
          <p className="mt-1 text-sm text-slate-400">Saving your changes</p>
          <div className="mt-4 flex justify-center">
            <CheckCircle2 size={18} className="animate-save-confirm text-emerald-300" aria-label="Changes saved" />
          </div>
        </section>
      </div>
    ) : null,
  };
}

type BulkDeleteButtonProps = {
  count: number;
  loading?: boolean;
  onClick: () => void;
};

export function BulkDeleteButton({ count, loading = false, onClick }: BulkDeleteButtonProps) {
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={16} />
      {loading ? 'Deleting…' : `Delete selected (${count})`}
    </button>
  );
}

export function useDataTableSelection<T>(items: T[], getId: (item: T) => string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const filteredIds = useMemo(() => items.map(getId), [items, getId]);
  const selectedFilteredCount = filteredIds.filter((id) => selectedIds.has(id)).length;

  const toggle = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleFiltered = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      filteredIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };

  const remove = (ids: Iterable<string>) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
  };

  return {
    selectedIds,
    filteredIds,
    selectedFilteredCount,
    allFilteredSelected: filteredIds.length > 0 && selectedFilteredCount === filteredIds.length,
    toggle,
    toggleFiltered,
    remove,
    clear: () => setSelectedIds(new Set()),
  };
}
