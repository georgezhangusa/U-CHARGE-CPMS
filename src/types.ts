export type ConnectorType = 'CCS1' | 'NACS' | 'J1772' | 'CHAdeMO';

export type PortStatus =
  | 'Available'
  | 'Preparing'
  | 'Charging'
  | 'SuspendedEV'
  | 'SuspendedSystem'
  | 'Finishing'
  | 'Faulted'
  | 'Offline'
  | 'Maintenance'
  | 'Reserved';

export interface Connector {
  id: string;
  evseId: string;
  portNumber: number;
  type: ConnectorType;
  maxPowerKw: number;
  status: PortStatus;
  currentPowerKw: number;
  voltageV: number;
  currentA: number;
  currentSoc?: number;
  targetSoc?: number;
  timeTo80Min?: number;
  etaFullMin?: number;
  activeSessionId?: string;
  cableLocked: boolean;
  lockoutReason?: string; // e.g., "Locked out by Port 1 power priority"
}

export interface EVSE {
  id: string;
  evseNumber: number;
  maxPowerKw: number;
  currentLoadKw: number;
  connectors: Connector[];
  isMutuallyExclusive: boolean; // if true, only 1 connector can charge at a time
}

export interface HardwareHealth {
  contactor: 'Closed' | 'Open';
  cabinetTempC: number;
  eStop: 'OK' | 'Triggered';
  groundFault: 'Clear' | 'Tripped';
  gunLock: 'Engaged' | 'Unlocked' | 'Error';
  lastError: string;
  lastErrorCode: string;
  firmwareVersion: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  model: string;
  vendor: string;
  siteId: string;
  siteName: string;
  type: 'DCFC' | 'AC_L2';
  totalCapacityKw: number;
  currentLoadKw: number;
  isSimultaneous: boolean; // Dynamic power sharing across ports
  isEmulated: boolean;
  wsStatus: 'connected' | 'lag' | 'disconnected';
  lastHeartbeatSecondsAgo: number;
  evses: EVSE[];
  health: HardwareHealth;
  ocppVersion: '1.6-J' | '2.0.1';
  ipAddress: string;
}

export type OcppDirection = 'CP_TO_CS' | 'CS_TO_CP';

export interface OcppMessage {
  id: string;
  timestamp: string;
  stationId: string;
  direction: OcppDirection;
  action: string;
  messageTypeId: number; // 2=Call, 3=CallResult, 4=CallError
  payload: Record<string, unknown>;
}

export type StopReason =
  | 'Local'
  | 'Remote'
  | 'EVDisconnected'
  | 'GroundFailure'
  | 'EmergencyStop'
  | 'PowerLoss'
  | 'Timeout';

export interface Session {
  id: string;
  stationId: string;
  stationName: string;
  evseId: string;
  portNumber: number;
  connectorType: ConnectorType;
  siteId: string;
  siteName: string;
  userTag: string;
  authMethod: 'RFID' | 'App' | 'OperatorOverride' | 'AutoCharge';
  vehicleModel?: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  energyKwh: number;
  currentKw: number;
  peakKw: number;
  status: 'active' | 'completed';
  stopReason?: StopReason;
  costTotal: number;
  costBreakdown: {
    energyFee: number;
    timeFee: number;
    idleFee: number;
  };
  socStart?: number;
  socCurrent?: number;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  transformerLimitKw: number;
  currentLoadKw: number;
  peakDemandKw24h: number;
  totalChargers: number;
  activeSessionsCount: number;
  offlineCount: number;
  todayRevenue: number;
  todayEnergyKwh: number;
}

export interface ToUPeriod {
  name: string;
  hours: string;
  ratePerKwh: number;
  isCurrent?: boolean;
}

export interface TariffProfile {
  type: 'DCFC' | 'AC_L2';
  title: string;
  baseRatePerKwh: number;
  touPeriods: ToUPeriod[];
  idleFeePerMin: number;
  gracePeriodMinutes: number;
  connectionFee: number;
}

export interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  targetTab: 'home' | 'chargers' | 'sessions' | 'sites' | 'pricing' | 'settings';
  targetStationId?: string;
  targetSiteId?: string;
  filterStatus?: PortStatus;
}
