import { Navigate, Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuickSendPage } from './pages/QuickSendPage';
import { BulkSendPage } from './pages/BulkSendPage';
import { ApiClientsPage } from './pages/ApiClientsPage';
import { SmsServersPage } from './pages/SmsServersPage';
import { SettingsPage } from './pages/SettingsPage';
import { CountryCoveragesPage } from './pages/CountryCoveragesPage';
import { SnImeiCheckerPage } from './pages/SnImeiCheckerPage';
import { AllUsersPage } from './pages/AllUsersPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ImeiSettingsPage } from './pages/ImeiSettingsPage';
import { VoiceServersPage } from './pages/VoiceServersPage';

function AppShell() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080d20] text-slate-100">
      <div className="flex min-h-screen min-w-0 flex-col lg:flex-row">
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col p-3 sm:p-5 lg:p-6">
          <header className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 bg-[#111a33] px-4 py-4 shadow-xl shadow-slate-950/10 sm:mb-6 sm:px-5 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Overview</p>
              <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Operations Dashboard</h2>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:items-center sm:gap-3">
              <button className="min-w-0 flex-1 whitespace-nowrap rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100 transition hover:bg-violet-500/20 sm:flex-none sm:px-4 sm:text-sm">
                Buy Credits
              </button>
              <button className="min-w-0 flex-1 whitespace-nowrap rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-500 sm:flex-none sm:px-4 sm:text-sm">
                New Campaign
              </button>
            </div>
          </header>

          <div className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/quick-send" element={<QuickSendPage />} />
              <Route path="/bulk-send" element={<BulkSendPage />} />
              <Route path="/api-clients" element={<ApiClientsPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/sms-servers" element={<SmsServersPage />} />
              <Route path="/voice-servers" element={<VoiceServersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/coverages" element={<CountryCoveragesPage />} />
              <Route path="/settings/imei" element={<ImeiSettingsPage />} />
              <Route path="/sn-imei-checker" element={<SnImeiCheckerPage />} />
              <Route path="/sunmig" element={<Navigate to="/sn-imei-checker" replace />} />
              <Route path="/templates" element={<SettingsPage />} />
              <Route path="/users" element={<AllUsersPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const token = localStorage.getItem('sms_token');

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080d20]">
        <main className="flex flex-1">
          <AuthPage />
        </main>
        <div className="px-4">
          <Footer />
        </div>
      </div>
    );
  }

  return <AppShell />;
}
