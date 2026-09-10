import { PortStatus, StopReason } from './types';

export function getStatusColor(status: PortStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  pulse?: boolean;
} {
  switch (status) {
    case 'Available':
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'Charging':
      return {
        bg: 'bg-cyan-50 text-cyan-700',
        text: 'text-cyan-700',
        border: 'border-cyan-300',
        dot: 'bg-cyan-500',
        pulse: true,
      };
    case 'Preparing':
      return {
        bg: 'bg-amber-50 text-amber-800',
        text: 'text-amber-800',
        border: 'border-amber-300',
        dot: 'bg-amber-500',
        pulse: true,
      };
    case 'SuspendedEV':
    case 'SuspendedSystem':
      return {
        bg: 'bg-indigo-50 text-indigo-700',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'Finishing':
      return {
        bg: 'bg-violet-50 text-violet-700',
        text: 'text-violet-700',
        border: 'border-violet-200',
        dot: 'bg-violet-500',
      };
    case 'Faulted':
      return {
        bg: 'bg-rose-50 text-rose-700',
        text: 'text-rose-700',
        border: 'border-rose-300',
        dot: 'bg-rose-600',
      };
    case 'Offline':
      return {
        bg: 'bg-slate-100 text-slate-600',
        text: 'text-slate-600',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      };
    case 'Maintenance':
      return {
        bg: 'bg-orange-50 text-orange-800',
        text: 'text-orange-800',
        border: 'border-orange-300',
        dot: 'bg-orange-500',
      };
    case 'Reserved':
      return {
        bg: 'bg-blue-50 text-blue-700',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-700',
        text: 'text-slate-700',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      };
  }
}

export function getStopReasonBadge(reason?: StopReason): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (reason) {
    case 'Local':
      return {
        label: 'Local (User Stopped)',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
      };
    case 'Remote':
      return {
        label: 'Remote (CPMS Command)',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'EVDisconnected':
      return {
        label: 'EV Disconnected',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
      };
    case 'GroundFailure':
      return {
        label: 'Ground Failure',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-300',
      };
    case 'EmergencyStop':
      return {
        label: 'Emergency Stop Tripped',
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
      };
    default:
      return {
        label: reason || 'Completed',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
      };
  }
}

export function formatKw(kw: number): string {
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(2)} MW`;
  }
  return `${kw.toFixed(1)} kW`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}
