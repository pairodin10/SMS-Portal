import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, Megaphone, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
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

type Announcement = {
  id: number;
  title: string;
  body: string;
  status: number;
  createdAt: string;
  createdBy: number;
  modifiedAt: string | null;
  modifiedBy: number | null;
};

type AnnouncementForm = {
  title: string;
  body: string;
  status: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const initialForm: AnnouncementForm = { title: '', body: '', status: '1' };
const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<AnnouncementForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detailAnnouncement, setDetailAnnouncement] = useState<Announcement | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const deleteConfirmation = useDeleteConfirmation();
  const saveAnimation = useSaveAnimation();

  useEffect(() => {
    let active = true;
    api.get<ApiResponse<Announcement[]>>('/announcements')
      .then((response) => {
        if (active) setAnnouncements(response.data.data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiErrorMessage(requestError, 'Unable to load announcements.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return announcements;
    return announcements.filter((announcement) =>
      [String(announcement.id), announcement.title, announcement.body, announcement.status ? 'active' : 'inactive']
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [announcements, search]);
  const sorting = useDataTableSort(filteredAnnouncements, (announcement, key) => {
    switch (key) {
      case 'id': return announcement.id;
      case 'title': return announcement.title;
      case 'body': return announcement.body;
      case 'status': return announcement.status;
      case 'created': return announcement.createdAt;
      default: return '';
    }
  });
  const sortingHeaderProps = {
    activeSortKey: sorting.sortKey,
    direction: sorting.direction,
    onSort: sorting.toggleSort,
  };
  const selection = useDataTableSelection(sorting.sortedItems, (announcement) => String(announcement.id));
  const pagination = useDataTablePagination(sorting.sortedItems);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(false);
  };

  const openAddModal = () => {
    setError('');
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setError('');
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      body: announcement.body,
      status: String(announcement.status),
    });
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      status: Number(form.status),
    };

    try {
      if (editingId === null) {
        const response = await api.post<ApiResponse<Announcement>>('/announcements', payload);
        setAnnouncements((current) => [response.data.data, ...current]);
      } else {
        const response = await api.patch<ApiResponse<Announcement>>(`/announcements/${editingId}`, payload);
        setAnnouncements((current) => current.map((item) => item.id === editingId ? response.data.data : item));
        await saveAnimation.playSaveAnimation();
      }
      resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save announcement.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    if (!await deleteConfirmation.confirmDelete(`Delete announcement "${announcement.title}"?`)) return;
    setError('');
    try {
      await api.delete(`/announcements/${announcement.id}`);
      setAnnouncements((current) => current.filter((item) => item.id !== announcement.id));
      selection.remove([String(announcement.id)]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete announcement.'));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selection.selectedIds].map(Number);
    if (!ids.length || !await deleteConfirmation.confirmDelete(`Permanently delete ${ids.length} selected announcements?`)) return;
    setDeletingSelected(true);
    setError('');
    try {
      await api.delete('/announcements/bulk', { data: { ids } });
      setAnnouncements((current) => current.filter((item) => !selection.selectedIds.has(String(item.id))));
      selection.clear();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete selected announcements.'));
    } finally {
      setDeletingSelected(false);
    }
  };

  const activeCount = announcements.filter((announcement) => announcement.status === 1).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Client communications</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">Announcements</h3>
          <p className="mt-1 text-sm text-slate-400">Manage announcement records from the connected database.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BulkDeleteButton count={selection.selectedIds.size} loading={deletingSelected} onClick={() => void handleBulkDelete()} />
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500"
          >
            <Plus size={16} />
            Add announcement
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Announcement records</span>
            <Megaphone size={18} className="text-violet-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{announcements.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Active announcements</span>
            <Megaphone size={18} className="text-emerald-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">{activeCount}</p>
        </div>
      </div>

      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-lg font-semibold text-white">Announcement data table</h4>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 sm:w-80">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Search announcements"
              aria-label="Search announcements"
            />
          </div>
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
                    label="Select all filtered announcements"
                    onChange={selection.toggleFiltered}
                  />
                </th>
                <SortableTableHeader label="ID" sortKey="id" {...sortingHeaderProps} />
                <SortableTableHeader label="Title" sortKey="title" {...sortingHeaderProps} />
                <SortableTableHeader label="Message" sortKey="body" {...sortingHeaderProps} />
                <SortableTableHeader label="Status" sortKey="status" {...sortingHeaderProps} />
                <SortableTableHeader label="Created" sortKey="created" {...sortingHeaderProps} />
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagination.pageItems.map((announcement) => (
                <tr key={announcement.id} className="border-t border-white/10 align-top hover:bg-white/[0.03]">
                  <td className="px-3 py-3">
                    <DataTableCheckbox
                      checked={selection.selectedIds.has(String(announcement.id))}
                      label={`Select ${announcement.title}`}
                      onChange={(checked) => selection.toggle(String(announcement.id), checked)}
                    />
                  </td>
                  <td className="px-3 py-3">{announcement.id}</td>
                  <td className="max-w-[260px] whitespace-pre-wrap px-3 py-3 font-medium text-white">{announcement.title}</td>
                  <td className="max-w-[420px] whitespace-pre-wrap break-words px-3 py-3 text-slate-300">{announcement.body}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${announcement.status === 1 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/20 text-slate-300'}`}>
                      {announcement.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">{formatDate(announcement.createdAt)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailAnnouncement(announcement)}
                        aria-label={`Details for ${announcement.title}`}
                        title="View details"
                        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(announcement)}
                        aria-label={`Edit ${announcement.title}`}
                        title="Edit announcement"
                        className="rounded-lg border border-violet-400/30 bg-violet-400/10 p-2 text-violet-200 transition hover:bg-violet-400/20"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(announcement)}
                        aria-label={`Delete ${announcement.title}`}
                        title="Delete announcement"
                        className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-rose-200 transition hover:bg-rose-400/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading announcements…</td></tr>}
              {!loading && filteredAnnouncements.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No announcements found.</td></tr>}
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
            aria-labelledby="announcement-modal-title"
            className="mx-auto my-4 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-2xl shadow-black/50 sm:my-8 sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h4 id="announcement-modal-title" className="text-lg font-semibold text-white">
                  {editingId === null ? 'Add announcement' : `Edit announcement #${editingId}`}
                </h4>
                <p className="mt-1 text-xs text-slate-400">Announcement content is saved to the connected database.</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close dialog"
                className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-white disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Title</span>
                <input required maxLength={500} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Message</span>
                <textarea required rows={8} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className={`${inputClass} resize-y`} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Status</span>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={inputClass}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </label>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/5 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-60">
                  {saving ? 'Saving…' : editingId === null ? 'Create announcement' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {detailAnnouncement && (
        <DataTableDetailsModal
          title={`Announcement details: ${detailAnnouncement.title}`}
          onClose={() => setDetailAnnouncement(null)}
          details={[
            { label: 'ID', value: detailAnnouncement.id },
            { label: 'Title', value: detailAnnouncement.title },
            { label: 'Message', value: <span className="whitespace-pre-wrap">{detailAnnouncement.body}</span> },
            { label: 'Status', value: detailAnnouncement.status === 1 ? 'Active' : 'Inactive' },
            { label: 'Created', value: formatDate(detailAnnouncement.createdAt) },
            { label: 'Created by', value: detailAnnouncement.createdBy },
            { label: 'Modified', value: formatDate(detailAnnouncement.modifiedAt) },
            { label: 'Modified by', value: detailAnnouncement.modifiedBy ?? '—' },
          ]}
        />
      )}
      {deleteConfirmation.dialog}
      {saveAnimation.overlay}
    </div>
  );
}
