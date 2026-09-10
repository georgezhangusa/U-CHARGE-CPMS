import React, { useState } from 'react';
import {
  X,
  Zap,
  Activity,
  ShieldCheck,
  RotateCcw,
  Power,
  Play,
  Square,
  Unlock,
  Wrench,
  ChevronDown,
  ChevronUp,
  Clock,
  BatteryCharging,
  Cpu,
  Thermometer,
  ShieldAlert,
  Copy,
  Check,
  Radio,
} from 'lucide-react';
import { ChargingStation, OcppMessage } from '../types';
import { getStatusColor, formatKw } from '../utils';

interface ChargerDetailDrawerProps {
  station: ChargingStation | null;
  isOpen: boolean;
  onClose: () => void;
  ocppMessages: OcppMessage[];
  onTriggerAction: (
    action: 'SoftReset' | 'HardReset' | 'StopCharging' | 'StartCharging' | 'UnlockCable' | 'ToggleMaintenance',
    portNumber?: number
  ) => void;
  onOpenSession?: (sessionId: string) => void;
}

export const ChargerDetailDrawer: React.FC<ChargerDetailDrawerProps> = ({
  station,
  isOpen,
  onClose,
  ocppMessages,
  onTriggerAction,
  onOpenSession,
}) => {
  const [showOcppTrace, setShowOcppTrace] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<OcppMessage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || !station) return null;

  const stationMessages = ocppMessages.filter((m) => m.stationId === station.id);
  const headroomKw = Math.max(0, station.totalCapacityKw - station.currentLoadKw);
  const loadPercent = Math.min(100, Math.round((station.currentLoadKw / station.totalCapacityKw) * 100));

  const handleCopyPayload = (msg: OcppMessage) => {
    navigator.clipboard.writeText(JSON.stringify(msg.payload, null, 2));
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity">
      <div
        id="charger-detail-drawer"
        className="w-full max-w-2xl bg-white border-l border-slate-200 text-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-slate-900 tracking-wider">
                  {station.id}
                </span>
                <span className="text-slate-500 text-sm">/ {station.name}</span>
                {station.isEmulated && (
                  <span className="px-2 py-0.5 rounded-sm bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-mono uppercase tracking-wider font-semibold">
                    Emulated
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-sm bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-mono">
                  {station.ocppVersion}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{station.siteName}</span>
                <span>•</span>
                <span>{station.model}</span>
                <span>•</span>
                <span className="font-mono">{station.ipAddress}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Freshness Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  station.wsStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : station.wsStatus === 'lag'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    station.wsStatus === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : station.wsStatus === 'lag'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                />
                <span>
                  {station.wsStatus === 'connected'
                    ? `Live (${station.lastHeartbeatSecondsAgo}s ago)`
                    : station.wsStatus === 'lag'
                      ? `Lag (${station.lastHeartbeatSecondsAgo}s)`
                      : 'Disconnected'}
                </span>
              </div>

              <button
                id="close-charger-drawer-btn"
                onClick={onClose}
                className="btn-3d btn-3d-white p-1.5 rounded-lg text-slate-500 hover:text-slate-800"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Station Power & Capacity Headroom Bar */}
          <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-600" />
                <span className="text-slate-700 font-semibold">Station Power Distribution</span>
                <span className="text-slate-500 text-[11px]">
                  ({station.isSimultaneous ? 'Simultaneous Dynamic Power Sharing' : 'Mutually Exclusive EVSE'})
                </span>
              </div>
              <div className="font-mono text-slate-800">
                <span className="font-bold text-cyan-700">{formatKw(station.currentLoadKw)}</span>
                <span className="text-slate-500"> / {formatKw(station.totalCapacityKw)} Max</span>
              </div>
            </div>

            {/* Visual meter */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 ${
                  loadPercent > 85 ? 'bg-amber-500' : 'bg-cyan-600'
                }`}
                style={{ width: `${loadPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Load: {loadPercent}%</span>
              <span className="text-emerald-700 font-semibold">Headroom: {formatKw(headroomKw)} Available</span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* EVSE & Connector Statuses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                EVSE & Connector Ports
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {station.evses.length} EVSE Circuit{station.evses.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {station.evses.map((evse) =>
                evse.connectors.map((conn) => {
                  const statusStyle = getStatusColor(conn.status);
                  return (
                    <div
                      key={conn.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative overflow-hidden"
                    >
                      {/* Port banner */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-sm bg-slate-200 font-mono font-bold text-xs text-slate-800">
                            Port {conn.portNumber}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {conn.type}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            (Max {conn.maxPowerKw} kW)
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{conn.status}</span>
                        </div>
                      </div>

                      {/* Lockout notice if mutually exclusive */}
                      {conn.lockoutReason && (
                        <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>{conn.lockoutReason}</span>
                        </div>
                      )}

                      {/* SoC / Progress if vehicle attached */}
                      {conn.currentSoc !== undefined && (
                        <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                              <BatteryCharging className="w-4 h-4 text-cyan-600" />
                              Vehicle Battery SoC
                            </span>
                            <span className="font-mono font-bold text-cyan-700 text-sm">
                              {conn.currentSoc}%
                              {conn.targetSoc && (
                                <span className="text-slate-400 text-xs font-normal">
                                  {' '}
                                  → {conn.targetSoc}% Target
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-600 transition-all duration-300"
                              style={{ width: `${conn.currentSoc}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                            <span>ETA to 80%: {conn.timeTo80Min !== undefined ? `${conn.timeTo80Min} mins` : '—'}</span>
                            <span>Full: {conn.etaFullMin !== undefined ? `${conn.etaFullMin} mins` : '—'}</span>
                          </div>
                        </div>
                      )}

                      {/* Live electrical telemetry */}
                      <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg bg-white border border-slate-200">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-mono">Live Power</div>
                          <div className="text-xs font-mono font-bold text-cyan-700">
                            {conn.currentPowerKw.toFixed(1)} kW
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-mono">Voltage</div>
                          <div className="text-xs font-mono font-bold text-slate-800">
                            {conn.voltageV} V
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-mono">Current</div>
                          <div className="text-xs font-mono font-bold text-slate-800">
                            {conn.currentA} A
                          </div>
                        </div>
                      </div>

                      {/* Cable Lock & Active Session Link */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Cable Lock: </span>
                          <span
                            className={
                              conn.cableLocked ? 'text-amber-700 font-semibold' : 'text-slate-500'
                            }
                          >
                            {conn.cableLocked ? 'Engaged' : 'Unlocked'}
                          </span>
                        </div>

                        {conn.activeSessionId && (
                          <button
                            type="button"
                            onClick={() => onOpenSession?.(conn.activeSessionId!)}
                            className="text-cyan-700 hover:text-cyan-800 underline font-mono text-[11px] font-semibold cursor-pointer"
                          >
                            {conn.activeSessionId} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Operational Health & Diagnostics Widget (Human-Readable) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Operational Health & Diagnostics
            </h4>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Contactor */}
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                    <Power className="w-3.5 h-3.5 text-slate-400" />
                    DC Contactors
                  </div>
                  <div
                    className={`font-mono text-xs font-bold ${
                      station.health.contactor === 'Closed' ? 'text-cyan-700' : 'text-slate-500'
                    }`}
                  >
                    {station.health.contactor}
                  </div>
                </div>

                {/* Cabinet Temp */}
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                    Cabinet Temp
                  </div>
                  <div
                    className={`font-mono text-xs font-bold ${
                      station.health.cabinetTempC > 50
                        ? 'text-rose-600'
                        : station.health.cabinetTempC > 40
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                    }`}
                  >
                    {station.health.cabinetTempC}°C
                  </div>
                </div>

                {/* E-Stop */}
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    Emergency Stop
                  </div>
                  <div
                    className={`font-mono text-xs font-bold ${
                      station.health.eStop === 'OK' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {station.health.eStop}
                  </div>
                </div>

                {/* Ground Fault */}
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Ground Isolation
                  </div>
                  <div
                    className={`font-mono text-xs font-bold ${
                      station.health.groundFault === 'Clear' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {station.health.groundFault}
                  </div>
                </div>

                {/* Gun Lock */}
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    Connector Solenoid
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-800">
                    {station.health.gunLock}
                  </div>
                </div>

                {/* Firmware */}
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    Firmware
                  </div>
                  <div className="font-mono text-xs text-slate-800 truncate">
                    {station.health.firmwareVersion}
                  </div>
                </div>
              </div>

              {/* Error code readout */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs flex items-start gap-2.5">
                <span className="font-mono text-slate-500 shrink-0 font-semibold">DIAGNOSTIC:</span>
                <div>
                  <span
                    className={`font-semibold ${
                      station.health.lastErrorCode === '0x00' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    [{station.health.lastErrorCode}] {station.health.lastError}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Remote Controls with Safety Interlocks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Remote Controls & Dispatch Actions
              </h4>
              <span className="text-[10px] text-rose-600 font-semibold">Interlock Protected</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                id="drawer-start-charging-btn"
                onClick={() => onTriggerAction('StartCharging')}
                className="btn-3d btn-3d-cyan p-3 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                <Play className="w-4 h-4 fill-current shrink-0 text-white" />
                <span>Start Charging</span>
              </button>

              <button
                type="button"
                id="drawer-stop-charging-btn"
                onClick={() => onTriggerAction('StopCharging')}
                className="btn-3d btn-3d-rose p-3 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                <Square className="w-4 h-4 fill-current shrink-0 text-white" />
                <span>Stop Charging</span>
              </button>

              <button
                type="button"
                id="drawer-unlock-cable-btn"
                onClick={() => onTriggerAction('UnlockCable')}
                className="btn-3d btn-3d-white p-3 rounded-xl text-slate-800 flex items-center gap-2 text-xs font-bold"
              >
                <Unlock className="w-4 h-4 shrink-0 text-slate-600" />
                <span>Unlock Cable</span>
              </button>

              <button
                type="button"
                id="drawer-soft-reset-btn"
                onClick={() => onTriggerAction('SoftReset')}
                className="btn-3d btn-3d-white p-3 rounded-xl text-slate-800 flex items-center gap-2 text-xs font-bold"
              >
                <RotateCcw className="w-4 h-4 shrink-0 text-slate-600" />
                <span>Soft Reset</span>
              </button>

              <button
                type="button"
                id="drawer-hard-reset-btn"
                onClick={() => onTriggerAction('HardReset')}
                className="btn-3d btn-3d-rose p-3 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 text-white" />
                <span>Hard Reset</span>
              </button>

              <button
                type="button"
                id="drawer-maintenance-btn"
                onClick={() => onTriggerAction('ToggleMaintenance')}
                className="btn-3d btn-3d-amber p-3 rounded-xl flex items-center gap-2 text-xs font-bold"
              >
                <Wrench className="w-4 h-4 shrink-0 text-white" />
                <span>Maintenance</span>
              </button>
            </div>
          </div>

          {/* Progressive-Disclosure Raw OCPP Trace Accordion */}
          <div className="pt-2">
            <button
              type="button"
              id="toggle-ocpp-trace-accordion"
              onClick={() => setShowOcppTrace(!showOcppTrace)}
              className="btn-3d btn-3d-white w-full flex items-center justify-between p-3.5 rounded-xl text-left text-xs font-bold text-slate-800"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-600" />
                <span>Real-Time OCPP Message Trace</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
                  {stationMessages.length} Messages
                </span>
              </div>
              {showOcppTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showOcppTrace && (
              <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[11px] text-slate-500 font-semibold flex justify-between pb-1 border-b border-slate-200">
                  <span>Timestamp & Direction</span>
                  <span>Action / Payload Inspector</span>
                </div>

                {stationMessages.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No recent OCPP messages logged for this station.</p>
                ) : (
                  stationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-mono flex flex-col gap-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">{msg.timestamp}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                              msg.direction === 'CP_TO_CS'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {msg.direction === 'CP_TO_CS' ? 'CP → CS' : 'CS → CP'}
                          </span>
                          <span className="font-bold text-slate-800">{msg.action}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyPayload(msg)}
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Copy JSON Payload"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(msg)}
                            className="text-[11px] text-cyan-700 hover:text-cyan-900 font-bold hover:underline px-1.5 py-0.5 cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>

                      {/* Snippet preview */}
                      <pre className="text-[11px] text-slate-600 truncate overflow-hidden bg-slate-50 p-1.5 rounded-sm border border-slate-200">
                        {JSON.stringify(msg.payload)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal for Raw JSON Payload Inspection */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 space-y-3 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-cyan-700 font-bold">{selectedMessage.action}</span>
                  <span className="text-slate-500">• {selectedMessage.timestamp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto max-h-80">
                <pre className="text-xs font-mono text-slate-100">
                  {JSON.stringify(selectedMessage.payload, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyPayload(selectedMessage)}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
