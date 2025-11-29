import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { meterService } from '../../services/meter.service';
import {
  Meter,
  BalanceInfo,
  ConsumptionTrend,
  TokenLoadResult,
} from '../../types/meter.types';
import { LinkMeterRequest, LoadTokenRequest, ConsumptionTrendRequest } from '../../types/api.types';

interface MeterState {
  meters: Meter[];
  selectedMeter: Meter | null;
  balance: BalanceInfo | null;
  consumptionTrend: ConsumptionTrend | null;
  loading: boolean;
  loadingBalance: boolean;
  loadingConsumption: boolean;
  loadingToken: boolean;
  error: string | null;
  tokenLoadResult: TokenLoadResult | null;
}

const initialState: MeterState = {
  meters: [],
  selectedMeter: null,
  balance: null,
  consumptionTrend: null,
  loading: false,
  loadingBalance: false,
  loadingConsumption: false,
  loadingToken: false,
  error: null,
  tokenLoadResult: null,
};

// Async thunks
export const fetchMyMeters = createAsyncThunk(
  'meters/fetchMyMeters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await meterService.getMyMeters();
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMeterDetails = createAsyncThunk(
  'meters/fetchMeterDetails',
  async (meterId: string, { rejectWithValue }) => {
    try {
      const response = await meterService.getMeterDetails(meterId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const linkMeter = createAsyncThunk(
  'meters/linkMeter',
  async (data: LinkMeterRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await meterService.linkMeter(data);

      // Refresh meters list
      dispatch(fetchMyMeters());

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBalance = createAsyncThunk(
  'meters/fetchBalance',
  async (meterId: string, { rejectWithValue }) => {
    try {
      const response = await meterService.getBalance(meterId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchConsumptionTrend = createAsyncThunk(
  'meters/fetchConsumptionTrend',
  async (
    { meterId, params }: { meterId: string; params?: ConsumptionTrendRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await meterService.getConsumptionTrend(meterId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadToken = createAsyncThunk(
  'meters/loadToken',
  async (data: LoadTokenRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await meterService.loadToken(data);

      // Refresh balance
      dispatch(fetchBalance(data.meterId));

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const meterSlice = createSlice({
  name: 'meters',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedMeter: (state, action: PayloadAction<Meter | null>) => {
      state.selectedMeter = action.payload;
    },
    clearTokenLoadResult: (state) => {
      state.tokenLoadResult = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch my meters
    builder
      .addCase(fetchMyMeters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyMeters.fulfilled, (state, action) => {
        state.loading = false;
        state.meters = action.payload;
      })
      .addCase(fetchMyMeters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch meter details
    builder
      .addCase(fetchMeterDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeterDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedMeter = action.payload;
      })
      .addCase(fetchMeterDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Link meter
    builder
      .addCase(linkMeter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(linkMeter.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(linkMeter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch balance
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.loadingBalance = true;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.loadingBalance = false;
        state.balance = action.payload;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loadingBalance = false;
        state.error = action.payload as string;
      });

    // Fetch consumption trend
    builder
      .addCase(fetchConsumptionTrend.pending, (state) => {
        state.loadingConsumption = true;
      })
      .addCase(fetchConsumptionTrend.fulfilled, (state, action) => {
        state.loadingConsumption = false;
        state.consumptionTrend = action.payload;
      })
      .addCase(fetchConsumptionTrend.rejected, (state, action) => {
        state.loadingConsumption = false;
        state.error = action.payload as string;
      });

    // Load token
    builder
      .addCase(loadToken.pending, (state) => {
        state.loadingToken = true;
        state.error = null;
        state.tokenLoadResult = null;
      })
      .addCase(loadToken.fulfilled, (state, action) => {
        state.loadingToken = false;
        state.tokenLoadResult = action.payload;
      })
      .addCase(loadToken.rejected, (state, action) => {
        state.loadingToken = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedMeter, clearTokenLoadResult } = meterSlice.actions;
export default meterSlice.reducer;
