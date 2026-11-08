import { useMemo, useState } from 'react';

const recipientsSeed = [
  '+2348012345678',
  '+2348055551234',
  '+2348012345678',
  '+2348123456789',
  '08091010101',
];

export function BulkSendPage() {
  const [manualNumbers, setManualNumbers] = useState(recipientsSeed.join(', '));
  const [message, setMessage] = useState('Hello! This is a bulk customer update from SMS Portal.');
  const [country, setCountry] = useState('Nigeria');
  const [server, setServer] = useState('Custom Gateway');
  const [category, setCategory] = useState('Marketing');

  const parsedNumbers = useMemo(() => {
    const numbers = manualNumbers
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const valid = numbers.filter((value) => /^\+?[0-9\s()-]{8,20}$/.test(value));
    const unique = [...new Set(valid)];
    return { total: unique.length, invalid: numbers.length - valid.length, values: unique };
  }, [manualNumbers]);

  const estimatedCredits = Math.max(1, Math.ceil((message.trim().length || 1) / 160) * parsedNumbers.total);

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111a33] p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold text-white">Bulk Send</h3>
            <p className="mt-1 text-sm text-slate-400">Upload or paste recipient numbers and send in batches.</p>
          </div>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">Queued batches</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">SMS category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none">
              <option>Marketing</option>
              <option>Alerts</option>
              <option>Support</option>
              <option>OTP</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Country</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none">
              <option>Nigeria</option>
              <option>Ghana</option>
              <option>Kenya</option>
              <option>South Africa</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Recipients</span>
            <textarea
              value={manualNumbers}
              rows={6}
              onChange={(event) => setManualNumbers(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none"
              placeholder="Use commas to separate numbers"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">SMS server</span>
            <select value={server} onChange={(event) => setServer(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none">
              <option>Custom Gateway</option>
              <option>Twilio</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">CSV / Excel upload</span>
            <input type="file" accept=".csv,.xlsx,.xls" className="w-full rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-3 py-3 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-white" />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Bulk message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-white outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-300">
            <p>Valid recipients: <span className="font-medium text-white">{parsedNumbers.total}</span></p>
            <p>Estimated credits: <span className="font-medium text-white">{estimatedCredits}</span></p>
          </div>
          <button className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400">Send bulk campaign</button>
        </div>
      </section>

      <aside className="rounded-2xl border border-white/10 bg-[#111a33] p-6">
        <h4 className="text-lg font-semibold text-white">Campaign summary</h4>

        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <p className="text-slate-400">Recipients</p>
            <p className="mt-1 text-2xl font-semibold text-white">{parsedNumbers.total}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <p className="text-slate-400">Invalid numbers</p>
            <p className="mt-1 text-2xl font-semibold text-white">{parsedNumbers.invalid}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <p className="text-slate-400">Server</p>
            <p className="mt-1 text-lg font-semibold text-white">{server}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <p className="text-slate-400">Status</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">Ready to queue</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
