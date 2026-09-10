import React, { useState } from 'react';
import {
  Sliders,
  Copy,
  Check,
  Radio,
  AlertTriangle,
  Play,
  Square,
  ShieldAlert,
  Zap,
  RotateCcw,
  CheckCircle2,
  Lock,
  BatteryCharging,
  Cpu,
} from 'lucide-react';
import { ChargingStation, PortStatus } from '../types';

interface SimulatorSettingsViewProps {
  chargers: ChargingStation[];
  onSimulateEvent: (
    stationId: string,
    portNumber: number,
    eventType:
      | 'PlugInPreparing'
      | 'StartCharging'
      | 'FinishCharge'
      | 'UnplugAvailable'
      | 'InjectGroundFault'
      | 'TriggerEStop'
      | 'SimulateOfflineLag'
      | 'RestoreNormal'
  ) => void;
}

export const SimulatorSettingsView: React.FC<SimulatorSettingsViewProps> = ({
  chargers,
  onSimulateEvent,
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    chargers.find((c) => c.isEmulated)?.id || chargers[0]?.id || 'CHG-101'
  );
  const [selectedPort, setSelectedPort] = useState<number>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);

  const selectedStation = chargers.find((c) => c.id === selectedStationId) || chargers[0];

  const wssEndpoint = `wss://cpms.u-charge.io/ocpp/ws/${selectedStation?.siteId || 'site-houston-03'}/${selectedStation?.id || 'CHG-101'}`;
  const authToken = `Bearer uc_sec_live_9941a8e990c0b2f81`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const triggerEvent = (
    eventType:
      | 'PlugInPreparing'
      | 'StartCharging'
      | 'FinishCharge'
      | 'UnplugAvailable'
      | 'InjectGroundFault'
      | 'TriggerEStop'
      | 'SimulateOfflineLag'
      | 'RestoreNormal',
    label: string
  ) => {
    onSimulateEvent(selectedStationId, selectedPort, eventType);
    setLastActionFeedback(`Triggered: ${label} on ${selectedStationId} Port ${selectedPort}`);
    setTimeout(() => setLastActionFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Intro Header */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            OCPP Gateway Connection & Hardware Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect external chargers (via WSS WebSocket) or inject simulated hardware faults into the fleet.
          </p>
        </div>

        {lastActionFeedback && (
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-mono font-medium animate-in fade-in">
            {lastActionFeedback}
          </span>
        )}
      </div>

      {/* Connection Quick-Config Bar (OCPP Gateways) */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-600" />
            OCPP Gateway Connection Quick-Config
          </h3>
          <span className="text-[11px] font-mono text-slate-500 font-medium">
            Protocols: OCPP 1.6-J & OCPP 2.0.1
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* WebSocket WSS URL */}
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              WebSocket (WSS) Central System Endpoint
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={wssEndpoint}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-cyan-800 font-semibold select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(wssEndpoint, 'wss')}
                className="btn-3d btn-3d-white px-3 py-2 text-slate-800 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'wss' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'wss' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Credentials grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">Charge Point Identity (stationId)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={selectedStation?.id || 'CHG-101'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 font-bold select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(selectedStation?.id || '', 'id')}
                  className="btn-3d btn-3d-white p-2 text-slate-800"
                >
                  {copiedKey === 'id' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">Authorization Key (HTTP Basic / Bearer)</label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={authToken}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(authToken, 'auth')}
                  className="btn-3d btn-3d-white p-2 text-slate-800"
                >
                  {copiedKey === 'auth' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulator & Fault Injection Suite */}
      <div className="p-5 rounded-xl bg-white border border-purple-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              Interactive Hardware Simulator & Fault Injection Suite
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly test how the CPMS telemetry, alarms, and OCPP log handle real-world operational states.
            </p>
          </div>
        </div>

        {/* Station and Port Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Target Station for Simulation</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:border-purple-500"
            >
              {chargers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} • {c.name} {c.isEmulated ? '[EMULATED]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Select Port</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPort(1)}
                className={`btn-3d flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedPort === 1
                    ? 'btn-3d-purple text-white'
                    : 'btn-3d-white text-slate-700'
                }`}
              >
                Port 1
              </button>
              <button
                type="button"
                onClick={() => setSelectedPort(2)}
                className={`btn-3d flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedPort === 2
                    ? 'btn-3d-purple text-white'
                    : 'btn-3d-white text-slate-700'
                }`}
              >
                Port 2
              </button>
            </div>
          </div>
        </div>

        {/* Action Grid: Normal Life Cycle Events */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            1. Normal Session Lifecycle Emulation
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              id="sim-plugin-btn"
              onClick={() => triggerEvent('PlugInPreparing', 'Vehicle Plug-in (Preparing)')}
              className="btn-3d btn-3d-amber p-3 rounded-xl text-left text-xs"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-white" />
                <span>1. Plug In Cable</span>
              </div>
              <p className="text-[10px] text-amber-100 mt-1">Status → Preparing (Auth Pending)</p>
            </button>

            <button
              type="button"
              id="sim-start-btn"
              onClick={() => triggerEvent('StartCharging', 'Start High-kW Charging')}
              className="btn-3d btn-3d-cyan p-3 rounded-xl text-left text-xs"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <Play className="w-4 h-4 fill-current text-white" />
                <span>2. Start Charge</span>
              </div>
              <p className="text-[10px] text-cyan-100 mt-1">Contactors close, kW flows</p>
            </button>

            <button
              type="button"
              id="sim-finish-btn"
              onClick={() => triggerEvent('FinishCharge', '100% Battery Full (Finishing)')}
              className="btn-3d btn-3d-purple p-3 rounded-xl text-left text-xs"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>3. Battery 100%</span>
              </div>
              <p className="text-[10px] text-purple-100 mt-1">Status → Finishing (Grace Period)</p>
            </button>

            <button
              type="button"
              id="sim-unplug-btn"
              onClick={() => triggerEvent('UnplugAvailable', 'Unplug Cable (Available)')}
              className="btn-3d btn-3d-emerald p-3 rounded-xl text-left text-xs"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-white" />
                <span>4. Unplug Cable</span>
              </div>
              <p className="text-[10px] text-emerald-100 mt-1">Status → Available</p>
            </button>
          </div>
        </div>

        {/* Action Grid: Critical Fault Injection */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            2. Safety Interlocks & Fault Injection Testing
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              id="sim-ground-fault-btn"
              onClick={() => triggerEvent('InjectGroundFault', 'Ground Fault Isolation Trip')}
              className="btn-3d btn-3d-rose p-3 rounded-xl text-left text-xs"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-white" />
                <span>Ground Fault</span>
              </div>
              <p className="text-[10px] text-rose-100 mt-1">DC isolation &lt; 500kΩ, trip</p>
            </button>

            <button
              type="button"
              id="sim-estop-btn"
              onClick={() => triggerEvent('TriggerEStop', 'Emergency Stop Button Tripped')}
              className="btn-3d btn-3d-rose p-3 rounded-xl text-left text-xs"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-white" />
                <span>Trip E-Stop</span>
              </div>
              <p className="text-[10px] text-rose-100 mt-1">Physical safety button trip</p>
            </button>

            <button
              type="button"
              id="sim-offline-btn"
              onClick={() => triggerEvent('SimulateOfflineLag', 'Simulate Heartbeat Lag')}
              className="btn-3d btn-3d-white p-3 rounded-xl text-left text-xs text-slate-800"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-600" />
                <span>Lag / Offline</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Heartbeat delay &gt; 120s</p>
            </button>

            <button
              type="button"
              id="sim-restore-btn"
              onClick={() => triggerEvent('RestoreNormal', 'Clear Faults & Restore Station')}
              className="btn-3d btn-3d-white p-3 rounded-xl text-left text-xs text-slate-900"
            >
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-cyan-600" />
                <span>Restore Clean</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Reset faults, contactor ready</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
