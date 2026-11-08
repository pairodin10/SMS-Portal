import { FormEvent, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '../services/api';

type ImeiSettingOption = {
  id: number;
  name: string;
  servicePrice: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export function SnImeiCheckerPage() {
  const [settings, setSettings] = useState<ImeiSettingOption[]>([]);
  const [settingId, setSettingId] = useState('');
  const [imei, setImei] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await api.get<ApiResponse<ImeiSettingOption[]>>('/imei-settings/active');
        setSettings(response.data.data);
        setSettingId(String(response.data.data[0]?.id ?? ''));
      } catch (requestError) {
        setLoadError(getApiErrorMessage(requestError, 'Unable to load IMEI settings.'));
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionMessage('Form submitted. IMEI checking is not connected yet.');
  };

  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-violet-300">Device tools</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">SN/IMEI Checker</h3>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">IMEI service</span>
          <select
            required
            value={settingId}
            onChange={(event) => {
              setSettingId(event.target.value);
              setSubmissionMessage('');
            }}
            disabled={loading || settings.length === 0}
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <option value="">Loading settings…</option>}
            {!loading && settings.length === 0 && <option value="">No active IMEI settings</option>}
            {settings.map((setting) => (
              <option key={setting.id} value={String(setting.id)}>
                {setting.name} || {setting.servicePrice.toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">IMEI Number</span>
          <input
            required
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={imei}
            onChange={(event) => {
              setImei(event.target.value);
              setSubmissionMessage('');
            }}
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none placeholder:text-slate-500"
            placeholder="Enter IMEI number"
          />
        </label>

        {loadError && <p role="alert" className="text-sm text-rose-300">{loadError}</p>}
        {submissionMessage && <p role="status" className="text-sm text-amber-200">{submissionMessage}</p>}

        <button
          type="submit"
          disabled={loading || settings.length === 0}
          className="w-full rounded-xl bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Submit
        </button>
      </form>
    </section>
  );
}
