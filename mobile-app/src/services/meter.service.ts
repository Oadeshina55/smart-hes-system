import apiService from './api';
import {
  Meter,
  BalanceInfo,
  ConsumptionTrend,
  TokenLoadResult,
} from '../types/meter.types';
import {
  ApiResponse,
  LinkMeterRequest,
  LoadTokenRequest,
  ConsumptionTrendRequest,
} from '../types/api.types';

class MeterService {
  /**
   * Get all meters linked to customer
   */
  async getMyMeters(): Promise<ApiResponse<Meter[]>> {
    return await apiService.get<ApiResponse<Meter[]>>('/mobile/my-meters');
  }

  /**
   * Get meter details by ID
   */
  async getMeterDetails(meterId: string): Promise<ApiResponse<Meter>> {
    return await apiService.get<ApiResponse<Meter>>(`/mobile/meter/${meterId}`);
  }

  /**
   * Link meter to customer account
   */
  async linkMeter(data: LinkMeterRequest): Promise<ApiResponse<Meter>> {
    return await apiService.post<ApiResponse<Meter>>('/mobile/link-meter', data);
  }

  /**
   * Get meter balance
   */
  async getBalance(meterId: string): Promise<ApiResponse<BalanceInfo>> {
    return await apiService.get<ApiResponse<BalanceInfo>>(`/mobile/balance/${meterId}`);
  }

  /**
   * Get consumption trend
   */
  async getConsumptionTrend(
    meterId: string,
    params?: ConsumptionTrendRequest
  ): Promise<ApiResponse<ConsumptionTrend>> {
    return await apiService.get<ApiResponse<ConsumptionTrend>>(
      `/mobile/consumption-trend/${meterId}`,
      params
    );
  }

  /**
   * Load token to meter
   */
  async loadToken(data: LoadTokenRequest): Promise<ApiResponse<TokenLoadResult>> {
    return await apiService.post<ApiResponse<TokenLoadResult>>('/mobile/load-token', data);
  }
}

export const meterService = new MeterService();
export default meterService;
