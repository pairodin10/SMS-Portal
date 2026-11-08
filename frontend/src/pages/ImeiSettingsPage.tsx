import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, ScanLine, Trash2, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';
import { DataTableDetailsModal } from '../components/DataTableDetailsModal';
import { DataTablePagination, useDataTablePagination } from '../components/DataTablePagination';
import {
  BulkDeleteButton,
  DataTableCheckbox,
  useDataTableSelection,
  useDeleteConfirmation,
  useSaveAnimation,
} from '../components/DataTableSelection';
import { SortableTableHeader, useDataTableSort } from '../components/DataTableSorting';

type ImeiSetting = {
  id: number;
  name: string;
  service: string;
  serviceValue: number;
  servicePrice: number;
  status: number;
  created: string;
  createdBy: number;
  modified: string | null;
  modifiedBy: number | null;
};

type ImeiSettingsForm = {
  name: string;
  service: string;
  serviceValue: string;
  servicePrice: string;
  status: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const initialForm: ImeiSettingsForm = {
  name: '',
  service: '',
  serviceValue: '0',
  servicePrice: '0.00',
  status: '1',
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50';

export function ImeiSettingsPage() {
  const [settings, setSettings] = useState<ImeiSetting[]>([]);
  const [form, setForm] = useState<ImeiSettingsForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detailSetting, setDetailSetting] = useState<ImeiSetting | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const deleteConfirmation = useDeleteConfirmation();
  const saveAnimation = useSaveAnimation();

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<ImeiSetting[]>>('/imei-settings');
      setSettings(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load IMEI settings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const filteredSettings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return settings;
    return settings.filter((setting) => [
      setting.name,
      setting.service,
      String(setting.id),
      String(setting.serviceValue),
      String(setting.servicePrice),
      setting.status === 1 ? 'active' : 'inactive',
    ].some((value) => value.toLowerCase().includes(query)));
  }, [settings, search]);
  const sorting = useDataTableSort(filteredSettings, (setting, key) => {
    switch (key) {
      case 'id': return setting.id;
      case 'name': return setting.name;
      case 'service': return setting.service;
      case 'serviceValue': return setting.serviceValue;
      case 'price': return setting.servicePrice;
      case 'status': return setting.status;
      default: return '';
    }
  });
  const sortingHeaderProps = {
    activeSortKey: sorting.sortKey,
    direction: sorting.direction,
    onSort: sorting.toggleSort,
  };
  const selection = useDataTableSelection(sorting.sortedItems, (setting) => String(setting.id));
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

  const openEditModal = (setting: ImeiSetting) => {
    setError('');
    setEditingId(setting.id);
    setForm({
      name: setting.name,
      service: setting.service,
      serviceValue: String(setting.serviceValue),
      servicePrice: String(setting.servicePrice),
      status: String(setting.status),
    });
    setModalOpen(true);
  };

  const setField = (field: keyof ImeiSettingsForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      service: form.service.trim(),
      serviceValue: Number(form.serviceValue),
      servicePrice: Number(form.servicePrice),
      status: Number(form.status),
    };

    try {
      if (editingId === null) {
        const response = await api.post<ApiResponse<ImeiSetting>>('/imei-settings', payload);
        setSettings((current) =>
          [...current, response.data.data].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id),
        );
      } else {
        const response = await api.patch<ApiResponse<ImeiSetting>>(`/imei-settings/${editingId}`, payload);
        setSettings((current) =>
          current
            .map((item) => item.id === editingId ? response.data.data : item)
            .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id),
        );
        await saveAnimation.playSaveAnimation();
      }
      resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save IMEI setting.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (setting: ImeiSetting) => {
    if (!await deleteConfirmation.confirmDelete(`Delete IMEI setting "${setting.name}"?`)) return;
    setError('');
    try {
      await api.delete(`/imei-settings/${setting.id}`);
      setSettings((current) => current.filter((item) => item.id !== setting.id));
      selection.remove([String(setting.id)]);
      if (editingId === setting.id) resetForm();
      if (detailSetting?.id === setting.id) setDetailSetting(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete IMEI setting.'));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selection.selectedIds].map(Number);
    if (!ids.length || !await deleteConfirmation.confirmDelete(`Permanently delete ${ids.length} selected IMEI settings?`)) return;
    setDeletingSelected(true);
    setError('');
    try {
      await api.delete('/imei-settings/bulk', { data: { ids } });
      setSettings((current) => current.filter((setting) => !selection.selectedIds.has(String(setting.id))));
      selection.clear();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete selected IMEI settings.'));
    } finally {
      setDeletingSelected(false);
    }
  };

  const activeCount = settings.filter((setting) => setting.status === 1).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-violet-300">Settings</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">IMEI Settings</h3>
          <p className="mt-1 text-sm text-slate-400">Manage services and prices used by the SN/IMEI Checker.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BulkDeleteButton count={selection.selectedIds.size} loading={deletingSelected} onClick={() => void handleBulkDelete()} />
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500"
          >
            <Plus size={16} /> Add IMEI setting
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Active IMEI services</span>
            <ScanLine size={18} className="text-emerald-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Total IMEI services</span>
            <ScanLine size={18} className="text-violet-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{settings.length}</p>
        </div>
      </div>

      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-white">IMEI service records</h4>
            <p className="mt-1 text-sm text-slate-400">Service names, values, prices, and availability.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search IMEI settings"
              aria-label="Search IMEI settings"
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[900px] text-left text-sm text-slate-200">
            <thead className="bg-slate-950/50 text-slate-300">
              <tr>
                <th className="px-3 py-3">
                  <DataTableCheckbox
                    checked={selection.allFilteredSelected}
                    indeterminate={selection.selectedFilteredCount > 0 && !selection.allFilteredSelected}
                    disabled={selection.filteredIds.length === 0}
                    label="Select all filtered IMEI settings"
                    onChange={selection.toggleFiltered}
                  />
                </th>
                <SortableTableHeader label="ID" sortKey="id" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Name" sortKey="name" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Service" sortKey="service" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Service value" sortKey="serviceValue" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Price" sortKey="price" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <SortableTableHeader label="Status" sortKey="status" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagination.pageItems.map((setting) => (
                <tr key={setting.id} className="border-t border-white/10 align-top hover:bg-white/[0.03]">
                  <td className="px-3 py-3">
                    <DataTableCheckbox
                      checked={selection.selectedIds.has(String(setting.id))}
                      label={`Select ${setting.name}`}
                      onChange={(checked) => selection.toggle(String(setting.id), checked)}
                    />
                  </td>
                  <td className="px-3 py-3">{setting.id}</td>
                  <td className="px-3 py-3 font-medium text-white">{setting.name}</td>
                  <td className="px-3 py-3">{setting.service}</td>
                  <td className="px-3 py-3">{setting.serviceValue}</td>
                  <td className="px-3 py-3">{setting.servicePrice.toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 ${setting.status === 1 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/20 text-slate-300'}`}>
                      {setting.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailSetting(setting)}
                        aria-label={`Details for ${setting.name}`}
                        title="View details"
                        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20"
                      >
                        <Eye size={14} />
                      </button>
                      <button type="button" onClick={() => openEditModal(setting)} aria-label={`Edit ${setting.name}`} title="Edit IMEI setting" className="rounded-lg border border-violet-400/30 bg-violet-400/10 p-2 text-violet-200 transition hover:bg-violet-400/20">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => void handleDelete(setting)} aria-label={`Delete ${setting.name}`} title="Delete IMEI setting" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-rose-200 transition hover:bg-rose-400/20">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading IMEI settings…</td></tr>}
              {!loading && filteredSettings.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No IMEI settings found.</td></tr>}
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
          <section role="dialog" aria-modal="true" aria-labelledby="imei-setting-modal-title" className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-2xl shadow-black/50 sm:my-8 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h4 id="imei-setting-modal-title" className="text-lg font-semibold text-white">
                  {editingId === null ? 'Add IMEI setting' : `Edit IMEI setting #${editingId}`}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Active services appear in the SN/IMEI Checker.</p>
              </div>
              <button type="button" onClick={resetForm} disabled={saving} aria-label="Close dialog" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-white disabled:opacity-50">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Name</span>
                <input required maxLength={100} value={form.name} onChange={(event) => setField('name', event.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Service</span>
                <input required maxLength={100} value={form.service} onChange={(event) => setField('service', event.target.value)} className={inputClass} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Service value</span>
                  <input required type="number" min="0" max="2147483647" step="1" value={form.serviceValue} onChange={(event) => setField('serviceValue', event.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Service price</span>
                  <input required type="number" min="0" max="999999999999999999.99" step="0.01" value={form.servicePrice} onChange={(event) => setField('servicePrice', event.target.value)} className={inputClass} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm text-slate-300">Status</span>
                  <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={inputClass}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} disabled={saving} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:opacity-60">
                  {editingId === null && <Plus size={16} />}
                  {saving ? 'Saving…' : editingId === null ? 'Add setting' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {detailSetting && (
        <DataTableDetailsModal
          title={`IMEI setting: ${detailSetting.name}`}
          onClose={() => setDetailSetting(null)}
          details={[
            { label: 'ID', value: detailSetting.id },
            { label: 'Name', value: detailSetting.name },
            { label: 'Service', value: detailSetting.service },
            { label: 'Service value', value: detailSetting.serviceValue },
            { label: 'Service price', value: detailSetting.servicePrice.toFixed(2) },
            { label: 'Status', value: detailSetting.status === 1 ? 'Active' : 'Inactive' },
            { label: 'Created', value: detailSetting.created },
            { label: 'Created by', value: detailSetting.createdBy },
            { label: 'Modified', value: detailSetting.modified },
            { label: 'Modified by', value: detailSetting.modifiedBy },
          ]}
        />
      )}
      {deleteConfirmation.dialog}
      {saveAnimation.overlay}
    </div>
  );
}
