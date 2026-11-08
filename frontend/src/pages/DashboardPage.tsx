import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Megaphone,
  PhoneCall,
  X,
  ScanLine,
  MessageSquareText,
  Zap,
} from 'lucide-react';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import api, { getApiErrorMessage } from '../services/api';

type CurrentUserResponse = {
  success: boolean;
  data: {
    credits: {
      sms: number;
      voice: number;
      checker: number;
    };
  };
};

type Announcement = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
};

type AnnouncementResponse = {
  success: boolean;
  data: Announcement | null;
};

type DashboardMetrics = {
  totalSmsSent: number;
  customers: number;
  announcements: number;
  personalSmsSent: number;
  personalVoiceSent: number;
  resellers: number;
  smsServers: number;
  voiceServers: number;
  countryCoverages: number;
};

type DashboardMetricsResponse = {
  success: boolean;
  data: DashboardMetrics;
};

type DashboardActivityDay = {
  date: string;
  smsSent: number;
  voiceCalls: number;
};

type DashboardActivityResponse = {
  success: boolean;
  data: DashboardActivityDay[];
};

const quickActions = [
  { name: 'Quick SMS', detail: 'Send a one-off message', icon: <MessageSquareText size={18} />, accent: 'violet' },
  { name: 'Bulk SMS', detail: 'Launch a campaign', icon: <Database size={18} />, accent: 'cyan' },
  { name: 'API Clients', detail: 'Create and monitor clients', icon: <Zap size={18} />, accent: 'emerald' },
  { name: 'Check SMS Status', detail: 'Track recent requests', icon: <CheckCircle2 size={18} />, accent: 'amber' },
];

export function DashboardPage() {
  const [credits, setCredits] = useState<CurrentUserResponse['data']['credits'] | null>(null);
  const [creditsError, setCreditsError] = useState('');
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [announcementError, setAnnouncementError] = useState('');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsError, setMetricsError] = useState('');
  const [activity, setActivity] = useState<DashboardActivityDay[]>([]);
  const [activityError, setActivityError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<CurrentUserResponse>('/auth/me')
      .then((response) => {
        if (active) setCredits(response.data.data.credits);
      })
      .catch((requestError: unknown) => {
        if (active) setCreditsError(getApiErrorMessage(requestError, 'Unable to load account credits.'));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api.get<DashboardMetricsResponse>('/dashboard/metrics')
      .then((response) => {
        if (active) setMetrics(response.data.data);
      })
      .catch((requestError: unknown) => {
        if (active) setMetricsError(getApiErrorMessage(requestError, 'Unable to load dashboard metrics.'));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api.get<DashboardActivityResponse>('/dashboard/activity')
      .then((response) => {
        if (active) setActivity(response.data.data);
      })
      .catch((requestError: unknown) => {
        if (active) setActivityError(getApiErrorMessage(requestError, 'Unable to load SMS and voice activity.'));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api.get<AnnouncementResponse>('/dashboard/announcement')
      .then((response) => {
        if (!active) return;
        const latest = response.data.data;
        if (!latest) return;
        const dismissedId = sessionStorage.getItem('dismissed_announcement_id');
        if (dismissedId !== String(latest.id)) setAnnouncement(latest);
      })
      .catch((requestError: unknown) => {
        if (active) setAnnouncementError(getApiErrorMessage(requestError, 'Unable to load the announcement.'));
      });

    return () => {
      active = false;
    };
  }, []);

  const formatCredits = (value: number | undefined) => value === undefined
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

  const stats = [
    { label: 'SMS Credits', value: formatCredits(credits?.sms), tone: 'violet' as const, icon: <MessageSquareText size={18} /> },
    { label: 'Voice Call Credits', value: formatCredits(credits?.voice), tone: 'cyan' as const, icon: <PhoneCall size={18} /> },
    { label: 'IMEI Credits', value: formatCredits(credits?.checker), tone: 'emerald' as const, icon: <ScanLine size={18} /> },
  ];

  const metricValue = (value: number | undefined) => value === undefined
    ? '—'
    : new Intl.NumberFormat().format(value);

  const overviewMetrics = [
    { label: 'Total SMS Sent', value: metricValue(metrics?.totalSmsSent), tone: 'violet' as const, icon: <MessageSquareText size={18} /> },
    { label: 'Customers', value: metricValue(metrics?.customers), tone: 'cyan' as const, icon: <Database size={18} /> },
    { label: 'Announcement', value: metricValue(metrics?.announcements), tone: 'amber' as const, icon: <Megaphone size={18} /> },
  ];

  const userActivityMetrics = [
    { label: 'SMS Sent', value: metricValue(metrics?.personalSmsSent), tone: 'violet' as const, icon: <MessageSquareText size={18} /> },
    { label: 'Voice Sent', value: metricValue(metrics?.personalVoiceSent), tone: 'cyan' as const, icon: <PhoneCall size={18} /> },
    { label: 'Reseller', value: metricValue(metrics?.resellers), tone: 'emerald' as const, icon: <Database size={18} /> },
  ];

  const serverMetrics = [
    { label: 'SMS Server', value: metricValue(metrics?.smsServers), tone: 'violet' as const, icon: <MessageSquareText size={18} /> },
    { label: 'Voice Server', value: metricValue(metrics?.voiceServers), tone: 'cyan' as const, icon: <PhoneCall size={18} /> },
    { label: 'Country Coverages', value: metricValue(metrics?.countryCoverages), tone: 'emerald' as const, icon: <ScanLine size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-600/20 via-[#111a33] to-cyan-500/10 p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-violet-200">Welcome back</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-3xl font-semibold text-white">Hello, Super Admin</h3>
            <p className="mt-2 text-slate-300">Today is Friday, 7 November 2026</p>
          </div>
          <button className="inline-flex items-center gap-2 self-start rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500">
            View reports <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            tone={stat.tone}
            icon={stat.icon}
          />
        ))}
      </div>
      {creditsError && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {creditsError}
        </p>
      )}
      {announcementError && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {announcementError}
        </p>
      )}
      {announcement && (
        <section
          aria-labelledby="dashboard-announcement-title"
          className="relative rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-[#111a33] to-violet-500/10 p-4 pr-14 shadow-lg shadow-slate-950/10 sm:p-5 sm:pr-16"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
              <Megaphone size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Announcement</p>
              <h3 id="dashboard-announcement-title" className="mt-1 text-base font-semibold text-white">{announcement.title}</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{announcement.body}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close announcement"
            title="Dismiss announcement"
            onClick={() => {
              sessionStorage.setItem('dismissed_announcement_id', String(announcement.id));
              setAnnouncement(null);
            }}
            className="absolute right-3 top-3 rounded-lg border border-white/10 bg-slate-950/30 p-2 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:right-4 sm:top-4"
          >
            <X size={16} />
          </button>
        </section>
      )}
      {metricsError && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {metricsError}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {overviewMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {userActivityMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {serverMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map(({ name, detail, icon, accent }) => (
          <div key={name} className="rounded-2xl border border-white/10 bg-[#111a33] p-5 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:border-violet-500/30">
            <div className={`mb-4 inline-flex rounded-xl p-2 ${accent === 'violet' ? 'bg-violet-500/10 text-violet-200' : accent === 'cyan' ? 'bg-cyan-500/10 text-cyan-200' : accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'}`}>
              {icon}
            </div>
            <p className="text-base font-medium text-white">{name}</p>
            <p className="mt-2 text-sm text-slate-400">{detail}</p>
          </div>
        ))}
      </div>

      {activityError && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {activityError}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {([
          { title: 'SMS sent over time', metric: 'smsSent', color: 'bg-gradient-to-t from-violet-600 via-violet-500 to-cyan-400' },
          { title: 'Voice calls over time', metric: 'voiceCalls', color: 'bg-gradient-to-t from-cyan-600 via-cyan-500 to-emerald-300' },
        ] as const).map(({ title, metric, color }) => {
          const maximum = Math.max(1, ...activity.map((day) => day[metric]));
          return (
            <SectionCard key={title} title={title} subtitle="Your activity · Last 30 days">
              <div className="mt-4 overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                <div className="flex h-52 min-w-[700px] items-end gap-1">
                  {activity.map((day, index) => {
                    const count = day[metric];
                    return (
                      <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                        <div
                          className={`w-full rounded-t-md ${color}`}
                          style={{ height: `${(count / maximum) * 100}%` }}
                          title={`${day.date}: ${count}`}
                          aria-label={`${day.date}: ${count}`}
                        />
                        <span className="text-[10px] text-slate-500">
                          {index % 5 === 0 || index === activity.length - 1 ? Number(day.date.slice(-2)) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

    </div>
  );
}
