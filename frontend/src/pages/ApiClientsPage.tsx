import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Eye,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import {
  DataTablePagination,
  useDataTablePagination,
} from "../components/DataTablePagination";
import { DataTableDetailsModal } from "../components/DataTableDetailsModal";
import {
  BulkDeleteButton,
  DataTableCheckbox,
  useDataTableSelection,
  useDeleteConfirmation,
} from "../components/DataTableSelection";
import { SortableTableHeader, useDataTableSort } from "../components/DataTableSorting";

type ClientStatus = "active" | "disabled";

type ApiClient = {
  id: number;
  userId: number;
  user: string;
  type: number;
  status: ClientStatus;
  createdAt: string;
  createdBy: number;
  modifiedAt: string | null;
  modifiedBy: number | null;
};

type ClientForm = {
  userId: string;
  user: string;
  type: string;
  status: ClientStatus;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const initialForm: ClientForm = {
  userId: "",
  user: "",
  type: "1",
  status: "active",
};

export function ApiClientsPage() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<ClientForm>(initialForm);
  const [oneTimeKey, setOneTimeKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [detailClient, setDetailClient] = useState<ApiClient | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const deleteConfirmation = useDeleteConfirmation();

  const loadClients = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<ApiResponse<ApiClient[]>>("/api-clients");
      setClients(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load API clients."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter((client) =>
      [
        client.user,
        String(client.id),
        String(client.userId),
        String(client.type),
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }, [clients, searchTerm]);
  const sorting = useDataTableSort(filteredClients, (client, key) => {
    switch (key) {
      case "client": return client.user;
      case "type": return client.type;
      case "status": return client.status;
      case "created": return client.createdAt;
      default: return "";
    }
  });
  const sortingHeaderProps = {
    activeSortKey: sorting.sortKey,
    direction: sorting.direction,
    onSort: sorting.toggleSort,
  };
  const selection = useDataTableSelection(sorting.sortedItems, (client) =>
    String(client.id),
  );
  const pagination = useDataTablePagination(sorting.sortedItems);

  const totals = useMemo(
    () => ({
      active: clients.filter((client) => client.status === "active").length,
      total: clients.length,
    }),
    [clients],
  );

  const handleToggleStatus = async (client: ApiClient) => {
    setError("");
    try {
      const response = await api.patch<ApiResponse<ApiClient>>(
        `/api-clients/${client.id}`,
        {
          status: client.status === "active" ? 0 : 1,
        },
      );
      setClients((current) =>
        current.map((item) =>
          item.id === client.id ? response.data.data : item,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to update API client."),
      );
    }
  };

  const handleDelete = async (client: ApiClient) => {
    if (
      !(await deleteConfirmation.confirmDelete(
        `Delete API client "${client.user}"?`,
      ))
    )
      return;
    setError("");
    try {
      await api.delete(`/api-clients/${client.id}`);
      setClients((current) => current.filter((item) => item.id !== client.id));
      selection.remove([String(client.id)]);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to delete API client."),
      );
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selection.selectedIds].map(Number);
    if (
      !ids.length ||
      !(await deleteConfirmation.confirmDelete(
        `Permanently delete ${ids.length} selected API clients?`,
      ))
    )
      return;
    setDeletingSelected(true);
    setError("");
    try {
      await api.delete("/api-clients/bulk", { data: { ids } });
      setClients((current) =>
        current.filter(
          (client) => !selection.selectedIds.has(String(client.id)),
        ),
      );
      selection.clear();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to delete selected API clients.",
        ),
      );
    } finally {
      setDeletingSelected(false);
    }
  };

  const handleAddClient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setOneTimeKey("");
    try {
      const response = await api.post<
        ApiResponse<{ client: ApiClient; apiKey: string }>
      >("/api-clients", {
        userId: Number(form.userId),
        user: form.user.trim(),
        type: Number(form.type),
        status: form.status === "active" ? 1 : 0,
      });
      setClients((current) => [response.data.data.client, ...current]);
      setOneTimeKey(response.data.data.apiKey);
      setForm(initialForm);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to create API client."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-violet-300">
          Client directory
        </p>
        <h3 className="mt-2 text-3xl font-semibold text-white">API Clients</h3>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}

      {oneTimeKey && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
          <p className="font-semibold">Copy your new API key now</p>
          <p className="mt-1 text-sm text-amber-100/80">
            It is shown only once and cannot be retrieved later.
          </p>
          <code className="mt-3 block break-all rounded-lg bg-slate-950/50 p-3 font-mono text-sm">
            {oneTimeKey}
          </code>
          <button
            type="button"
            onClick={() => setOneTimeKey("")}
            className="mt-3 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Active clients</span>
            <ShieldCheck size={18} className="text-emerald-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">
            {totals.active}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Total API clients</span>
            <Users size={18} className="text-cyan-300" />
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">
            {totals.total}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm">Key security</span>
            <KeyRound size={18} className="text-violet-300" />
          </div>
          <p className="mt-5 text-lg font-semibold text-emerald-300">
            Keys are never listed
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-slate-300">
              <Search size={18} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search clients"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <BulkDeleteButton
              count={selection.selectedIds.size}
              loading={deletingSelected}
              onClick={() => void handleBulkDelete()}
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-[760px] text-left text-sm">
              <thead className="bg-slate-950/40 text-slate-300">
                <tr>
                  <th className="px-4 py-3">
                    <DataTableCheckbox
                      checked={selection.allFilteredSelected}
                      indeterminate={
                        selection.selectedFilteredCount > 0 &&
                        !selection.allFilteredSelected
                      }
                      disabled={selection.filteredIds.length === 0}
                      label="Select all filtered API clients"
                      onChange={selection.toggleFiltered}
                    />
                  </th>
                  <SortableTableHeader label="Client" sortKey="client" className="px-4 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Type" sortKey="type" className="px-4 py-3 font-medium" {...sortingHeaderProps} />
                  <th className="px-4 py-3 font-medium">API key</th>
                  <SortableTableHeader label="Status" sortKey="status" className="px-4 py-3 font-medium" {...sortingHeaderProps} />
                  <SortableTableHeader label="Created" sortKey="created" className="px-4 py-3 font-medium" {...sortingHeaderProps} />
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  pagination.pageItems.map((client) => (
                    <tr
                      key={client.id}
                      className="border-t border-white/10 bg-white/[0.01] text-slate-200"
                    >
                      <td className="px-4 py-3">
                        <DataTableCheckbox
                          checked={selection.selectedIds.has(String(client.id))}
                          label={`Select ${client.user}`}
                          onChange={(checked) =>
                            selection.toggle(String(client.id), checked)
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{client.user}</p>
                        <p className="text-xs text-slate-400">
                          ID {client.id} · User ID {client.userId}
                        </p>
                      </td>
                      <td className="px-4 py-3">{client.type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        Protected
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${client.status === "active" ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailClient(client)}
                            aria-label={`Details for ${client.user}`}
                            title="View details"
                            className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200 transition hover:bg-cyan-400/20"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(client)}
                            aria-label={`${client.status === "active" ? "Disable" : "Enable"} ${client.user}`}
                            title={
                              client.status === "active"
                                ? "Disable client"
                                : "Enable client"
                            }
                            className={`rounded-lg border p-2 transition ${client.status === "active" ? "border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"}`}
                          >
                            {client.status === "active" ? (
                              <ToggleRight size={16} />
                            ) : (
                              <ToggleLeft size={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${client.user}`}
                            title="Delete client"
                            onClick={() => void handleDelete(client)}
                            className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-rose-200 transition hover:bg-rose-400/20"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Loading clients…
                    </td>
                  </tr>
                )}
                {!loading && filteredClients.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      No API clients found in api_client.
                    </td>
                  </tr>
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

        <aside className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-cyan-300" />
            <h4 className="text-lg font-semibold">Create client</h4>
          </div>
          <form
            onSubmit={(event) => void handleAddClient(event)}
            className="space-y-4"
          >
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">User ID</span>
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.userId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    userId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                Username
              </span>
              <input
                required
                maxLength={100}
                value={form.user}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    user: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none placeholder:text-slate-500"
                placeholder="Client username"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                API type
              </span>
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as ClientStatus,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-white outline-none"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              <Plus size={16} />
              {saving ? "Saving…" : "Save client"}
            </button>
          </form>
        </aside>
      </div>
      {detailClient && (
        <DataTableDetailsModal
          title={`Client details: ${detailClient.user}`}
          onClose={() => setDetailClient(null)}
          details={[
            { label: "ID", value: detailClient.id },
            { label: "User ID", value: detailClient.userId },
            { label: "Username", value: detailClient.user },
            { label: "API type", value: detailClient.type },
            { label: "Status", value: detailClient.status },
            {
              label: "Created",
              value: new Date(detailClient.createdAt).toLocaleString(),
            },
            { label: "Created by", value: detailClient.createdBy },
            {
              label: "Modified",
              value: detailClient.modifiedAt
                ? new Date(detailClient.modifiedAt).toLocaleString()
                : "—",
            },
            { label: "Modified by", value: detailClient.modifiedBy ?? "—" },
            { label: "API key", value: "Key material is not displayed." },
          ]}
        />
      )}
      {deleteConfirmation.dialog}
    </div>
  );
}
