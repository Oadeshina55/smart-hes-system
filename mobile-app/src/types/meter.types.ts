export interface Meter {
  _id: string;
  meterNumber: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  meterType: 'single-phase' | 'three-phase';
  area?: Area;
  customer?: {
    _id: string;
    firstName: string;
    lastName: string;
    accountNumber: string;
    email: string;
    phoneNumber: string;
  };
  simCard?: {
    _id: string;
    iccid: string;
    phoneNumber: string;
    provider: string;
    status: string;
  };
  status: 'online' | 'offline' | 'inactive';
  relayStatus?: 'connected' | 'disconnected';
  lastCommunication?: string;
  currentReading: MeterReading;
  tariff?: Tariff;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

export interface MeterReading {
  totalEnergy: number;
  voltage?: number;
  current?: number;
  power?: number;
  powerFactor?: number;
  frequency?: number;
  timestamp: string;
}

export interface Tariff {
  _id: string;
  name: string;
  rate: number;
  currency: string;
}

export interface BalanceInfo {
  meterId: string;
  meterNumber: string;
  currentBalance: number;
  isLowBalance: boolean;
  lastUpdated: string;
}

export interface ConsumptionTrend {
  meterId: string;
  period: '24h' | '7d' | '30d' | '90d';
  dataPoints: ConsumptionDataPoint[];
  totalConsumption: number;
  averageConsumption: number;
  currentBalance: number;
}

export interface ConsumptionDataPoint {
  timestamp: string;
  energy: number;
  label: string;
}

export interface TokenLoadResult {
  success: boolean;
  message: string;
  meterNumber: string;
  amount?: number;
  newBalance?: number;
  timestamp: string;
}
