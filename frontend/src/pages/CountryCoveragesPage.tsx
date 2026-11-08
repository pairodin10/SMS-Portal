import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, MapPinned, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';
import { DataTablePagination, useDataTablePagination } from '../components/DataTablePagination';
import { DataTableDetailsModal } from '../components/DataTableDetailsModal';
import { BulkDeleteButton, DataTableCheckbox, useDataTableSelection, useDeleteConfirmation, useSaveAnimation } from '../components/DataTableSelection';
import { SortableTableHeader, useDataTableSort } from '../components/DataTableSorting';

type SettingCoverage = {
  id: number;
  countryName: string | null;
  regionCode: string | null;
  isoCode: string | null;
  countryCode: string | null;
  plainTariff: number;
  voiceTariff: number;
  command: string;
  description: string | null;
  status: number;
  created: string | null;
  modified: string | null;
};

type CoverageForm = {
  countryName: string;
  regionCode: string;
  isoCode: string;
  countryCode: string;
  plainTariff: string;
  voiceTariff: string;
  command: string;
  description: string;
  status: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const initialForm: CoverageForm = {
  countryName: '',
  regionCode: '',
  isoCode: '',
  countryCode: '',
  plainTariff: '1.00',
  voiceTariff: '0.00',
  command: '',
  description: '',
  status: '1',
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50';

export function CountryCoveragesPage() {
  const [coverages, setCoverages] = useState<SettingCoverage[]>([]);
  const [form, setForm] = useState<CoverageForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detailCoverage, setDetailCoverage] = useState<SettingCoverage | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const deleteConfirmation = useDeleteConfirmation();
  const saveAnimation = useSaveAnimation();

  const loadCoverages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<SettingCoverage[]>>('/setting-coverages');
      setCoverages(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load country coverages.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoverages();
  }, []);

  const filteredCoverages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return coverages;
    return coverages.filter((item) =>
      [
        item.countryName,
        item.regionCode,
        item.isoCode,
        item.countryCode,
        item.command,
        item.description,
        String(item.id),
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [coverages, search]);
  const sorting = useDataTableSort(filteredCoverages, (coverage, key) => {
    switch (key) {
      case 'id': return coverage.id;
      case 'country': return coverage.countryName;
      case 'region': return coverage.regionCode;
      case 'iso': return coverage.isoCode;
      case 'countryCode': return coverage.countryCode;
      case 'smsTariff': return coverage.plainTariff;
      case 'voiceTariff': return coverage.voiceTariff;
      case 'command': return coverage.command;
      case 'description': return coverage.description;
      case 'status': return coverage.status;
      default: return '';
    }
  });
  const sortingHeaderProps = {
    activeSortKey: sorting.sortKey,
    direction: sorting.direction,
    onSort: sorting.toggleSort,
  };
  const selection = useDataTableSelection(sorting.sortedItems, (coverage) => String(coverage.id));
  const pagination = useDataTablePagination(sorting.sortedItems);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(false);
  };

  const openAddModal = () => {
    setError('');
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (coverage: SettingCoverage) => {
    setError('');
    setEditingId(coverage.id);
    setForm({
      countryName: coverage.countryName ?? '',
      regionCode: coverage.regionCode ?? '',
      isoCode: coverage.isoCode ?? '',
      countryCode: coverage.countryCode ?? '',
      plainTariff: String(coverage.plainTariff),
      voiceTariff: String(coverage.voiceTariff),
      command: coverage.command,
      description: coverage.description ?? '',
      status: String(coverage.status),
    });
    setModalOpen(true);
  };

  const setField = (field: keyof CoverageForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      countryName: form.countryName.trim(),
      regionCode: form.regionCode.trim() || null,
      isoCode: form.isoCode.trim() || null,
      countryCode: form.countryCode.trim() || null,
      plainTariff: Number(form.plainTariff),
      voiceTariff: Number(form.voiceTariff),
      command: form.command.trim(),
      description: form.description.trim() || null,
      status: Number(form.status),
    };

    try {
      if (editingId === null) {
        const response = await api.post<ApiResponse<SettingCoverage>>('/setting-coverages', payload);
        setCoverages((current) =>
          [...current, response.data.data].sort((a, b) =>
            (a.countryName ?? '').localeCompare(b.countryName ?? '') || a.id - b.id,
          ),
        );
      } else {
        const response = await api.patch<ApiResponse<SettingCoverage>>(
          `/setting-coverages/${editingId}`,
          payload,
        );
        setCoverages((current) =>
          current
            .map((item) => item.id === editingId ? response.data.data : item)
            .sort((a, b) => (a.countryName ?? '').localeCompare(b.countryName ?? '') || a.id - b.id),
        );
        await saveAnimation.playSaveAnimation();
      }
      resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save country coverage.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coverage: SettingCoverage) => {
    if (!await deleteConfirmation.confirmDelete(`Delete ${coverage.countryName ?? 'this coverage'}?`)) return;
    setError('');
    try {
      await api.delete(`/setting-coverages/${coverage.id}`);
      setCoverages((current) => current.filter((item) => item.id !== coverage.id));
      selection.remove([String(coverage.id)]);
      if (editingId === coverage.id) resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete country coverage.'));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selection.selectedIds].map(Number);
    if (!ids.length || !await deleteConfirmation.confirmDelete(`Permanently delete ${ids.length} selected country coverages?`)) return;
    setDeletingSelected(true);
    setError('');
    try {
      await api.delete('/setting-coverages/bulk', { data: { ids } });
      setCoverages((current) => current.filter((coverage) => !selection.selectedIds.has(String(coverage.id))));
      selection.clear();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete selected country coverages.'));
    } finally {
      setDeletingSelected(false);
    }
  };

  const activeCount = coverages.filter((coverage) => coverage.status === 1).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-violet-300">Settings</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">Country Coverages</h3>
          <p className="mt-1 text-sm text-slate-400">Manage the existing setting_coverages table and Quick Send country options.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BulkDeleteButton count={selection.selectedIds.size} loading={deletingSelected} onClick={() => void handleBulkDelete()} />
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500"
          >
            <Plus size={16} />
            Add coverage
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Coverage rows</span>
            <MapPinned size={18} className="text-violet-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{coverages.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Active rows</span>
            <MapPinned size={18} className="text-emerald-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{activeCount}</p>
        </div>
      </div>

      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-lg font-semibold text-white">Coverage data table</h4>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 sm:w-80">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Search countries and codes" aria-label="Search country coverages" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[1250px] text-left text-xs text-slate-200">
            <thead className="bg-slate-950/50 text-slate-300">
              <tr>
                <th className="px-3 py-3">
                  <DataTableCheckbox
                    checked={selection.allFilteredSelected}
                    indeterminate={selection.selectedFilteredCount > 0 && !selection.allFilteredSelected}
                    disabled={selection.filteredIds.length === 0}
                    label="Select all filtered country coverages"
                    onChange={selection.toggleFiltered}
                  />
                </th>
                <SortableTableHeader label="ID" sortKey="id" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Country" sortKey="country" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Region" sortKey="region" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="ISO code" sortKey="iso" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Country code" sortKey="countryCode" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="SMS tariff" sortKey="smsTariff" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Voice tariff" sortKey="voiceTariff" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Command" sortKey="command" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Description" sortKey="description" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Status" sortKey="status" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagination.pageItems.map((coverage) => (
                <tr key={coverage.id} className="border-t border-white/10 align-top hover:bg-white/[0.03]">
                  <td className="px-3 py-3">
                    <DataTableCheckbox
                      checked={selection.selectedIds.has(String(coverage.id))}
                      label={`Select ${coverage.countryName ?? `coverage ${coverage.id}`}`}
                      onChange={(checked) => selection.toggle(String(coverage.id), checked)}
                    />
                  </td>
                  <td className="px-3 py-3">{coverage.id}</td>
                  <td className="px-3 py-3 font-medium text-white">{coverage.countryName || '—'}</td>
                  <td className="px-3 py-3">{coverage.regionCode || '—'}</td>
                  <td className="px-3 py-3">{coverage.isoCode || '—'}</td>
                  <td className="px-3 py-3">{coverage.countryCode || '—'}</td>
                  <td className="px-3 py-3">{coverage.plainTariff.toFixed(2)}</td>
                  <td className="px-3 py-3">{coverage.voiceTariff.toFixed(2)}</td>
                  <td className="px-3 py-3">{coverage.command}</td>
                  <td className="max-w-[240px] whitespace-pre-wrap px-3 py-3">{coverage.description || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 ${coverage.status === 1 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/20 text-slate-300'}`}>
                      {coverage.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailCoverage(coverage)}
                        aria-label={`Details for ${coverage.countryName ?? 'coverage'}`}
                        title="View details"
                        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20"
                      >
                        <Eye size={14} />
                      </button>
                      <button type="button" onClick={() => openEditModal(coverage)} aria-label={`Edit ${coverage.countryName ?? 'coverage'}`} title="Edit coverage" className="rounded-lg border border-violet-400/30 bg-violet-400/10 p-2 text-violet-200 transition hover:bg-violet-400/20">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => void handleDelete(coverage)} aria-label={`Delete ${coverage.countryName ?? 'coverage'}`} title="Delete coverage" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-rose-200 transition hover:bg-rose-400/20">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-400">Loading country coverages…</td></tr>}
              {!loading && filteredCoverages.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-400">No country coverage rows found.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            pageCount={pagination.pageCount}
            start={pagination.start}
            end={pagination.end}
            total={pagination.total}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.changePageSize}
          />
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) resetForm();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="coverage-modal-title" className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-2xl shadow-black/50 sm:my-8 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h4 id="coverage-modal-title" className="text-lg font-semibold text-white">
                  {editingId === null ? 'Add country coverage' : `Edit coverage #${editingId}`}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Only active country names appear in Quick Send.</p>
              </div>
              <button type="button" onClick={resetForm} disabled={saving} aria-label="Close dialog" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-white disabled:opacity-50">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Country name</span>
                  <input required maxLength={30} value={form.countryName} onChange={(event) => setField('countryName', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Country code</span>
                  <input maxLength={5} value={form.countryCode} onChange={(event) => setField('countryCode', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Region code</span>
                  <input maxLength={10} value={form.regionCode} onChange={(event) => setField('regionCode', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">ISO code</span>
                  <input maxLength={20} value={form.isoCode} onChange={(event) => setField('isoCode', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">SMS tariff</span>
                  <input required type="number" min="0" max="999.99" step="0.01" value={form.plainTariff} onChange={(event) => setField('plainTariff', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Voice tariff</span>
                  <input required type="number" min="0" step="0.01" value={form.voiceTariff} onChange={(event) => setField('voiceTariff', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Command</span>
                  <input required maxLength={100} value={form.command} onChange={(event) => setField('command', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Status</span>
                  <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={inputClass}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Description</span>
                <textarea rows={3} value={form.description} onChange={(event) => setField('description', event.target.value)} className={inputClass} />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} disabled={saving} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:opacity-60">
                  {editingId === null && <Plus size={16} />}
                  {saving ? 'Saving…' : editingId === null ? 'Add coverage' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {detailCoverage && (
        <DataTableDetailsModal
          title={`Coverage details: ${detailCoverage.countryName ?? `#${detailCoverage.id}`}`}
          onClose={() => setDetailCoverage(null)}
          details={[
            { label: 'ID', value: detailCoverage.id },
            { label: 'Country name', value: detailCoverage.countryName },
            { label: 'Region code', value: detailCoverage.regionCode },
            { label: 'ISO code', value: detailCoverage.isoCode },
            { label: 'Country code', value: detailCoverage.countryCode },
            { label: 'SMS tariff', value: detailCoverage.plainTariff.toFixed(2) },
            { label: 'Voice tariff', value: detailCoverage.voiceTariff.toFixed(2) },
            { label: 'Command', value: detailCoverage.command },
            { label: 'Description', value: detailCoverage.description },
            { label: 'Status', value: detailCoverage.status === 1 ? 'Active' : 'Inactive' },
            { label: 'Created', value: detailCoverage.created },
            { label: 'Modified', value: detailCoverage.modified },
          ]}
        />
      )}
      {deleteConfirmation.dialog}
      {saveAnimation.overlay}
    </div>
  );
}
