import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, ServerCog, ShieldCheck, Trash2, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';
import { DataTablePagination, useDataTablePagination } from '../components/DataTablePagination';
import { DataTableDetailsModal } from '../components/DataTableDetailsModal';
import { BulkDeleteButton, DataTableCheckbox, useDataTableSelection, useDeleteConfirmation, useSaveAnimation } from '../components/DataTableSelection';
import { SortableTableHeader, useDataTableSort } from '../components/DataTableSorting';

type AllanGateway = {
  id: number;
  name: string;
  apiLink: string;
  sourceParam: string;
  sourceValue: string | null;
  destinationParam: string;
  messageParam: string;
  unicodeParam: string | null;
  unicodeValue: string | null;
  successKeyword: string | null;
  status: number;
  createdBy: number | null;
  modifiedBy: number | null;
  created: string;
  modified: string | null;
  gatewayParams: GatewayParameter[];
};

type GatewayParameter = {
  id: number;
  name: string;
  configured: boolean;
  status: number;
};

type GatewayParameterForm = {
  id?: number;
  name: string;
  value: string;
  configured: boolean;
  valueChanged: boolean;
  status: string;
};

type GatewayForm = {
  name: string;
  apiLink: string;
  sourceParam: string;
  sourceValue: string;
  destinationParam: string;
  messageParam: string;
  unicodeParam: string;
  unicodeValue: string;
  successKeyword: string;
  status: string;
  gatewayParams: GatewayParameterForm[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const initialForm: GatewayForm = {
  name: '',
  apiLink: '',
  sourceParam: '',
  sourceValue: '',
  destinationParam: '',
  messageParam: '',
  unicodeParam: '',
  unicodeValue: '',
  successKeyword: '',
  status: '1',
  gatewayParams: [],
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50';

function nullableValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function SmsServersPage() {
  const [gateways, setGateways] = useState<AllanGateway[]>([]);
  const [form, setForm] = useState<GatewayForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detailGateway, setDetailGateway] = useState<AllanGateway | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const deleteConfirmation = useDeleteConfirmation();
  const saveAnimation = useSaveAnimation();

  const loadGateways = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<AllanGateway[]>>('/sms-servers/allan-gateways');
      setGateways(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load gateways.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGateways();
  }, []);

  const filteredGateways = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return gateways;
    return gateways.filter((gateway) =>
      [
        gateway.name,
        gateway.apiLink,
        gateway.sourceParam,
        gateway.sourceValue,
        gateway.destinationParam,
        gateway.messageParam,
        gateway.unicodeParam,
        gateway.unicodeValue,
        gateway.successKeyword,
        ...(gateway.gatewayParams ?? []).map((parameter) => parameter.name),
        String(gateway.id),
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [gateways, search]);
  const sorting = useDataTableSort(filteredGateways, (gateway, key) => {
    switch (key) {
      case 'id': return gateway.id;
      case 'name': return gateway.name;
      case 'apiLink': return gateway.apiLink;
      case 'source': return `${gateway.sourceParam} ${gateway.sourceValue ?? ''}`;
      case 'destination': return gateway.destinationParam;
      case 'message': return gateway.messageParam;
      case 'unicode': return `${gateway.unicodeParam ?? ''} ${gateway.unicodeValue ?? ''}`;
      case 'successKeyword': return gateway.successKeyword;
      case 'gatewayParams': return (gateway.gatewayParams ?? []).map((parameter) => parameter.name).join(' ');
      case 'status': return gateway.status;
      case 'created': return gateway.created;
      default: return '';
    }
  });
  const sortingHeaderProps = {
    activeSortKey: sorting.sortKey,
    direction: sorting.direction,
    onSort: sorting.toggleSort,
  };
  const selection = useDataTableSelection(sorting.sortedItems, (gateway) => String(gateway.id));
  const pagination = useDataTablePagination(sorting.sortedItems);

  const activeCount = useMemo(
    () => gateways.filter((gateway) => gateway.status === 1).length,
    [gateways],
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(false);
  };

  const handleAdd = () => {
    setError('');
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (gateway: AllanGateway) => {
    setError('');
    setEditingId(gateway.id);
    setModalOpen(true);
    setForm({
      name: gateway.name,
      apiLink: gateway.apiLink,
      sourceParam: gateway.sourceParam,
      sourceValue: gateway.sourceValue ?? '',
      destinationParam: gateway.destinationParam,
      messageParam: gateway.messageParam,
      unicodeParam: gateway.unicodeParam ?? '',
      unicodeValue: gateway.unicodeValue ?? '',
      successKeyword: gateway.successKeyword ?? '',
      status: String(gateway.status),
      gatewayParams: (gateway.gatewayParams ?? []).map((parameter) => ({
        id: parameter.id,
        name: parameter.name,
        value: '',
        configured: parameter.configured,
        valueChanged: false,
        status: String(parameter.status),
      })),
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      apiLink: form.apiLink.trim(),
      sourceParam: form.sourceParam.trim(),
      sourceValue: nullableValue(form.sourceValue),
      destinationParam: form.destinationParam.trim(),
      messageParam: form.messageParam.trim(),
      unicodeParam: nullableValue(form.unicodeParam),
      unicodeValue: nullableValue(form.unicodeValue),
      successKeyword: nullableValue(form.successKeyword),
      status: Number(form.status),
      gatewayParams: form.gatewayParams.map((parameter) => ({
        ...(parameter.id === undefined ? {} : { id: parameter.id }),
        name: parameter.name.trim(),
        ...(parameter.valueChanged || !parameter.configured ? { value: parameter.value } : {}),
        status: Number(parameter.status),
      })),
    };

    try {
      if (editingId === null) {
        const response = await api.post<ApiResponse<AllanGateway>>('/sms-servers/allan-gateways', payload);
        setGateways((current) => [...current, response.data.data].sort((a, b) => b.id - a.id));
      } else {
        const response = await api.patch<ApiResponse<AllanGateway>>(
          `/sms-servers/allan-gateways/${editingId}`,
          payload,
        );
        setGateways((current) =>
          current.map((gateway) => gateway.id === editingId ? response.data.data : gateway),
        );
        await saveAnimation.playSaveAnimation();
      }
      resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save gateway.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gateway: AllanGateway) => {
    if (!await deleteConfirmation.confirmDelete(`Delete gateway "${gateway.name}"?`)) return;
    setError('');
    try {
      await api.delete(`/sms-servers/allan-gateways/${gateway.id}`);
      setGateways((current) => current.filter((item) => item.id !== gateway.id));
      selection.remove([String(gateway.id)]);
      if (editingId === gateway.id) resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete gateway.'));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selection.selectedIds].map(Number);
    if (!ids.length || !await deleteConfirmation.confirmDelete(`Permanently delete ${ids.length} selected gateways?`)) return;
    setDeletingSelected(true);
    setError('');
    try {
      await api.delete('/sms-servers/allan-gateways/bulk', { data: { ids } });
      setGateways((current) => current.filter((gateway) => !selection.selectedIds.has(String(gateway.id))));
      selection.clear();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete selected gateways.'));
    } finally {
      setDeletingSelected(false);
    }
  };

  const setField = (field: keyof GatewayForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setGatewayParam = (index: number, field: keyof GatewayParameterForm, value: string) => {
    setForm((current) => ({
      ...current,
      gatewayParams: current.gatewayParams.map((parameter, parameterIndex) =>
        parameterIndex === index
          ? {
              ...parameter,
              [field]: value,
              ...(field === 'value' ? { valueChanged: true } : {}),
            }
          : parameter,
      ),
    }));
  };

  const addGatewayParam = () => {
    setForm((current) => ({
      ...current,
      gatewayParams: [
        ...current.gatewayParams,
        { name: '', value: '', configured: false, valueChanged: false, status: '1' },
      ],
    }));
  };

  const removeGatewayParam = (index: number) => {
    setForm((current) => ({
      ...current,
      gatewayParams: current.gatewayParams.filter((_, parameterIndex) => parameterIndex !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Provider network</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">SMS Gateways</h3>
          <p className="mt-1 text-sm text-slate-400">Manage the records in the existing allan_gateways table.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BulkDeleteButton count={selection.selectedIds.size} loading={deletingSelected} onClick={() => void handleBulkDelete()} />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus size={16} />
            Add gateway
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Total gateways</span>
            <ServerCog size={18} className="text-cyan-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{gateways.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Active gateways</span>
            <ShieldCheck size={18} className="text-emerald-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{activeCount}</p>
        </div>
      </div>

      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-lg font-semibold text-white">Gateway data table</h4>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 sm:max-w-xs"
              placeholder="Search gateway fields"
              aria-label="Search gateways"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-[1500px] text-left text-xs text-slate-200">
              <thead className="bg-slate-950/50 text-slate-300">
                <tr>
                  <th className="px-3 py-3">
                    <DataTableCheckbox
                      checked={selection.allFilteredSelected}
                      indeterminate={selection.selectedFilteredCount > 0 && !selection.allFilteredSelected}
                      disabled={selection.filteredIds.length === 0}
                      label="Select all filtered gateways"
                      onChange={selection.toggleFiltered}
                    />
                  </th>
                  <SortableTableHeader label="ID" sortKey="id" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Name" sortKey="name" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="API link" sortKey="apiLink" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Source param / value" sortKey="source" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Destination param" sortKey="destination" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Message param" sortKey="message" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Unicode param / value" sortKey="unicode" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Success keyword" sortKey="successKeyword" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Extra parameters" sortKey="gatewayParams" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Status" sortKey="status" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Created" sortKey="created" className="px-3 py-3 font-medium" {...sortingHeaderProps} />
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && pagination.pageItems.map((gateway) => (
                  <tr key={gateway.id} className="border-t border-white/10 align-top hover:bg-white/[0.03]">
                    <td className="px-3 py-3">
                      <DataTableCheckbox
                        checked={selection.selectedIds.has(String(gateway.id))}
                        label={`Select ${gateway.name}`}
                        onChange={(checked) => selection.toggle(String(gateway.id), checked)}
                      />
                    </td>
                    <td className="px-3 py-3">{gateway.id}</td>
                    <td className="px-3 py-3 font-medium text-white">{gateway.name}</td>
                    <td className="max-w-[280px] break-all px-3 py-3 font-mono text-[11px] text-violet-200">{gateway.apiLink}</td>
                    <td className="px-3 py-3">
                      <div>{gateway.sourceParam}</div>
                      <div className="mt-1 text-slate-400">{gateway.sourceValue || '—'}</div>
                    </td>
                    <td className="px-3 py-3">{gateway.destinationParam}</td>
                    <td className="px-3 py-3">{gateway.messageParam}</td>
                    <td className="px-3 py-3">
                      <div>{gateway.unicodeParam || '—'}</div>
                      <div className="mt-1 text-slate-400">{gateway.unicodeValue || '—'}</div>
                    </td>
                    <td className="px-3 py-3">{gateway.successKeyword || '—'}</td>
                    <td className="px-3 py-3">
                      {(gateway.gatewayParams ?? []).length
                        ? (gateway.gatewayParams ?? []).map((parameter) => (
                          <div key={parameter.id}>{parameter.name}: {parameter.configured ? 'Protected' : '—'}</div>
                        ))
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 ${gateway.status === 1 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/20 text-slate-300'}`}>
                        {gateway.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-400">{formatDate(gateway.created)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailGateway(gateway)}
                          aria-label={`Details for ${gateway.name}`}
                          title="View details"
                          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(gateway)}
                          aria-label={`Edit ${gateway.name}`}
                          title="Edit gateway"
                          className="rounded-lg border border-violet-400/30 bg-violet-400/10 p-2 text-violet-200 transition hover:bg-violet-400/20"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(gateway)}
                          aria-label={`Delete ${gateway.name}`}
                          title="Delete gateway"
                          className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-rose-200 transition hover:bg-rose-400/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-400">Loading gateways…</td></tr>}
                {!loading && filteredGateways.length === 0 && (
                  <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                    {gateways.length ? 'No gateways match your search.' : 'No gateways found.'}
                  </td></tr>
                )}
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
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="gateway-modal-title"
            className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-2xl shadow-black/50 sm:my-8 sm:p-7"
          >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h4 id="gateway-modal-title" className="text-lg font-semibold text-white">
                {editingId === null ? 'Add gateway' : `Edit gateway #${editingId}`}
              </h4>
              <p className="mt-1 text-xs text-slate-400">Fields correspond to allan_gateways.</p>
            </div>
            <button type="button" onClick={resetForm} disabled={saving} aria-label="Close dialog" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-white disabled:opacity-50">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={(event) => void handleSave(event)} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">Gateway name</span>
              <input required maxLength={200} value={form.name} onChange={(event) => setField('name', event.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">API link</span>
              <input required maxLength={500} value={form.apiLink} onChange={(event) => setField('apiLink', event.target.value)} className={inputClass} placeholder="https://gateway.example/send" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Source parameter</span>
                <input required maxLength={100} value={form.sourceParam} onChange={(event) => setField('sourceParam', event.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Source value</span>
                <input maxLength={200} value={form.sourceValue} onChange={(event) => setField('sourceValue', event.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Destination parameter</span>
                <input required maxLength={100} value={form.destinationParam} onChange={(event) => setField('destinationParam', event.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Message parameter</span>
                <input required maxLength={100} value={form.messageParam} onChange={(event) => setField('messageParam', event.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Unicode parameter</span>
                <input maxLength={100} value={form.unicodeParam} onChange={(event) => setField('unicodeParam', event.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Unicode value</span>
                <input maxLength={200} value={form.unicodeValue} onChange={(event) => setField('unicodeValue', event.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Success keyword</span>
                <input maxLength={100} value={form.successKeyword} onChange={(event) => setField('successKeyword', event.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Status</span>
                <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={inputClass}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </label>
            </div>
            <section className="space-y-3 rounded-xl border border-white/10 bg-slate-950/25 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-sm font-medium text-white">Additional gateway parameters</h5>
                  <p className="mt-1 text-xs text-slate-400">Stored in sms_gateway_params. Values are hidden.</p>
                </div>
                <button type="button" onClick={addGatewayParam} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20">
                  <Plus size={14} /> Add parameter
                </button>
              </div>
              {form.gatewayParams.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
                  No additional parameters. Use Add parameter to create one.
                </p>
              )}
              {form.gatewayParams.map((parameter, index) => (
                <div key={parameter.id ?? `new-${index}`} className="grid gap-3 rounded-lg border border-white/10 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px_auto]">
                  <label className="block min-w-0">
                    <span className="mb-1.5 block text-xs text-slate-300">Parameter name</span>
                    <input
                      required
                      maxLength={200}
                      value={parameter.name}
                      onChange={(event) => setGatewayParam(index, 'name', event.target.value)}
                      className={inputClass}
                      placeholder="e.g. username"
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1.5 block text-xs text-slate-300">Parameter value</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={parameter.value}
                      onChange={(event) => setGatewayParam(index, 'value', event.target.value)}
                      className={inputClass}
                      placeholder={parameter.configured ? 'Leave blank to keep current value' : 'Enter value'}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-slate-300">Status</span>
                    <select
                      value={parameter.status}
                      onChange={(event) => setGatewayParam(index, 'status', event.target.value)}
                      className={inputClass}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeGatewayParam(index)}
                      aria-label={`Remove parameter ${parameter.name || index + 1}`}
                      title="Remove parameter"
                      className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2.5 text-rose-200 transition hover:bg-rose-400/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </section>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={resetForm} disabled={saving} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60">
                {editingId === null && <Plus size={16} />}
                {saving ? 'Saving…' : editingId === null ? 'Add gateway' : 'Save changes'}
              </button>
            </div>
          </form>
          </section>
        </div>
      )}
      {detailGateway && (
        <DataTableDetailsModal
          title={`Gateway details: ${detailGateway.name}`}
          onClose={() => setDetailGateway(null)}
          details={[
            { label: 'ID', value: detailGateway.id },
            { label: 'Name', value: detailGateway.name },
            { label: 'API link', value: detailGateway.apiLink },
            { label: 'Source parameter', value: detailGateway.sourceParam },
            { label: 'Source value', value: detailGateway.sourceValue },
            { label: 'Destination parameter', value: detailGateway.destinationParam },
            { label: 'Message parameter', value: detailGateway.messageParam },
            { label: 'Unicode parameter', value: detailGateway.unicodeParam },
            { label: 'Unicode value', value: detailGateway.unicodeValue },
            { label: 'Success keyword', value: detailGateway.successKeyword },
            { label: 'Additional parameters', value: (detailGateway.gatewayParams ?? []).map((parameter) => `${parameter.name}: ${parameter.configured ? 'Protected' : 'Not set'} (${parameter.status === 1 ? 'Active' : 'Inactive'})`).join('\n') || '—' },
            { label: 'Status', value: detailGateway.status === 1 ? 'Active' : 'Inactive' },
            { label: 'Created', value: formatDate(detailGateway.created) },
            { label: 'Modified', value: detailGateway.modified ? formatDate(detailGateway.modified) : null },
          ]}
        />
      )}
      {deleteConfirmation.dialog}
      {saveAnimation.overlay}
    </div>
  );
}
