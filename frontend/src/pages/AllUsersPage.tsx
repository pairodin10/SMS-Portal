import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';
import { DataTablePagination, useDataTablePagination } from '../components/DataTablePagination';
import { DataTableDetailsModal } from '../components/DataTableDetailsModal';
import { BulkDeleteButton, DataTableCheckbox, useDataTableSelection, useDeleteConfirmation, useSaveAnimation } from '../components/DataTableSelection';
import { SortableTableHeader, useDataTableSort } from '../components/DataTableSorting';

type UserRecord = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  credits: {
    sms: number;
    whatsapp: number;
    checker: number;
    voice: number;
    email: number;
  };
  chatId: string | null;
  telegramUsername: string | null;
};

type UserForm = {
  fullName: string;
  username: string;
  email: string;
  role: 'viewer' | 'reseller' | 'administrator';
  status: 'active' | 'inactive';
  password: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const initialForm: UserForm = {
  fullName: '',
  username: '',
  email: '',
  role: 'viewer',
  status: 'active',
  password: '',
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatRole(role: string): string {
  if (role === 'viewer') return 'User';
  return role.replaceAll('_', ' ');
}

export function AllUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<UserForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailUser, setDetailUser] = useState<UserRecord | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const deleteConfirmation = useDeleteConfirmation();
  const saveAnimation = useSaveAnimation();

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<ApiResponse<UserRecord[]>>('/users');
        setUsers(response.data.data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load users.'));
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.fullName, user.username, user.email, user.role, user.status, user.id, user.chatId ?? '', user.telegramUsername ?? '']
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, users]);
  const sorting = useDataTableSort(filteredUsers, (user, key) => {
    switch (key) {
      case 'name': return user.fullName;
      case 'username': return user.username;
      case 'email': return user.email;
      case 'sms': return user.credits.sms;
      case 'whatsapp': return user.credits.whatsapp;
      case 'checker': return user.credits.checker;
      case 'voice': return user.credits.voice;
      case 'emailCredits': return user.credits.email;
      case 'chatId': return user.chatId;
      case 'telegram': return user.telegramUsername;
      case 'role': return formatRole(user.role);
      case 'status': return user.status;
      case 'created': return user.createdAt;
      default: return '';
    }
  });
  const sortingHeaderProps = {
    activeSortKey: sorting.sortKey,
    direction: sorting.direction,
    onSort: sorting.toggleSort,
  };
  const selection = useDataTableSelection(sorting.sortedItems, (user) => user.id);
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

  const openEditModal = (user: UserRecord) => {
    setError('');
    setEditingId(user.id);
    setForm({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role === 'administrator' || user.role === 'reseller' ? user.role : 'viewer',
      status: user.status,
      password: '',
    });
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const { password, ...userFields } = form;

    try {
      if (editingId === null) {
        const response = await api.post<ApiResponse<UserRecord>>('/users', form);
        setUsers((current) => [response.data.data, ...current]);
      } else {
        const response = await api.patch<ApiResponse<UserRecord>>(`/users/${editingId}`, {
          ...userFields,
          ...(password ? { password } : {}),
        });
        setUsers((current) => current.map((user) => user.id === editingId ? response.data.data : user));
        await saveAnimation.playSaveAnimation();
      }
      resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save user.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserRecord) => {
    if (!await deleteConfirmation.confirmDelete(`Delete user "${user.username}"?`)) return;
    setError('');
    try {
      await api.delete(`/users/${user.id}`);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      selection.remove([user.id]);
      if (editingId === user.id) resetForm();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete user.'));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selection.selectedIds];
    if (!ids.length || !await deleteConfirmation.confirmDelete(`Permanently delete ${ids.length} selected users?`)) return;
    setDeletingSelected(true);
    setError('');
    try {
      await api.delete('/users/bulk', { data: { ids } });
      setUsers((current) => current.filter((user) => !selection.selectedIds.has(user.id)));
      selection.clear();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete selected users.'));
    } finally {
      setDeletingSelected(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-violet-300">Client directory</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">All Users</h3>
          <p className="mt-1 text-sm text-slate-400">Users registered in the connected database.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BulkDeleteButton count={selection.selectedIds.size} loading={deletingSelected} onClick={() => void handleBulkDelete()} />
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500"
          >
            <Plus size={16} />
            Add user
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-violet-300" />
            <h4 className="text-lg font-semibold text-white">User data</h4>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 sm:w-80">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Search users"
              aria-label="Search users"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[1600px] text-left text-sm text-slate-200">
            <thead className="bg-slate-950/50 text-slate-300">
              <tr>
                <th className="px-3 py-3">
                  <DataTableCheckbox
                    checked={selection.allFilteredSelected}
                    indeterminate={selection.selectedFilteredCount > 0 && !selection.allFilteredSelected}
                    disabled={selection.filteredIds.length === 0}
                    label="Select all filtered users"
                    onChange={selection.toggleFiltered}
                  />
                </th>
                <SortableTableHeader label="Name" sortKey="name" {...sortingHeaderProps} />
                <SortableTableHeader label="Username" sortKey="username" {...sortingHeaderProps} />
                <SortableTableHeader label="Email" sortKey="email" {...sortingHeaderProps} />
                <SortableTableHeader label="SMS credits" sortKey="sms" {...sortingHeaderProps} />
                <SortableTableHeader label="WhatsApp credits" sortKey="whatsapp" {...sortingHeaderProps} />
                <SortableTableHeader label="Checker credits" sortKey="checker" {...sortingHeaderProps} />
                <SortableTableHeader label="Voice credits" sortKey="voice" {...sortingHeaderProps} />
                <SortableTableHeader label="Email credits" sortKey="emailCredits" {...sortingHeaderProps} />
                <SortableTableHeader label="Chat ID" sortKey="chatId" {...sortingHeaderProps} />
                <SortableTableHeader label="Telegram username" sortKey="telegram" {...sortingHeaderProps} />
                <SortableTableHeader label="Role" sortKey="role" {...sortingHeaderProps} />
                <SortableTableHeader label="Status" sortKey="status" {...sortingHeaderProps} />
                <SortableTableHeader label="Created" sortKey="created" {...sortingHeaderProps} />
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagination.pageItems.map((user) => (
                <tr key={user.id} className="border-t border-white/10 align-top hover:bg-white/[0.03]">
                  <td className="px-3 py-3">
                    <DataTableCheckbox
                      checked={selection.selectedIds.has(user.id)}
                      label={`Select ${user.username}`}
                      onChange={(checked) => selection.toggle(user.id, checked)}
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-white">{user.fullName}</td>
                  <td className="px-3 py-3">{user.username}</td>
                  <td className="break-all px-3 py-3">{user.email}</td>
                  <td className="px-3 py-3 tabular-nums">{user.credits.sms.toLocaleString()}</td>
                  <td className="px-3 py-3 tabular-nums">{user.credits.whatsapp.toLocaleString()}</td>
                  <td className="px-3 py-3 tabular-nums">{user.credits.checker.toLocaleString()}</td>
                  <td className="px-3 py-3 tabular-nums">{user.credits.voice.toLocaleString()}</td>
                  <td className="px-3 py-3 tabular-nums">{user.credits.email.toLocaleString()}</td>
                  <td className="px-3 py-3">{user.chatId || '—'}</td>
                  <td className="px-3 py-3">{user.telegramUsername ? `@${user.telegramUsername.replace(/^@/, '')}` : '—'}</td>
                  <td className="px-3 py-3 capitalize">{formatRole(user.role)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${user.status === 'active' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/20 text-slate-300'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-400">{formatDate(user.createdAt)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailUser(user)}
                        aria-label={`Details for ${user.username}`}
                        title="View details"
                        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        aria-label={`Edit ${user.username}`}
                        title="Edit user"
                        className="rounded-lg border border-violet-400/30 bg-violet-400/10 p-2 text-violet-200 transition hover:bg-violet-400/20"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(user)}
                        aria-label={`Delete ${user.username}`}
                        title="Delete user"
                        className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-rose-200 transition hover:bg-rose-400/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={15} className="px-4 py-8 text-center text-slate-400">Loading users…</td></tr>}
              {!loading && filteredUsers.length === 0 && (
                <tr><td colSpan={15} className="px-4 py-8 text-center text-slate-400">No users found.</td></tr>
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
            aria-labelledby="user-modal-title"
            className="mx-auto my-4 w-full max-w-xl rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-2xl shadow-black/50 sm:my-8 sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h4 id="user-modal-title" className="text-lg font-semibold text-white">
                  {editingId === null ? 'Add user' : `Edit ${form.username}`}
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  {editingId === null ? 'Create a user account in the connected database.' : 'Leave password blank to keep it unchanged.'}
                </p>
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
                <span className="mb-1.5 block text-sm text-slate-300">Full name</span>
                <input required maxLength={1000} value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Username</span>
                <input required maxLength={50} pattern="[A-Za-z0-9._\-]+" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Email</span>
                <input required type="email" maxLength={500} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={inputClass} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Role</span>
                  <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserForm['role'] }))} className={inputClass}>
                    <option value="viewer">User</option>
                    <option value="reseller">Reseller</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-300">Status</span>
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as UserForm['status'] }))} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">Password{editingId !== null ? ' (optional)' : ''}</span>
                <input
                  type="password"
                  required={editingId === null}
                  minLength={7}
                  maxLength={100}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className={inputClass}
                />
              </label>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="button" onClick={resetForm} disabled={saving} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:opacity-60">
                  {saving ? 'Saving…' : editingId === null ? 'Add user' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {detailUser && (
        <DataTableDetailsModal
          title={`User details: ${detailUser.username}`}
          onClose={() => setDetailUser(null)}
          details={[
            { label: 'ID', value: detailUser.id },
            { label: 'Full name', value: detailUser.fullName },
            { label: 'Username', value: detailUser.username },
            { label: 'Email', value: detailUser.email },
            { label: 'Role', value: formatRole(detailUser.role) },
            { label: 'Status', value: detailUser.status },
            { label: 'SMS credits', value: detailUser.credits.sms.toLocaleString() },
            { label: 'WhatsApp credits', value: detailUser.credits.whatsapp.toLocaleString() },
            { label: 'Checker credits', value: detailUser.credits.checker.toLocaleString() },
            { label: 'Voice credits', value: detailUser.credits.voice.toLocaleString() },
            { label: 'Email credits', value: detailUser.credits.email.toLocaleString() },
            { label: 'Chat ID', value: detailUser.chatId },
            { label: 'Telegram username', value: detailUser.telegramUsername ? `@${detailUser.telegramUsername.replace(/^@/, '')}` : null },
            { label: 'Created', value: formatDate(detailUser.createdAt) },
          ]}
        />
      )}
      {deleteConfirmation.dialog}
      {saveAnimation.overlay}
    </div>
  );
}
