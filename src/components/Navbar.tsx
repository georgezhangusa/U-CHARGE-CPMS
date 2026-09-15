import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  AlertTriangle,
  Clock,
  Radio,
  Sliders,
  Bell,
} from 'lucide-react';
import { SystemAlert } from '../types';

interface NavbarProps {
  alertsCount: number;
  onOpenAlerts: () => void;
  onOpenSimulator: () => void;
  emulatedCount: number;
  fleetOnlinePercent?: string | number;
  hubsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  alertsCount,
  onOpenAlerts,
  onOpenSimulator,
  emulatedCount,
  fleetOnlinePercent = '98.4',
  hubsCount = 4,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/95 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md shadow-md text-slate-100">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-sm shadow-cyan-500/30 shrink-0">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold tracking-wider text-base text-white font-mono">
              U-CHARGE Charge Point Management System (CPMS)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-600/60 text-cyan-300 font-mono text-[10px] font-bold tracking-tight">
              v1.0.0
            </span>
          </div>
          <p id="navbar-brand-tagline" className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Developer: George Zhang
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center gap-4">
        {/* Fleet Health status */}
        <div
          id="navbar-fleet-health-pill"
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/95 border border-slate-700/80 hover:border-emerald-500/40 transition-colors text-xs shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span
            id="navbar-fleet-online-badge"
            className="text-emerald-400 font-semibold font-mono tracking-tight text-xs flex items-center gap-1"
          >
            <span>{fleetOnlinePercent}%</span>
            <span className="text-slate-200 font-sans font-medium">Online</span>
          </span>
          <span
            id="navbar-fleet-hubs-count"
            className="inline-flex items-center gap-1.5 pl-2 border-l border-slate-700/90 text-xs font-mono tracking-tight text-slate-300"
          >
            <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
              {hubsCount}
            </span>
            <span className="font-medium text-slate-200">Sites</span>
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Triage Alert Pill */}
        <button
          type="button"
          id="navbar-alert-center-btn"
          onClick={onOpenAlerts}
          className="btn-3d btn-3d-white flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800"
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span>Triage</span>
          {alertsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold shadow-xs">
              {alertsCount}
            </span>
          )}
        </button>

        {/* Simulator launcher */}
        <button
          type="button"
          id="navbar-simulator-btn"
          onClick={onOpenSimulator}
          className="hidden sm:inline-flex btn-3d btn-3d-purple items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-bold"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Simulator</span>
        </button>

        {/* Time */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr || '10:21:38'}</span>
        </div>
      </div>
    </header>
  );
};
