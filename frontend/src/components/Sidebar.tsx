import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  ChevronDown,
  Flame,
  Gauge,
  LayoutDashboard,
  LogOut,
  Lock,
  Menu,
  Megaphone,
  MessageSquareText,
  MapPinned,
  ScanLine,
  ServerCog,
  PhoneCall,
  ShieldCheck,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import api, { setAuthToken } from "../services/api";

type AccountProfile = {
  fullName: string;
  username: string;
  role: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const navigation = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard },
      { label: "SN/IMEI Checker", to: "/sn-imei-checker", icon: ShieldCheck },
      { label: "Auto Renew", to: "/auto-renew", icon: Zap },
    ],
  },
  {
    title: "SMS/Call Management",
    items: [
      { label: "Quick Send", to: "/quick-send", icon: MessageSquareText },
      { label: "Bulk Send", to: "/bulk-send", icon: Activity },
    ],
  },
  {
    title: "All Clients",
    items: [
      { label: "All Users", to: "/users", icon: Users },
      { label: "API Clients", to: "/api-clients", icon: Lock },
      { label: "Announcements", to: "/announcements", icon: Megaphone },
    ],
  },
  {
    title: "Gateways",
    items: [
      { label: "SMS Servers", to: "/sms-servers", icon: ServerCog },
      { label: "Voice Servers", to: "/voice-servers", icon: PhoneCall },
    ],
  },
  {
    title: "Templates",
    items: [
      { label: "Voice Templates", to: "/templates", icon: MessageSquareText },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Panel Settings", to: "/settings", icon: Wrench },
      { label: "IMEI Settings", to: "/settings/imei", icon: ScanLine },
      {
        label: "Country Coverages",
        to: "/settings/coverages",
        icon: MapPinned,
      },
    ],
  },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [accountLoadFailed, setAccountLoadFailed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Main: true,
    "SMS Management": true,
    "All Clients": true,
    "API Management": true,
    Templates: true,
    Settings: true,
  });

  useEffect(() => {
    let active = true;
    api
      .get<ApiResponse<AccountProfile>>("/auth/me")
      .then((response) => {
        if (active) setAccount(response.data.data);
      })
      .catch(() => {
        if (active) setAccountLoadFailed(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleSection = (title: string) => {
    setOpenSections((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  const handleLogout = () => {
    setAuthToken(null);
    window.location.assign("/");
  };

  return (
    <aside className="w-full border-b border-white/10 bg-[#0d1429] p-4 sm:p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[290px] lg:max-w-[290px] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r">
      <div className="flex shrink-0 items-center justify-between lg:mb-8">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-400">
            SMS Portal
          </p>
          <h1 className="mt-1 flex items-center gap-1.5 text-2xl font-black tracking-[0.16em] sm:text-3xl">
            <Flame aria-hidden="true" className="pyro-flame text-orange-400" size={25} />
            <span className="pyro-wordmark">PYRO</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2 text-violet-200">
            <Gauge size={18} />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl border border-white/10 p-2 text-slate-200 lg:hidden"
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className={`${mobileOpen ? "mt-4 block max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain" : "hidden"} space-y-3 lg:mt-0 lg:block lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1`}
      >
        {navigation.map(({ title, items }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-2"
          >
            <button
              type="button"
              onClick={() => toggleSection(title)}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-xs font-medium uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200"
            >
              {title}
              <ChevronDown
                className={`transition ${openSections[title] ? "rotate-180" : ""}`}
                size={14}
              />
            </button>

            {openSections[title] && (
              <div className="mt-2 space-y-1.5">
                {items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/" || to === "/settings"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        isActive
                          ? "bg-violet-600/20 text-violet-100 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.4)]"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div
        className={`${mobileOpen ? "mt-4 block" : "hidden"} shrink-0 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 lg:mt-8 lg:block`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-100/80">
              Account
            </p>
            <p className="mt-2 break-words font-medium text-white">
              {account
                ? account.fullName || account.username
                : accountLoadFailed
                  ? "Account unavailable"
                  : "Loading account…"}
            </p>
            {account && (
              <p className="mt-0.5 text-xs capitalize text-cyan-100/70">
                {account.role === "viewer"
                  ? "User"
                  : account.role.replaceAll("_", " ")}
              </p>
            )}
          </div>
          <Bell className="text-cyan-300" size={18} />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-100"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </aside>
  );
}
