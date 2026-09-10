import React, { useState } from 'react';
import {
  MapPin,
  Zap,
  DollarSign,
  AlertTriangle,
  Sliders,
  X,
  CheckCircle,
  Building,
  TrendingUp,
} from 'lucide-react';
import { Site, ChargingStation } from '../types';
import { formatKw, formatCurrency } from '../utils';

interface SitesViewProps {
  sites: Site[];
  chargers: ChargingStation[];
  onOpenStation: (station: ChargingStation) => void;
  onNavigateToChargers: (siteId: string) => void;
}

export const SitesView: React.FC<SitesViewProps> = ({
  sites,
  chargers,
  onOpenStation,
  onNavigateToChargers,
}) => {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [peakShavingEnabled, setPeakShavingEnabled] = useState(true);
  const [demandLimitKw, setDemandLimitKw] = useState(2500);

  const [savedSuccess, setSavedSuccess] = useState(false);

  return (
    <div className="space-y-6">
      {/* Intro strip */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-600" />
            Grid Interconnection & Site Electrical Service Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time transformer capacity tracking, peak demand shaving, and site power distribution.
          </p>
        </div>
      </div>

      {/* Site Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site) => {
          const siteChargers = chargers.filter((c) => c.siteId === site.id);
          const loadPercent = Math.min(100, Math.round((site.currentLoadKw / site.transformerLimitKw) * 100));
          const isWarning = loadPercent >= 70;
          const headroomKw = Math.max(0, site.transformerLimitKw - site.currentLoadKw);

          return (
            <div
              key={site.id}
              className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 hover:border-slate-300 transition-all shadow-xs"
            >
              {/* Site Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">{site.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 pl-6">{site.address}, {site.city}, {site.state}</p>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200 font-medium">
                  {site.totalChargers} Chargers
                </span>
              </div>

              {/* Status summary pill */}
              <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-cyan-700 font-bold">{site.activeSessionsCount} Active Charging</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-medium">
                  {site.totalChargers - site.activeSessionsCount - site.offlineCount} Available
                </span>
                {site.offlineCount > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-rose-600 font-medium">{site.offlineCount} Offline</span>
                  </>
                )}
              </div>

              {/* Power Demand & Transformer Limit Bar */}
              <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-600" />
                    Site Power Demand
                  </span>
                  <div className="font-mono">
                    <span className={`font-bold ${isWarning ? 'text-amber-700' : 'text-cyan-700'}`}>
                      {formatKw(site.currentLoadKw)}
                    </span>
                    <span className="text-slate-400"> / {formatKw(site.transformerLimitKw)} Grid Limit</span>
                  </div>
                </div>

                {/* Meter Bar */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      loadPercent >= 80
                        ? 'bg-rose-500'
                        : isWarning
                          ? 'bg-amber-500'
                          : 'bg-cyan-600'
                    }`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-600">
                  <span>Capacity Utilized: {loadPercent}%</span>
                  <span className="text-emerald-700 font-medium">Headroom: {formatKw(headroomKw)}</span>
                </div>
              </div>

              {/* Revenue & Energy */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>Today's Revenue: </span>
                  <strong className="text-slate-900 font-mono">{formatCurrency(site.todayRevenue)}</strong>
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {(site.todayEnergyKwh / 1000).toFixed(1)} MWh today
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSite(site);
                    setSavedSuccess(false);
                  }}
                  className="btn-3d btn-3d-white flex-1 py-2 px-3 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Manage Site Power</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToChargers(site.id)}
                  className="btn-3d btn-3d-cyan py-2 px-3 text-white text-xs font-bold"
                >
                  View Chargers →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Site Management & Peak Shaving Slide-out Modal */}
      {selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div
            id="manage-site-modal"
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedSite.name}</h3>
                  <p className="text-xs text-slate-500">Site Energy Management & Peak Shaving</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSite(null)}
                className="btn-3d btn-3d-white p-1 rounded-lg text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {savedSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-sm">Grid Profiles Successfully Applied</p>
                  <p className="text-xs text-emerald-700">OCPP charging profiles deployed to all {selectedSite.totalChargers} station controllers at {selectedSite.name}.</p>
                  <button
                    type="button"
                    onClick={() => setSelectedSite(null)}
                    className="btn-3d btn-3d-emerald mt-2 px-5 py-2 text-white text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Utility Transformer Limit:</span>
                      <span className="text-slate-900 font-bold">{selectedSite.transformerLimitKw} kW ({(selectedSite.transformerLimitKw/1000).toFixed(1)} MW)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Instantaneous Load:</span>
                      <span className="text-cyan-700 font-bold">{selectedSite.currentLoadKw} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">24-Hour Peak Recorded:</span>
                      <span className="text-amber-700 font-bold">{selectedSite.peakDemandKw24h} kW</span>
                    </div>
                  </div>

                  {/* Peak Shaving Automation */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 block">Dynamic Load Curtailment (Smart Charging)</span>
                        <span className="text-slate-500 text-[11px]">
                          Throttle charging sessions automatically via OCPP SetChargingProfile when nearing grid ceiling.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={peakShavingEnabled}
                        onChange={(e) => setPeakShavingEnabled(e.target.checked)}
                        className="w-4 h-4 rounded-sm accent-cyan-600 cursor-pointer"
                      />
                    </div>

                    {peakShavingEnabled && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-700 font-medium">Soft Demand Ceiling:</span>
                          <span className="font-mono text-cyan-700 font-bold">{demandLimitKw} kW</span>
                        </div>
                        <input
                          type="range"
                          min="1000"
                          max={selectedSite.transformerLimitKw}
                          step="50"
                          value={demandLimitKw}
                          onChange={(e) => setDemandLimitKw(Number(e.target.value))}
                          className="w-full accent-cyan-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-500">
                          When load exceeds {demandLimitKw} kW, active DCFCs will be gracefully throttled by 15% to avoid utility peak demand charges.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSite(null)}
                      className="btn-3d btn-3d-white px-4 py-2 text-slate-800 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavedSuccess(true)}
                      className="btn-3d btn-3d-cyan px-4 py-2 text-white text-xs font-bold"
                    >
                      Apply Grid Profiles
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
