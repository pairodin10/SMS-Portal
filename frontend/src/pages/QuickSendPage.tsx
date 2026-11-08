import { useEffect, useMemo, useState } from 'react';
import api, { getApiErrorMessage } from '../services/api';

const templates = ['Welcome Message', 'Payment Reminder', 'Account Alert'];

type CountryOption = {
  id: number;
  countryName: string;
};

type SmsGateway = {
  id: number;
  name: string;
  status: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export function QuickSendPage() {
  const [senderId, setSenderId] = useState('SMSPORTAL');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countryLoadError, setCountryLoadError] = useState<string | null>(null);
  const [phone, setPhone] = useState('+2348012345678');
  const [servers, setServers] = useState<SmsGateway[]>([]);
  const [serverId, setServerId] = useState('');
  const [loadingServers, setLoadingServers] = useState(true);
  const [serverLoadError, setServerLoadError] = useState<string | null>(null);
  const [template, setTemplate] = useState('Welcome Message');
  const [message, setMessage] = useState('Hello! Your account has been verified successfully.');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const isPhoneValid = useMemo(() => /^\+?[0-9\s()-]{8,20}$/.test(phone.trim()), [phone]);
  const messageLength = message.length;
  const estimatedCredits = Math.max(1, Math.ceil(messageLength / 160));
  const selectedServer = servers.find((item) => String(item.id) === serverId);

  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      setCountryLoadError(null);
      try {
        const response = await api.get<ApiResponse<CountryOption[]>>('/setting-coverages/countries');
        setCountries(response.data.data);
        setCountry((current) => (
          response.data.data.some((item) => item.countryName === current)
            ? current
            : response.data.data.find((item) => item.countryName.toLowerCase() === 'nigeria')?.countryName
              ?? response.data.data[0]?.countryName
              ?? ''
        ));
      } catch (requestError) {
        setCountryLoadError(getApiErrorMessage(requestError, 'Unable to load countries from coverage settings.'));
      } finally {
        setLoadingCountries(false);
      }
    };

    void loadCountries();
  }, []);

  useEffect(() => {
    const loadServers = async () => {
      setLoadingServers(true);
      setServerLoadError(null);
      try {
        const response = await api.get<ApiResponse<SmsGateway[]>>('/sms-servers/available-gateways');
        setServers(response.data.data);
        setServerId((current) =>
          response.data.data.some((gateway) => String(gateway.id) === current)
            ? current
            : String(response.data.data[0]?.id ?? ''),
        );
      } catch (requestError) {
        setServerLoadError(getApiErrorMessage(requestError, 'Unable to load SMS gateways.'));
      } finally {
        setLoadingServers(false);
      }
    };

    void loadServers();
  }, []);

  const handleSend = async () => {
    setError(null);
    setResult(null);

    if (!isPhoneValid) {
      setError('Please enter a valid recipient phone number.');
      return;
    }

    if (!message.trim()) {
      setError('SMS message text is required.');
      return;
    }

    setSending(true);

    try {
      const response = await api.post('/sms/send', {
        to: phone,
        senderId,
        body: message,
        country,
        providerType: 'custom',
      });

      const apiMessage = response.data?.message || 'SMS request processed successfully.';
      setResult(apiMessage);
    } catch (requestError) {
      const messageText =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to send SMS right now. Please try again.';
      setError(messageText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold text-white">Quick Send</h3>
            <p className="mt-1 text-sm text-slate-400">Send a one-off SMS with validation and preview.</p>
          </div>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">Mock provider</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Sender ID</span>
            <input
              value={senderId}
              onChange={(event) => setSenderId(event.target.value)}
              maxLength={11}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none"
              placeholder="Your sender name"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Country</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              disabled={loadingCountries || countries.length === 0}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingCountries && <option value="">Loading countries…</option>}
              {!loadingCountries && countries.length === 0 && <option value="">No active countries available</option>}
              {countries.map((item) => (
                <option key={item.id} value={item.countryName}>{item.countryName}</option>
              ))}
            </select>
            {countryLoadError && <p role="alert" className="mt-2 text-xs text-rose-300">{countryLoadError}</p>}
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Recipient phone number</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none"
              placeholder="+2348012345678"
            />
            {!isPhoneValid && phone && <p className="mt-2 text-xs text-rose-300">Phone format should look like +234... or local digits.</p>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">SMS server</span>
            <select
              value={serverId}
              onChange={(event) => setServerId(event.target.value)}
              disabled={loadingServers || servers.length === 0}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingServers && <option value="">Loading gateways…</option>}
              {!loadingServers && servers.length === 0 && <option value="">No active gateways available</option>}
              {servers.map((item) => (
                <option key={item.id} value={String(item.id)}>{item.name}</option>
              ))}
            </select>
            {serverLoadError && <p role="alert" className="mt-2 text-xs text-rose-300">{serverLoadError}</p>}
            {!serverLoadError && !loadingServers && servers.length > 0 && (
              <p className="mt-2 text-xs text-amber-200/80">Gateway selection is for reference; SMS delivery is still mocked and is not sent through this gateway.</p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Message template</span>
            <select value={template} onChange={(event) => setTemplate(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none">
              {templates.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Custom message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-300">
            <p>Characters: <span className="font-medium text-white">{messageLength}</span></p>
            <p>Estimated credits: <span className="font-medium text-white">{estimatedCredits}</span></p>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Send SMS'}
          </button>
        </div>

        {error && <p className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {result && <p className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{result}</p>}
      </section>

      <aside className="rounded-2xl border border-white/10 bg-[#111a33] p-6">
        <h4 className="text-lg font-semibold text-white">Message preview</h4>
        <div className="mt-4 rounded-2xl border border-violet-500/20 bg-slate-950/30 p-4 text-sm text-slate-200">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-violet-200">Preview</p>
          <p className="leading-7">{message || 'Your message preview will appear here.'}</p>
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-300">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <span>To</span>
            <span className="text-white">{phone || 'No recipient'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <span>Server</span>
            <span className="text-right text-white">{selectedServer?.name ?? (loadingServers ? 'Loading…' : 'No active gateway')}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <span>Credits</span>
            <span className="text-white">{estimatedCredits}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
