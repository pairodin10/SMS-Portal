import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, PhoneCall, Plus, Search, Trash2, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';
import { DataTablePagination, useDataTablePagination } from '../components/DataTablePagination';
import { SortableTableHeader, useDataTableSort } from '../components/DataTableSorting';
import { DataTableDetailsModal } from '../components/DataTableDetailsModal';
import {
  BulkDeleteButton,
  DataTableCheckbox,
  useDataTableSelection,
  useDeleteConfirmation,
  useSaveAnimation,
} from '../components/DataTableSelection';

type VoiceServer = {
  id: number;
  name: string;
  phoneNumber: string;
  status: number;
  created: string;
  createdBy: number;
  modified: string | null;
  modifiedBy: number | null;
};

type VoiceServerForm = {
  name: string;
  sid: string;
  token: string;
  phoneNumber: string;
  status: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const initialForm: VoiceServerForm = {
  name: '',
  sid: '',
  token: '',
  phoneNumber: '',
  status: '1',
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function VoiceServersPage() {
  const [servers, setServers] = useState<VoiceServer[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<VoiceServerForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detailServer, setDetailServer] = useState<VoiceServer | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const deleteConfirmation = useDeleteConfirmation();
  const saveAnimation = useSaveAnimation();

  useEffect(() => {
    let active = true;
    api.get<ApiResponse<VoiceServer[]>>('/voice-servers')
      .then((response) => {
        if (active) setServers(response.data.data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiErrorMessage(requestError, 'Unable to load voice servers.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredServers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return servers;
    return servers.filter((server) =>
      [String(server.id), server.name, server.phoneNumber, server.status ? 'active' : 'inactive']
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [servers, search]);

  const sorting = useDataTableSort(filteredServers, (server, key) => {
    switch (key) {
      case 'id': return server.id;
      case 'name': return server.name;
      case 'phoneNumber': return server.phoneNumber;
      case 'status': return server.status;
      case 'created': return server.created;
      default: return '';
    }
  });
  const sortingHeaderProps = {
    activeSortKey: sorting.sortKey,
    direction: sorting.direction,
    onSort: sorting.toggleSort,
  };
  const selection = useDataTableSelection(sorting.sortedItems, (server) => String(server.id));
  const pagination = useDataTablePagination(sorting.sortedItems);
  const activeCount = servers.filter((server) => server.status === 1).length;

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

  const openEditModal = (server: VoiceServer) => {
    setError('');
    setEditingId(server.id);
    setForm({
      name: server.name,
      sid: '',
      token: '',
      phoneNumber: server.phoneNumber,
      status: String(server.status),
    });
    setModalOpen(true);
  };

  const setField = (field: keyof VoiceServerForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      ...(editingId === null || form.sid.trim() ? { sid: form.sid.trim() } : {}),
      ...(editingId === null || form.token.trim() ? { token: form.token.trim() } : {}),
      phoneNumber: form.phoneNumber.trim(),
      status: Number(form.status),
    };

    try {
      if (editingId === null) {
        const response = await api.post<ApiResponse<VoiceServer>>('/voice-servers', payload);
        setServers((current) => [response.data.data, ...current]);
      } else {
        const response = await api.patch<ApiResponse<VoiceServer>>(`/voice-servers/${editingId}`, payload);
        setServers((current) => current.map((item) => item.id === editingId ? response.data.data : item));
        await saveAnimation.playSaveAnimation();
      }
      resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save voice server.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (server: VoiceServer) => {
    if (!await deleteConfirmation.confirmDelete(`Delete voice server "${server.name}"?`)) return;
    setError('');
    try {
      await api.delete(`/voice-servers/${server.id}`);
      setServers((current) => current.filter((item) => item.id !== server.id));
      selection.remove([String(server.id)]);
      if (detailServer?.id === server.id) setDetailServer(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete voice server.'));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selection.selectedIds].map(Number);
    if (!ids.length || !await deleteConfirmation.confirmDelete(`Permanently delete ${ids.length} selected voice servers?`)) return;
    setDeletingSelected(true);
    setError('');
    try {
      await api.delete('/voice-servers/bulk', { data: { ids } });
      setServers((current) => current.filter((server) => !selection.selectedIds.has(String(server.id))));
      selection.clear();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete selected voice servers.'));
    } finally {
      setDeletingSelected(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Provider network</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">Voice Servers</h3>
          <p className="mt-1 text-sm text-slate-400">Voice API servers from the connected voice_api table.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BulkDeleteButton count={selection.selectedIds.size} loading={deletingSelected} onClick={() => void handleBulkDelete()} />
          <button type="button" onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500">
            <Plus size={16} /> Add voice server
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Voice servers</span>
            <PhoneCall size={18} className="text-violet-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{servers.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Active servers</span>
            <PhoneCall size={18} className="text-emerald-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{activeCount}</p>
        </div>
      </div>

      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-white">Voice server data table</h4>
            <p className="mt-1 text-sm text-slate-400">Credentials are hidden; leave them blank while editing to keep the current values.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search voice servers"
              aria-label="Search voice servers"
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
                    label="Select all filtered voice servers"
                    onChange={selection.toggleFiltered}
                  />
                </th>
                <SortableTableHeader label="ID" sortKey="id" {...sortingHeaderProps} />
                <SortableTableHeader label="Name" sortKey="name" {...sortingHeaderProps} />
                <SortableTableHeader label="Phone number" sortKey="phoneNumber" {...sortingHeaderProps} />
                <SortableTableHeader label="Status" sortKey="status" {...sortingHeaderProps} />
                <SortableTableHeader label="Created" sortKey="created" {...sortingHeaderProps} />
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagination.pageItems.map((server) => (
                <tr key={server.id} className="border-t border-white/10 align-top hover:bg-white/[0.03]">
                  <td className="px-3 py-3">
                    <DataTableCheckbox
                      checked={selection.selectedIds.has(String(server.id))}
                      label={`Select ${server.name}`}
                      onChange={(checked) => selection.toggle(String(server.id), checked)}
                    />
                  </td>
                  <td className="px-3 py-3">{server.id}</td>
                  <td className="px-3 py-3 font-medium text-white">{server.name}</td>
                  <td className="px-3 py-3">{server.phoneNumber}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 ${server.status === 1 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/20 text-slate-300'}`}>
                      {server.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-400">{formatDate(server.created)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setDetailServer(server)} aria-label={`Details for ${server.name}`} title="View details" className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20">
                        <Eye size={14} />
                      </button>
                      <button type="button" onClick={() => openEditModal(server)} aria-label={`Edit ${server.name}`} title="Edit voice server" className="rounded-lg border border-violet-400/30 bg-violet-400/10 p-2 text-violet-200 transition hover:bg-violet-400/20">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => void handleDelete(server)} aria-label={`Delete ${server.name}`} title="Delete voice server" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-rose-200 transition hover:bg-rose-400/20">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading voice servers…</td></tr>}
              {!loading && filteredServers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No voice servers found.</td></tr>}
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
          <section role="dialog" aria-modal="true" aria-labelledby="voice-server-modal-title" className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-2xl shadow-black/50 sm:my-8 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h4 id="voice-server-modal-title" className="text-lg font-semibold text-white">
                  {editingId === null ? 'Add voice server' : `Edit voice server #${editingId}`}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Credentials are write-only and never displayed.</p>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">SID {editingId !== null && '(optional)'}</span>
                  <input required={editingId === null} maxLength={100} autoComplete="new-password" value={form.sid} onChange={(event) => setField('sid', event.target.value)} className={inputClass} placeholder={editingId !== null ? 'Leave blank to keep current SID' : ''} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Token {editingId !== null && '(optional)'}</span>
                  <input required={editingId === null} type="password" maxLength={100} autoComplete="new-password" value={form.token} onChange={(event) => setField('token', event.target.value)} className={inputClass} placeholder={editingId !== null ? 'Leave blank to keep current token' : ''} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Phone number</span>
                <input required maxLength={50} value={form.phoneNumber} onChange={(event) => setField('phoneNumber', event.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Status</span>
                <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={inputClass}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} disabled={saving} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:opacity-60">
                  {editingId === null && <Plus size={16} />}
                  {saving ? 'Saving…' : editingId === null ? 'Add server' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {detailServer && (
        <DataTableDetailsModal
          title={`Voice server: ${detailServer.name}`}
          onClose={() => setDetailServer(null)}
          details={[
            { label: 'ID', value: detailServer.id },
            { label: 'Name', value: detailServer.name },
            { label: 'Phone number', value: detailServer.phoneNumber },
            { label: 'Status', value: detailServer.status === 1 ? 'Active' : 'Inactive' },
            { label: 'Created', value: formatDate(detailServer.created) },
            { label: 'Created by', value: detailServer.createdBy },
            { label: 'Modified', value: detailServer.modified ? formatDate(detailServer.modified) : null },
            { label: 'Modified by', value: detailServer.modifiedBy },
            { label: 'SID', value: 'Protected' },
            { label: 'Token', value: 'Protected' },
          ]}
        />
      )}
      {deleteConfirmation.dialog}
      {saveAnimation.overlay}
    </div>
  );
}
