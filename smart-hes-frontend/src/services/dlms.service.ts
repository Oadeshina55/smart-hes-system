import axios from 'axios';

export interface DlmsReadRequest {
  meterId?: string;
  meterNumber?: string;
  obisCode: string;
  classId?: number;
  attributeId?: number;
}

export interface DlmsWriteRequest {
  meterId?: string;
  meterNumber?: string;
  obisCode: string;
  value: any;
  classId?: number;
  attributeId?: number;
}

export interface DlmsReadMultipleRequest {
  meterId?: string;
  meterNumber?: string;
  obisCodes: Array<{
    code: string;
    classId?: number;
    attributeId?: number;
  }>;
}

export interface LoadProfileRequest {
  meterId?: string;
  meterNumber?: string;
  startDate?: Date;
  endDate?: Date;
}

class DlmsService {
  /**
   * Read a single OBIS code from a meter
   */
  async readObis(request: DlmsReadRequest): Promise<any> {
    try {
      const response = await axios.post('/api/dlms/read', request);
      return response.data;
    } catch (error: any) {
      console.error('DLMS read error:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to read from meter');
    }
  }

  /**
   * Read multiple OBIS codes from a meter
   */
  async readMultipleObis(request: DlmsReadMultipleRequest): Promise<any> {
    try {
      const response = await axios.post('/api/dlms/read-multiple', request);
      return response.data;
    } catch (error: any) {
      console.error('DLMS read multiple error:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to read from meter');
    }
  }

  /**
   * Write a value to an OBIS code on a meter
   */
  async writeObis(request: DlmsWriteRequest): Promise<any> {
    try {
      const response = await axios.post('/api/dlms/write', request);
      return response.data;
    } catch (error: any) {
      console.error('DLMS write error:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to write to meter');
    }
  }

  /**
   * Read load profile from a meter
   */
  async readLoadProfile(request: LoadProfileRequest): Promise<any> {
    try {
      const response = await axios.post('/api/dlms/load-profile', request);
      return response.data;
    } catch (error: any) {
      console.error('DLMS load profile error:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to read load profile');
    }
  }

  /**
   * Get common meter data (energy, voltage, current, power)
   */
  async getCommonMeterData(meterNumber: string): Promise<any> {
    try {
      const response = await axios.get(`/api/dlms/common-data/${encodeURIComponent(meterNumber)}`);
      return response.data;
    } catch (error: any) {
      console.error('DLMS common data error:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to get meter data');
    }
  }

  /**
   * Read meter time/clock
   */
  async readMeterTime(meterNumber: string): Promise<any> {
    try {
      const response = await axios.get(`/api/dlms/time/${encodeURIComponent(meterNumber)}`);
      return response.data;
    } catch (error: any) {
      console.error('DLMS read time error:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to read meter time');
    }
  }

  /**
   * Set meter time/clock
   */
  async setMeterTime(meterId: string | undefined, meterNumber: string | undefined, dateTime?: Date): Promise<any> {
    try {
      const response = await axios.post('/api/dlms/time', {
        meterId,
        meterNumber,
        dateTime: dateTime || new Date(),
      });
      return response.data;
    } catch (error: any) {
      console.error('DLMS set time error:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to set meter time');
    }
  }

  /**
   * Read all energy parameters for a meter
   */
  async readEnergyParameters(meterNumber: string, brand: 'hexing' | 'hexcell'): Promise<any> {
    // Common energy OBIS codes
    const energyCodes = [
      { code: '1-0:1.8.0.255', classId: 3, attributeId: 2 }, // Total Active Energy Import
      { code: '1-0:2.8.0.255', classId: 3, attributeId: 2 }, // Total Active Energy Export
      { code: '1-0:1.8.1.255', classId: 3, attributeId: 2 }, // Active Energy TOU 1
      { code: '1-0:1.8.2.255', classId: 3, attributeId: 2 }, // Active Energy TOU 2
      { code: '1-0:1.8.3.255', classId: 3, attributeId: 2 }, // Active Energy TOU 3
      { code: '1-0:1.8.4.255', classId: 3, attributeId: 2 }, // Active Energy TOU 4
      { code: '1-0:3.8.0.255', classId: 3, attributeId: 2 }, // Total Reactive Energy Import
      { code: '1-0:9.8.0.255', classId: 3, attributeId: 2 }, // Total Apparent Energy
    ];

    return this.readMultipleObis({
      meterNumber,
      obisCodes: energyCodes,
    });
  }

  /**
   * Read all instantaneous parameters for a meter
   */
  async readInstantaneousParameters(meterNumber: string, brand: 'hexing' | 'hexcell'): Promise<any> {
    // Common instantaneous OBIS codes
    const instantaneousCodes = [
      { code: '1-0:32.7.0.255', classId: 3, attributeId: 2 }, // Voltage L1
      { code: '1-0:52.7.0.255', classId: 3, attributeId: 2 }, // Voltage L2
      { code: '1-0:72.7.0.255', classId: 3, attributeId: 2 }, // Voltage L3
      { code: '1-0:31.7.0.255', classId: 3, attributeId: 2 }, // Current L1
      { code: '1-0:51.7.0.255', classId: 3, attributeId: 2 }, // Current L2
      { code: '1-0:71.7.0.255', classId: 3, attributeId: 2 }, // Current L3
      { code: '1-0:1.7.0.255', classId: 3, attributeId: 2 },  // Active Power Total
      { code: '1-0:13.7.0.255', classId: 3, attributeId: 2 }, // Power Factor Total
      { code: '1-0:14.7.0.255', classId: 3, attributeId: 2 }, // Frequency
    ];

    return this.readMultipleObis({
      meterNumber,
      obisCodes: instantaneousCodes,
    });
  }
}

export const dlmsService = new DlmsService();
