import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { HomeOperationsView } from './components/HomeOperationsView';
import { ChargersFleetView } from './components/ChargersFleetView';
import { SessionsView } from './components/SessionsView';
import { SitesView } from './components/SitesView';
import { PricingView } from './components/PricingView';
import { SimulatorSettingsView } from './components/SimulatorSettingsView';
import { ChargerDetailDrawer } from './components/ChargerDetailDrawer';
import { DangerousActionModal } from './components/DangerousActionModal';
import { StartChargingModal } from './components/StartChargingModal';
import {
  INITIAL_CHARGERS,
  INITIAL_SITES,
  INITIAL_SESSIONS,
  INITIAL_ALERTS,
  INITIAL_OCPP_MESSAGES,
} from './data/mockData';
import {
  ChargingStation,
  Site,
  Session,
  SystemAlert,
  OcppMessage,
  PortStatus,
} from './types';

export default function App() {
  const [chargers, setChargers] = useState<ChargingStation[]>(INITIAL_CHARGERS);
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [ocppMessages, setOcppMessages] = useState<OcppMessage[]>(INITIAL_OCPP_MESSAGES);

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

  // Filters passed to ChargersFleetView
  const [chargersFilterStatus, setChargersFilterStatus] = useState<PortStatus | 'All'>('All');
  const [chargersSearchQuery, setChargersSearchQuery] = useState<string>('');

  // Modals
  const [dangerousModal, setDangerousModal] = useState<{
    isOpen: boolean;
    station: ChargingStation | null;
    actionType: 'HardReset' | 'StopCharging' | 'EmergencyTrip';
    portNumber?: number;
  }>({
    isOpen: false,
    station: null,
    actionType: 'HardReset',
  });

  const [startModal, setStartModal] = useState<{
    isOpen: boolean;
    station: ChargingStation | null;
    portNumber?: number;
  }>({
    isOpen: false,
    station: null,
    portNumber: 1,
  });

  // Keep selectedStation synced with state
  useEffect(() => {
    if (selectedStation) {
      const updated = chargers.find((c) => c.id === selectedStation.id);
      if (updated) {
        setSelectedStation(updated);
      }
    }
  }, [chargers]);

  // Periodic heartbeat freshness simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setChargers((prev) =>
        prev.map((c) => {
          if (c.wsStatus === 'disconnected') return c;
          if (c.wsStatus === 'lag') {
            return {
              ...c,
              lastHeartbeatSecondsAgo: c.lastHeartbeatSecondsAgo + 2,
            };
          }
          // Normal heartbeat loop
          const newSeconds = c.lastHeartbeatSecondsAgo >= 12 ? 2 : c.lastHeartbeatSecondsAgo + 2;
          return {
            ...c,
            lastHeartbeatSecondsAgo: newSeconds,
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Helper to append OCPP message
  const logOcppMessage = useCallback(
    (
      stationId: string,
      direction: 'CP_TO_CS' | 'CS_TO_CP',
      action: string,
      payload: Record<string, unknown>
    ) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newMsg: OcppMessage = {
        id: `OCPP-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        stationId,
        direction,
        action,
        messageTypeId: direction === 'CP_TO_CS' ? 2 : 3,
        payload,
      };
      setOcppMessages((prev) => [newMsg, ...prev]);
    },
    []
  );

  // Triggering actions from Drawer
  const handleTriggerAction = (
    action: 'SoftReset' | 'HardReset' | 'StopCharging' | 'StartCharging' | 'UnlockCable' | 'ToggleMaintenance',
    portNumber: number = 1
  ) => {
    if (!selectedStation) return;

    if (action === 'HardReset') {
      setDangerousModal({
        isOpen: true,
        station: selectedStation,
        actionType: 'HardReset',
        portNumber,
      });
      return;
    }

    if (action === 'StopCharging') {
      setDangerousModal({
        isOpen: true,
        station: selectedStation,
        actionType: 'StopCharging',
        portNumber,
      });
      return;
    }

    if (action === 'StartCharging') {
      setStartModal({
        isOpen: true,
        station: selectedStation,
        portNumber,
      });
      return;
    }

    if (action === 'SoftReset') {
      logOcppMessage(selectedStation.id, 'CS_TO_CP', 'Reset', { type: 'Soft' });
      logOcppMessage(selectedStation.id, 'CP_TO_CS', 'ResetResponse', { status: 'Accepted' });
      alert(`Soft reset command issued to ${selectedStation.id}. Microcontroller restarted safely.`);
    }

    if (action === 'UnlockCable') {
      logOcppMessage(selectedStation.id, 'CS_TO_CP', 'UnlockConnector', {
        connectorId: portNumber,
      });
      logOcppMessage(selectedStation.id, 'CP_TO_CS', 'UnlockConnectorResponse', {
        status: 'Unlocked',
      });

      // Update state
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== selectedStation.id) return c;
          return {
            ...c,
            evses: c.evses.map((evse) => ({
              ...evse,
              connectors: evse.connectors.map((conn) => {
                if (conn.portNumber === portNumber) {
                  return { ...conn, cableLocked: false };
                }
                return conn;
              }),
            })),
          };
        })
      );
    }

    if (action === 'ToggleMaintenance') {
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== selectedStation.id) return c;
          const currentStatus = c.evses[0]?.connectors[0]?.status;
          const newStatus: PortStatus = currentStatus === 'Maintenance' ? 'Available' : 'Maintenance';
          return {
            ...c,
            evses: c.evses.map((evse) => ({
              ...evse,
              connectors: evse.connectors.map((conn) => ({
                ...conn,
                status: newStatus,
                currentPowerKw: 0,
              })),
            })),
          };
        })
      );
    }
  };

  // Execute Dangerous Action
  const handleExecuteDangerousAction = () => {
    if (!dangerousModal.station) return;
    const stationId = dangerousModal.station.id;
    const isHardReset = dangerousModal.actionType === 'HardReset';
    const isStop = dangerousModal.actionType === 'StopCharging';

    if (isHardReset) {
      logOcppMessage(stationId, 'CS_TO_CP', 'Reset', { type: 'Hard' });
      logOcppMessage(stationId, 'CP_TO_CS', 'ResetResponse', { status: 'Accepted' });
      logOcppMessage(stationId, 'CP_TO_CS', 'BootNotification', {
        chargePointModel: dangerousModal.station.model,
        chargePointVendor: dangerousModal.station.vendor,
        firmwareVersion: dangerousModal.station.health.firmwareVersion,
      });

      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            currentLoadKw: 0,
            health: {
              ...c.health,
              contactor: 'Open',
              lastError: 'NoError (Rebooted)',
              lastErrorCode: '0x00',
            },
            evses: c.evses.map((evse) => ({
              ...evse,
              currentLoadKw: 0,
              connectors: evse.connectors.map((conn) => ({
                ...conn,
                status: 'Available',
                currentPowerKw: 0,
                cableLocked: false,
                activeSessionId: undefined,
              })),
            })),
          };
        })
      );
    } else if (isStop) {
      logOcppMessage(stationId, 'CS_TO_CP', 'RemoteStopTransaction', {
        transactionId: 9821,
      });
      logOcppMessage(stationId, 'CP_TO_CS', 'StopTransaction', {
        idTag: 'REMOTE-STOP',
        reason: 'Remote',
        meterStop: 54200,
        timestamp: new Date().toISOString(),
      });

      // Mark sessions completed
      setSessions((prev) =>
        prev.map((s) => {
          if (s.stationId === stationId && s.status === 'active') {
            return {
              ...s,
              status: 'completed',
              stopReason: 'Remote',
              currentKw: 0,
            };
          }
          return s;
        })
      );

      // Free port to Finishing / Available
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            currentLoadKw: 0,
            health: { ...c.health, contactor: 'Open' },
            evses: c.evses.map((evse) => ({
              ...evse,
              currentLoadKw: 0,
              connectors: evse.connectors.map((conn) => ({
                ...conn,
                status: 'Finishing',
                currentPowerKw: 0,
              })),
            })),
          };
        })
      );
    }
  };

  // Remote Start Execution
  const handleExecuteStartCharging = (
    portNumber: number,
    authType: 'OperatorOverride' | 'RFID' | 'App',
    idTag: string,
    maxPowerKw?: number
  ) => {
    if (!startModal.station) return;
    const stationId = startModal.station.id;
    const powerKw = maxPowerKw || (startModal.station.type === 'DCFC' ? 180 : 11.5);

    logOcppMessage(stationId, 'CS_TO_CP', 'RemoteStartTransaction', {
      connectorId: portNumber,
      idTag,
      chargingProfile: {
        chargingProfilePurpose: 'TxDefaultProfile',
        limit: powerKw,
      },
    });
    logOcppMessage(stationId, 'CP_TO_CS', 'StartTransaction', {
      connectorId: portNumber,
      idTag,
      meterStart: 1200,
      timestamp: new Date().toISOString(),
    });

    const newSessionId = `SES-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create session
    const newSession: Session = {
      id: newSessionId,
      stationId,
      stationName: startModal.station.name,
      evseId: `EVSE-${stationId}-1`,
      portNumber,
      connectorType: startModal.station.evses[0]?.connectors[0]?.type || 'CCS1',
      siteId: startModal.station.siteId,
      siteName: startModal.station.siteName,
      userTag: idTag,
      authMethod: authType,
      vehicleModel: 'Connected EV',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 1,
      energyKwh: 1.2,
      currentKw: powerKw,
      peakKw: powerKw,
      status: 'active',
      costTotal: 0.59,
      costBreakdown: {
        energyFee: 0.59,
        timeFee: 0,
        idleFee: 0,
      },
      socStart: 20,
      socCurrent: 22,
    };

    setSessions((prev) => [newSession, ...prev]);

    // Update charger
    setChargers((prev) =>
      prev.map((c) => {
        if (c.id !== stationId) return c;
        return {
          ...c,
          currentLoadKw: powerKw,
          health: { ...c.health, contactor: 'Closed' },
          evses: c.evses.map((evse) => ({
            ...evse,
            connectors: evse.connectors.map((conn) => {
              if (conn.portNumber === portNumber) {
                return {
                  ...conn,
                  status: 'Charging',
                  currentPowerKw: powerKw,
                  cableLocked: true,
                  activeSessionId: newSessionId,
                  currentSoc: 22,
                  targetSoc: 80,
                  timeTo80Min: 18,
                  etaFullMin: 35,
                };
              }
              return conn;
            }),
          })),
        };
      })
    );
  };

  // Hardware Simulator Events
  const handleSimulateEvent = (
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
  ) => {
    if (eventType === 'PlugInPreparing') {
      logOcppMessage(stationId, 'CP_TO_CS', 'StatusNotification', {
        connectorId: portNumber,
        status: 'Preparing',
        errorCode: 'NoError',
        info: 'Vehicle plugged in, waiting for authorization',
      });
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            evses: c.evses.map((evse) => ({
              ...evse,
              connectors: evse.connectors.map((conn) => {
                if (conn.portNumber === portNumber) {
                  return { ...conn, status: 'Preparing', cableLocked: true, currentPowerKw: 0 };
                }
                return conn;
              }),
            })),
          };
        })
      );
    } else if (eventType === 'StartCharging') {
      handleExecuteStartCharging(portNumber, 'RFID', 'RFID-SIM-CARD-881', 190);
    } else if (eventType === 'FinishCharge') {
      logOcppMessage(stationId, 'CP_TO_CS', 'StatusNotification', {
        connectorId: portNumber,
        status: 'Finishing',
        errorCode: 'NoError',
        info: 'EV battery reported 100% SoC. DC contactors opened.',
      });
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            currentLoadKw: 0,
            health: { ...c.health, contactor: 'Open' },
            evses: c.evses.map((evse) => ({
              ...evse,
              connectors: evse.connectors.map((conn) => {
                if (conn.portNumber === portNumber) {
                  return {
                    ...conn,
                    status: 'Finishing',
                    currentPowerKw: 0,
                    currentSoc: 100,
                    targetSoc: 100,
                    timeTo80Min: 0,
                    etaFullMin: 0,
                  };
                }
                return conn;
              }),
            })),
          };
        })
      );
    } else if (eventType === 'UnplugAvailable') {
      logOcppMessage(stationId, 'CP_TO_CS', 'StatusNotification', {
        connectorId: portNumber,
        status: 'Available',
        errorCode: 'NoError',
        info: 'Cable returned to holster.',
      });
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            evses: c.evses.map((evse) => ({
              ...evse,
              connectors: evse.connectors.map((conn) => {
                if (conn.portNumber === portNumber) {
                  return {
                    ...conn,
                    status: 'Available',
                    currentPowerKw: 0,
                    cableLocked: false,
                    activeSessionId: undefined,
                    currentSoc: undefined,
                  };
                }
                return conn;
              }),
            })),
          };
        })
      );
    } else if (eventType === 'InjectGroundFault') {
      logOcppMessage(stationId, 'CP_TO_CS', 'StatusNotification', {
        connectorId: portNumber,
        status: 'Faulted',
        errorCode: 'GroundFailure',
        info: 'Isolation resistance < 500kΩ (Triggered via Injected Simulator Fault)',
      });
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            currentLoadKw: 0,
            health: {
              ...c.health,
              contactor: 'Open',
              groundFault: 'Tripped',
              lastError: 'GroundFailure: DC isolation fault tripped contactor',
              lastErrorCode: '0x04',
            },
            evses: c.evses.map((evse) => ({
              ...evse,
              connectors: evse.connectors.map((conn) => {
                if (conn.portNumber === portNumber) {
                  return {
                    ...conn,
                    status: 'Faulted',
                    currentPowerKw: 0,
                    cableLocked: false,
                  };
                }
                return conn;
              }),
            })),
          };
        })
      );
      // Add system alert
      setAlerts((prev) => [
        {
          id: `ALT-SIM-${Date.now()}`,
          severity: 'critical',
          title: `Ground Fault on ${stationId}`,
          description: `Isolation trip triggered on Port ${portNumber}. Contactors opened.`,
          timestamp: 'Just now',
          targetTab: 'chargers',
          targetStationId: stationId,
          filterStatus: 'Faulted',
        },
        ...prev,
      ]);
    } else if (eventType === 'TriggerEStop') {
      logOcppMessage(stationId, 'CP_TO_CS', 'StatusNotification', {
        connectorId: 0,
        status: 'Faulted',
        errorCode: 'EmergencyStop',
        info: 'Physical Emergency Stop button tripped on kiosk.',
      });
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            currentLoadKw: 0,
            health: {
              ...c.health,
              contactor: 'Open',
              eStop: 'Triggered',
              lastError: 'EmergencyStop: Physical safety circuit tripped',
              lastErrorCode: '0x0E',
            },
            evses: c.evses.map((evse) => ({
              ...evse,
              connectors: evse.connectors.map((conn) => ({
                ...conn,
                status: 'Faulted',
                currentPowerKw: 0,
                cableLocked: false,
              })),
            })),
          };
        })
      );
    } else if (eventType === 'SimulateOfflineLag') {
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            wsStatus: 'lag',
            lastHeartbeatSecondsAgo: 145,
            health: {
              ...c.health,
              lastError: 'HeartbeatLagTimeout: WebSocket response missing > 120s',
              lastErrorCode: '0x12',
            },
          };
        })
      );
    } else if (eventType === 'RestoreNormal') {
      logOcppMessage(stationId, 'CP_TO_CS', 'StatusNotification', {
        connectorId: 0,
        status: 'Available',
        errorCode: 'NoError',
        info: 'All faults cleared. Firmware self-test passed.',
      });
      setChargers((prev) =>
        prev.map((c) => {
          if (c.id !== stationId) return c;
          return {
            ...c,
            wsStatus: 'connected',
            lastHeartbeatSecondsAgo: 2,
            health: {
              ...c.health,
              contactor: 'Open',
              eStop: 'OK',
              groundFault: 'Clear',
              gunLock: 'Unlocked',
              lastError: 'NoError',
              lastErrorCode: '0x00',
            },
            evses: c.evses.map((evse) => ({
              ...evse,
              connectors: evse.connectors.map((conn) => ({
                ...conn,
                status: 'Available',
                currentPowerKw: 0,
                cableLocked: false,
              })),
            })),
          };
        })
      );
    }
  };

  const handleNavigateWithFilter = (
    tab: 'chargers' | 'sessions' | 'sites' | 'pricing' | 'settings',
    filter?: string
  ) => {
    setCurrentTab(tab);
    if (tab === 'chargers' && filter) {
      setChargersFilterStatus(filter as PortStatus);
    }
  };

  const emulatedCount = chargers.filter((c) => c.isEmulated).length;
  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical').length;
  const activeSessionsCount = sessions.filter((s) => s.status === 'active').length;
  const totalChargersFromSites = sites.reduce((sum, s) => sum + (s.totalChargers || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-100 selection:text-cyan-900">
      {/* Top Navigation */}
      <Navbar
        alertsCount={alerts.length}
        onOpenAlerts={() => setCurrentTab('home')}
        onOpenSimulator={() => setCurrentTab('settings')}
        emulatedCount={emulatedCount}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            if (tab === 'chargers') {
              setChargersFilterStatus('All');
              setChargersSearchQuery('');
            }
          }}
          chargersCount={totalChargersFromSites || chargers.length}
          activeSessionsCount={activeSessionsCount}
          criticalAlertsCount={criticalAlertsCount}
        />

        {/* View Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentTab === 'home' && (
            <HomeOperationsView
              chargers={chargers}
              sites={sites}
              sessions={sessions}
              alerts={alerts}
              onNavigateToTab={handleNavigateWithFilter}
              onSelectStation={(st) => setSelectedStation(st)}
              onOpenSimulator={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'chargers' && (
            <ChargersFleetView
              chargers={chargers}
              onSelectStation={(st) => setSelectedStation(st)}
              initialFilterStatus={chargersFilterStatus}
              initialSearchQuery={chargersSearchQuery}
            />
          )}

          {currentTab === 'sessions' && (
            <SessionsView
              sessions={sessions}
              onOpenStation={(stId) => {
                const target = chargers.find((c) => c.id === stId);
                if (target) setSelectedStation(target);
              }}
            />
          )}

          {currentTab === 'sites' && (
            <SitesView
              sites={sites}
              chargers={chargers}
              onOpenStation={(st) => setSelectedStation(st)}
              onNavigateToChargers={(siteId) => {
                setCurrentTab('chargers');
                const s = sites.find((x) => x.id === siteId);
                if (s) setChargersSearchQuery(s.name.slice(0, 7));
              }}
            />
          )}

          {currentTab === 'pricing' && <PricingView />}

          {currentTab === 'settings' && (
            <SimulatorSettingsView
              chargers={chargers}
              onSimulateEvent={handleSimulateEvent}
            />
          )}
        </main>
      </div>

      {/* Slide-out Contextual Charger Detail Drawer */}
      <ChargerDetailDrawer
        station={selectedStation}
        isOpen={!!selectedStation}
        onClose={() => setSelectedStation(null)}
        ocppMessages={ocppMessages}
        onTriggerAction={handleTriggerAction}
        onOpenSession={(sId) => {
          setSelectedStation(null);
          setCurrentTab('sessions');
        }}
      />

      {/* Dangerous Action Safety Confirmation Modal (Two-step confirmation) */}
      {dangerousModal.station && (
        <DangerousActionModal
          isOpen={dangerousModal.isOpen}
          onClose={() => setDangerousModal({ ...dangerousModal, isOpen: false })}
          station={dangerousModal.station}
          actionType={dangerousModal.actionType}
          portNumber={dangerousModal.portNumber}
          onConfirm={handleExecuteDangerousAction}
        />
      )}

      {/* Remote Start Charging Authorization Modal */}
      {startModal.station && (
        <StartChargingModal
          isOpen={startModal.isOpen}
          onClose={() => setStartModal({ ...startModal, isOpen: false })}
          station={startModal.station}
          selectedPortNumber={startModal.portNumber}
          onStart={handleExecuteStartCharging}
        />
      )}
    </div>
  );
}
