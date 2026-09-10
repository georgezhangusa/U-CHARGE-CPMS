import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Activity,
  MapPin,
  DollarSign,
  Settings,
  ShieldAlert,
} from 'lucide-react';

export type NavTab = 'home' | 'chargers' | 'sessions' | 'sites' | 'pricing' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  chargersCount: number;
  activeSessionsCount: number;
  criticalAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  chargersCount,
  activeSessionsCount,
  criticalAlertsCount,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'home',
      label: 'Operations ',
      icon: LayoutDashboard,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount}!` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200',
    },
    {
      id: 'chargers',
      label: 'Chargers ',
      icon: Zap,
      badge: chargersCount,
      badgeColor: 'bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold',
    },
    {
      id: 'sessions',
      label: 'Sessions ',
      icon: Activity,
      badge: activeSessionsCount,
      badgeColor: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    },
    {
      id: 'sites',
      label: 'Charging Sites ',
      icon: MapPin,
      badge: 4,
      badgeColor: 'bg-slate-100 text-slate-600 border border-slate-200',
    },
    {
      id: 'pricing',
      label: 'Pricing & ToU ',
      icon: DollarSign,
    },
    {
      id: 'settings',
      label: 'OCPP Simulator ',
      icon: Settings,
      badge: 'SIM',
      badgeColor: 'bg-purple-100 text-purple-700 border border-purple-200',
    },
  ];

  return (
    <aside className="w-full md:w-48 shrink-0 border-r border-slate-200 bg-white p-2 md:p-2.5 space-y-1">
      <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold hidden md:block">
        Management
      </div>
      <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`nav-item-${item.id}`}
              title={item.id === 'chargers' ? `Total chargers from all sites (${chargersCount})` : undefined}
              onClick={() => onTabChange(item.id)}
              className={`btn-3d w-full flex items-center !justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 text-left ${
                isActive
                  ? 'bg-cyan-50 text-cyan-950 border border-cyan-300 border-b-[3px] border-b-cyan-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 border-b-[3px] border-b-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-left mr-auto min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-700' : 'text-slate-500'}`} />
                <span className="text-left truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono shadow-xs shrink-0 transition-colors ${
                    item.id === 'chargers'
                      ? isActive
                        ? 'bg-cyan-600 text-white border border-cyan-700 font-extrabold'
                        : 'bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold'
                      : item.badgeColor || 'bg-slate-100 text-slate-600 font-bold'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
