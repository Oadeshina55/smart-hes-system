// OBIS Code Mappings for DLMS/COSEM
// Format: Class.Channel.Value.Measurement.Rate.Billing

export interface OBISCode {
  code: string;
  name: string;
  category: string;
  unit?: string;
  writable?: boolean;
  description?: string;
}

export const OBIS_CODES: Record<string, OBISCode> = {
  // Information
  'METER_SERIAL': { code: '0.0.96.1.0.255', name: 'Meter Serial Number', category: 'Information', writable: false },
  'DEVICE_ID1': { code: '0.0.96.1.1.255', name: 'Device ID 1', category: 'Information', writable: false },
  'DEVICE_ID2': { code: '0.0.96.1.2.255', name: 'Device ID 2', category: 'Information', writable: false },
  'FIRMWARE_VERSION': { code: '1.0.0.2.0.255', name: 'Firmware Version', category: 'Information', writable: false },
  'MANUFACTURER': { code: '0.0.96.1.7.255', name: 'Manufacturer', category: 'Information', writable: false },

  // Clock Settings
  'METER_CLOCK': { code: '0.0.1.0.0.255', name: 'Date & Time', category: 'Clock Settings', writable: true, description: 'Current meter date and time' },
  'DST_ENABLED': { code: '0.0.131.0.0.255', name: 'DST Enabled', category: 'Clock Settings', writable: true, description: 'Daylight Saving Time enabled/disabled' },
  'DST_BEGIN': { code: '0.0.131.0.1.255', name: 'DST Begin Date', category: 'Clock Settings', writable: true, description: 'DST start date/time' },
  'DST_END': { code: '0.0.131.0.2.255', name: 'DST End Date', category: 'Clock Settings', writable: true, description: 'DST end date/time' },
  'TIME_ZONE': { code: '0.0.131.0.4.255', name: 'Time Zone Offset', category: 'Clock Settings', writable: true, unit: 'minutes', description: 'UTC offset in minutes' },

  // Energy Registers
  'TOTAL_ACTIVE_ENERGY_IMPORT': { code: '1.0.1.8.0.255', name: 'Total Active Energy Import', category: 'Energy', unit: 'kWh', writable: false },
  'TOTAL_ACTIVE_ENERGY_EXPORT': { code: '1.0.2.8.0.255', name: 'Total Active Energy Export', category: 'Energy', unit: 'kWh', writable: false },
  'TOTAL_REACTIVE_ENERGY_IMPORT': { code: '1.0.3.8.0.255', name: 'Total Reactive Energy Import', category: 'Energy', unit: 'kvarh', writable: false },
  'TOTAL_REACTIVE_ENERGY_EXPORT': { code: '1.0.4.8.0.255', name: 'Total Reactive Energy Export', category: 'Energy', unit: 'kvarh', writable: false },
  'TOTAL_APPARENT_ENERGY_IMPORT': { code: '1.0.9.8.0.255', name: 'Total Apparent Energy Import', category: 'Energy', unit: 'kVAh', writable: false },

  // Demand (Maximum Demand)
  'MAX_DEMAND_ACTIVE': { code: '1.0.1.6.0.255', name: 'Maximum Demand Active', category: 'Demand', unit: 'kW', writable: false },
  'MAX_DEMAND_REACTIVE': { code: '1.0.3.6.0.255', name: 'Maximum Demand Reactive', category: 'Demand', unit: 'kvar', writable: false },
  'MAX_DEMAND_APPARENT': { code: '1.0.9.6.0.255', name: 'Maximum Demand Apparent', category: 'Demand', unit: 'kVA', writable: false },
  'CURRENT_DEMAND': { code: '1.0.1.4.0.255', name: 'Current Demand', category: 'Demand', unit: 'kW', writable: false },

  // Instantaneous Values
  'VOLTAGE_L1': { code: '1.0.32.7.0.255', name: 'Voltage L1', category: 'Instantaneous', unit: 'V', writable: false },
  'VOLTAGE_L2': { code: '1.0.52.7.0.255', name: 'Voltage L2', category: 'Instantaneous', unit: 'V', writable: false },
  'VOLTAGE_L3': { code: '1.0.72.7.0.255', name: 'Voltage L3', category: 'Instantaneous', unit: 'V', writable: false },
  'CURRENT_L1': { code: '1.0.31.7.0.255', name: 'Current L1', category: 'Instantaneous', unit: 'A', writable: false },
  'CURRENT_L2': { code: '1.0.51.7.0.255', name: 'Current L2', category: 'Instantaneous', unit: 'A', writable: false },
  'CURRENT_L3': { code: '1.0.71.7.0.255', name: 'Current L3', category: 'Instantaneous', unit: 'A', writable: false },
  'ACTIVE_POWER': { code: '1.0.1.7.0.255', name: 'Active Power', category: 'Instantaneous', unit: 'kW', writable: false },
  'REACTIVE_POWER': { code: '1.0.3.7.0.255', name: 'Reactive Power', category: 'Instantaneous', unit: 'kvar', writable: false },
  'APPARENT_POWER': { code: '1.0.9.7.0.255', name: 'Apparent Power', category: 'Instantaneous', unit: 'kVA', writable: false },
  'FREQUENCY': { code: '1.0.14.7.0.255', name: 'Frequency', category: 'Instantaneous', unit: 'Hz', writable: false },
  'POWER_FACTOR': { code: '1.0.13.7.0.255', name: 'Power Factor', category: 'Instantaneous', writable: false },

  // Status
  'METER_STATUS': { code: '0.0.96.5.0.255', name: 'Meter Status', category: 'Status', writable: false },
  'ALARM_REGISTER1': { code: '0.0.97.97.0.255', name: 'Alarm Register 1', category: 'Status', writable: false },
  'ALARM_REGISTER2': { code: '0.0.97.98.0.255', name: 'Alarm Register 2', category: 'Status', writable: false },
  'ERROR_REGISTER': { code: '0.0.97.97.1.255', name: 'Error Register', category: 'Status', writable: false },

  // Event Counter
  'EVENT_COUNTER_POWER_FAILURE': { code: '0.0.96.7.0.255', name: 'Power Failure Counter', category: 'Event Counter', writable: false },
  'EVENT_COUNTER_TAMPER': { code: '0.0.94.91.0.255', name: 'Tamper Event Counter', category: 'Event Counter', writable: true, description: 'Can be reset' },
  'EVENT_COUNTER_VOLTAGE_SAG': { code: '0.0.96.7.9.255', name: 'Voltage Sag Counter', category: 'Event Counter', writable: false },
  'EVENT_COUNTER_VOLTAGE_SWELL': { code: '0.0.96.7.21.255', name: 'Voltage Swell Counter', category: 'Event Counter', writable: false },

  // Prepayment (for prepaid meters)
  'PREPAID_CREDIT': { code: '0.0.19.10.0.255', name: 'Remaining Credit', category: 'Prepayment', unit: 'currency', writable: false },
  'PREPAID_EMERGENCY_CREDIT': { code: '0.0.19.11.0.255', name: 'Emergency Credit Available', category: 'Prepayment', unit: 'currency', writable: false },
  'PREPAID_TOTAL_CREDIT_PURCHASED': { code: '0.0.19.12.0.255', name: 'Total Credit Purchased', category: 'Prepayment', unit: 'currency', writable: false },

  // Relay Control
  'RELAY_STATUS': { code: '0.0.96.3.10.255', name: 'Relay Status', category: 'Relay Control', writable: false, description: 'Connected/Disconnected' },
  'RELAY_CONTROL': { code: '0.0.96.3.10.255', name: 'Relay Control', category: 'Relay Control', writable: true, description: 'Control relay state (0=Disconnect, 1=Connect)' },
  'RELAY_CONTROL_MODE': { code: '0.0.96.3.11.255', name: 'Relay Control Mode', category: 'Relay Control', writable: true, description: 'Control mode (0=Auto, 1=Manual)' },
  'RELAY_OPERATION_REASON': { code: '0.0.96.3.12.255', name: 'Relay Operation Reason', category: 'Relay Control', writable: false },
  'RELAY_CONTROL_STATUS': { code: '0.0.96.3.13.255', name: 'Relay Control Status', category: 'Relay Control', writable: false },

  // Load Limit Settings
  'LOAD_LIMIT_THRESHOLD': { code: '0.0.17.0.0.255', name: 'Load Limit Threshold', category: 'Load Limit', writable: true, unit: 'kW', description: 'Maximum power threshold before disconnect' },
  'LOAD_LIMIT_MIN_OVER_THRESHOLD_DURATION': { code: '0.0.17.1.0.255', name: 'Min Over Threshold Duration', category: 'Load Limit', writable: true, unit: 'seconds', description: 'Minimum time over threshold before action' },
  'LOAD_LIMIT_MIN_UNDER_THRESHOLD_DURATION': { code: '0.0.17.2.0.255', name: 'Min Under Threshold Duration', category: 'Load Limit', writable: true, unit: 'seconds', description: 'Minimum time under threshold before reconnect' },
  'LOAD_LIMIT_EMERGENCY_THRESHOLD': { code: '0.0.17.3.0.255', name: 'Emergency Threshold', category: 'Load Limit', writable: true, unit: 'kW', description: 'Emergency power limit' },

  // Tariff Configuration
  'TARIFF_PROGRAM_ID': { code: '0.0.11.0.0.255', name: 'Tariff Program ID', category: 'Tariff Settings', writable: true, description: 'Active tariff program identifier' },
  'TARIFF_ACTIVATION_DATE': { code: '0.0.11.1.0.255', name: 'Tariff Activation Date', category: 'Tariff Settings', writable: true, description: 'Date when tariff becomes active' },
  'TOU_TARIFF_T1_RATE': { code: '0.0.11.2.1.255', name: 'Tariff 1 Rate', category: 'Tariff Settings', writable: true, unit: 'currency/kWh', description: 'Rate for Tariff 1' },
  'TOU_TARIFF_T2_RATE': { code: '0.0.11.2.2.255', name: 'Tariff 2 Rate', category: 'Tariff Settings', writable: true, unit: 'currency/kWh', description: 'Rate for Tariff 2' },
  'TOU_TARIFF_T3_RATE': { code: '0.0.11.2.3.255', name: 'Tariff 3 Rate', category: 'Tariff Settings', writable: true, unit: 'currency/kWh', description: 'Rate for Tariff 3' },
  'TOU_TARIFF_T4_RATE': { code: '0.0.11.2.4.255', name: 'Tariff 4 Rate', category: 'Tariff Settings', writable: true, unit: 'currency/kWh', description: 'Rate for Tariff 4' },

  // Display Settings
  'DISPLAY_SCROLL_DELAY': { code: '0.0.96.52.0.255', name: 'Display Scroll Delay', category: 'Display Settings', writable: true, unit: 'seconds', description: 'Time between display scrolls' },
  'DISPLAY_BACKLIGHT_DURATION': { code: '0.0.96.52.1.255', name: 'Backlight Duration', category: 'Display Settings', writable: true, unit: 'seconds', description: 'LCD backlight on duration' },
  'DISPLAY_CONTRAST': { code: '0.0.96.52.2.255', name: 'Display Contrast', category: 'Display Settings', writable: true, description: 'LCD contrast level (0-100)' },

  // Communication Settings
  'COMM_BAUD_RATE': { code: '0.0.96.12.0.255', name: 'Communication Baud Rate', category: 'Communication', writable: true, unit: 'bps', description: 'Serial port baud rate' },
  'COMM_IP_ADDRESS': { code: '0.0.25.1.0.255', name: 'IP Address', category: 'Communication', writable: true, description: 'Meter IP address for TCP/IP' },
  'COMM_SUBNET_MASK': { code: '0.0.25.2.0.255', name: 'Subnet Mask', category: 'Communication', writable: true, description: 'Network subnet mask' },
  'COMM_GATEWAY': { code: '0.0.25.3.0.255', name: 'Default Gateway', category: 'Communication', writable: true, description: 'Network default gateway' },
  'COMM_PORT': { code: '0.0.25.4.0.255', name: 'Communication Port', category: 'Communication', writable: true, description: 'TCP port number' },

  // Security Settings
  'PASSWORD_LL': { code: '0.0.40.0.0.255', name: 'Low Level Password', category: 'Security', writable: true, description: 'Low level security password' },
  'PASSWORD_HL': { code: '0.0.40.0.1.255', name: 'High Level Password', category: 'Security', writable: true, description: 'High level security password' },
  'ENCRYPTION_KEY': { code: '0.0.40.0.2.255', name: 'Encryption Key', category: 'Security', writable: true, description: 'Communication encryption key' },
  'AUTHENTICATION_KEY': { code: '0.0.40.0.3.255', name: 'Authentication Key', category: 'Security', writable: true, description: 'HLS authentication key' },

  // Event Thresholds
  'VOLTAGE_THRESHOLD_LOW': { code: '0.0.96.7.25.255', name: 'Voltage Low Threshold', category: 'Event Thresholds', writable: true, unit: 'V', description: 'Minimum voltage before alarm' },
  'VOLTAGE_THRESHOLD_HIGH': { code: '0.0.96.7.26.255', name: 'Voltage High Threshold', category: 'Event Thresholds', writable: true, unit: 'V', description: 'Maximum voltage before alarm' },
  'CURRENT_THRESHOLD_HIGH': { code: '0.0.96.7.27.255', name: 'Current High Threshold', category: 'Event Thresholds', writable: true, unit: 'A', description: 'Maximum current before alarm' },
  'POWER_FACTOR_THRESHOLD_LOW': { code: '0.0.96.7.28.255', name: 'Power Factor Low Threshold', category: 'Event Thresholds', writable: true, description: 'Minimum power factor before alarm' },
  'FREQUENCY_THRESHOLD_LOW': { code: '0.0.96.7.29.255', name: 'Frequency Low Threshold', category: 'Event Thresholds', writable: true, unit: 'Hz', description: 'Minimum frequency' },
  'FREQUENCY_THRESHOLD_HIGH': { code: '0.0.96.7.30.255', name: 'Frequency High Threshold', category: 'Event Thresholds', writable: true, unit: 'Hz', description: 'Maximum frequency' },

  // Tariff Data
  'ACTIVE_TARIFF': { code: '0.0.96.14.0.255', name: 'Active Tariff', category: 'Tariff Data', writable: false },
  'TARIFF_T1_ENERGY': { code: '1.0.1.8.1.255', name: 'Tariff 1 Energy', category: 'Tariff Data', unit: 'kWh', writable: false },
  'TARIFF_T2_ENERGY': { code: '1.0.1.8.2.255', name: 'Tariff 2 Energy', category: 'Tariff Data', unit: 'kWh', writable: false },
  'TARIFF_T3_ENERGY': { code: '1.0.1.8.3.255', name: 'Tariff 3 Energy', category: 'Tariff Data', unit: 'kWh', writable: false },
  'TARIFF_T4_ENERGY': { code: '1.0.1.8.4.255', name: 'Tariff 4 Energy', category: 'Tariff Data', unit: 'kWh', writable: false },

  // Billing
  'BILLING_PERIOD_COUNTER': { code: '0.0.0.1.2.255', name: 'Billing Period Counter', category: 'Billing', writable: false },
  'BILLING_DATE': { code: '0.0.0.1.0.255', name: 'Last Billing Date', category: 'Billing', writable: false },

  // Tamper Detection
  'COVER_OPEN_STATUS': { code: '0.0.94.91.9.255', name: 'Cover Open Status', category: 'Tamper', writable: false },
  'MAGNETIC_TAMPER_STATUS': { code: '0.0.94.91.10.255', name: 'Magnetic Tamper Status', category: 'Tamper', writable: false },
  'REVERSE_FLOW_STATUS': { code: '0.0.94.91.11.255', name: 'Reverse Flow Status', category: 'Tamper', writable: false },
  'NEUTRAL_DISTURBANCE_STATUS': { code: '0.0.94.91.12.255', name: 'Neutral Disturbance Status', category: 'Tamper', writable: false },
};

export const OBIS_CATEGORIES = [
  'Information',
  'Clock Settings',
  'Energy',
  'Demand',
  'Instantaneous',
  'Status',
  'Event Counter',
  'Prepayment',
  'Relay Control',
  'Load Limit',
  'Tariff Settings',
  'Display Settings',
  'Communication',
  'Security',
  'Event Thresholds',
  'Tariff Data',
] as const;

export type OBISCategory = typeof OBIS_CATEGORIES[number];

export const getOBISByCategory = (category: OBISCategory): OBISCode[] => {
  return Object.values(OBIS_CODES).filter(obis => obis.category === category);
};

export const getOBISByCode = (code: string): OBISCode | undefined => {
  return Object.values(OBIS_CODES).find(obis => obis.code === code);
};

export const getOBISDescription = (code: string): string => {
  const obis = getOBISByCode(code);
  return obis ? obis.name : code;
};

export const getOBISUnit = (code: string): string => {
  const obis = getOBISByCode(code);
  return obis?.unit || '';
};

export const isOBISWritable = (code: string): boolean => {
  const obis = getOBISByCode(code);
  return obis?.writable || false;
};

export const getWritableOBISByCategory = (category: OBISCategory): OBISCode[] => {
  return getOBISByCategory(category).filter(obis => obis.writable);
};

export const getWritableCategories = (): OBISCategory[] => {
  const writableCategories: Set<OBISCategory> = new Set();
  Object.values(OBIS_CODES).forEach(obis => {
    if (obis.writable) {
      writableCategories.add(obis.category as OBISCategory);
    }
  });
  return Array.from(writableCategories);
};

// Common OBIS code groups for quick access
export const COMMON_OBIS_GROUPS = {
  ENERGY_REGISTERS: [
    '1.0.1.8.0.255', // Total Active Import
    '1.0.2.8.0.255', // Total Active Export
    '1.0.3.8.0.255', // Total Reactive Import
    '1.0.4.8.0.255', // Total Reactive Export
  ],
  INSTANTANEOUS: [
    '1.0.32.7.0.255', // Voltage L1
    '1.0.31.7.0.255', // Current L1
    '1.0.1.7.0.255',  // Active Power
    '1.0.14.7.0.255', // Frequency
    '1.0.13.7.0.255', // Power Factor
  ],
  RELAY_CONTROL: [
    '0.0.96.3.10.255', // Relay Status/Control
    '0.0.96.3.11.255', // Control Mode
    '0.0.96.3.12.255', // Operation Reason
  ],
  TAMPER: [
    '0.0.94.91.0.255',  // Tamper Counter
    '0.0.94.91.9.255',  // Cover Open
    '0.0.94.91.10.255', // Magnetic
    '0.0.94.91.11.255', // Reverse Flow
  ],
};

export default OBIS_CODES;
