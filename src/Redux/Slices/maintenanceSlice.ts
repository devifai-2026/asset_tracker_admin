import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  maintenanceApi,
  MaintenanceItem,
  MaintenanceDetail,
  AcceptMaintenancePayload,
} from '../../api/maintenanceApi';
import { RootState } from '../store';

interface MaintenanceState {
  list: MaintenanceItem[];
  currentDetail: MaintenanceDetail | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  detailError: string | null;
  lastFetched: number | null;
}

const initialState: MaintenanceState = {
  list: [],
  currentDetail: null,
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  lastFetched: null,
};



// Async thunk for fetching maintenance list
export const fetchMaintenanceList = createAsyncThunk(
  'maintenance/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await maintenanceApi.getOwnMaintenanceList();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch maintenance data',
      );
    }
  },
);

// Async thunk for fetching maintenance detail by ID
export const fetchMaintenanceDetail = createAsyncThunk(
  'maintenance/fetchDetail',
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const response = await maintenanceApi.getMaintenanceById(maintenanceId);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch maintenance details',
      );
    }
  },
);

// Async thunk for accepting/rejecting maintenance
export const acceptMaintenance = createAsyncThunk(
  'maintenance/acceptMaintenance',
  async (payload: AcceptMaintenancePayload, { rejectWithValue }) => {
    try {
      const response = await maintenanceApi.acceptMaintenance(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update maintenance status',
      );
    }
  },
);

export const fetchAllMaintenance = createAsyncThunk(
  'maintenance/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await maintenanceApi.getAllMaintenance();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch all maintenance data',
      );
    }
  },
);

export const fetchMaintenanceDetailNew = createAsyncThunk(
  'maintenance/fetchDetailNew',
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const response = await maintenanceApi.getMaintenanceByIdNew(
        maintenanceId,
      );
      console.log("Fetched Maintenance Detail New::::::::::::::", response);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch maintenance details',
      );
    }
  },
);


const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    clearMaintenanceError: state => {
      state.error = null;
      state.detailError = null;
    },
    updateMaintenanceItem: (state, action: PayloadAction<MaintenanceItem>) => {
      const index = state.list.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    addMaintenanceItem: (state, action: PayloadAction<MaintenanceItem>) => {
      state.list.unshift(action.payload);
    },
    clearMaintenanceData: state => {
      state.list = [];
      state.currentDetail = null;
      state.loading = false;
      state.detailLoading = false;
      state.error = null;
      state.detailError = null;
      state.lastFetched = null;
    },
    clearCurrentDetail: state => {
      state.currentDetail = null;
      state.detailError = null;
    },
  },
  extraReducers: builder => {
    builder
      // List fetching
      .addCase(fetchMaintenanceList.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceList.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchMaintenanceList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Detail fetching
      .addCase(fetchMaintenanceDetail.pending, state => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchMaintenanceDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentDetail = action.payload.data;
        state.detailError = null;
      })
      .addCase(fetchMaintenanceDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(acceptMaintenance.pending, state => {
        state.detailLoading = true;
      })
      .addCase(acceptMaintenance.fulfilled, (state, action) => {
        state.detailLoading = false;
        if (state.currentDetail) {
          state.currentDetail.is_accepeted = action.meta.arg.is_accepeted;
        }
      })
      .addCase(acceptMaintenance.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(fetchAllMaintenance.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchAllMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMaintenanceDetailNew.pending, state => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchMaintenanceDetailNew.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentDetail = action.payload;
        state.detailError = null;
      })
      .addCase(fetchMaintenanceDetailNew.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      });
  },
});

export const {
  clearMaintenanceError,
  updateMaintenanceItem,
  addMaintenanceItem,
  clearMaintenanceData,
  clearCurrentDetail,
} = maintenanceSlice.actions;

// Selectors
export const selectMaintenanceList = (state: RootState) =>
  state.maintenance.list;
export const selectMaintenanceDetail = (state: RootState) =>
  state.maintenance.currentDetail;
export const selectMaintenanceLoading = (state: RootState) =>
  state.maintenance.loading;
export const selectMaintenanceDetailLoading = (state: RootState) =>
  state.maintenance.detailLoading;
export const selectMaintenanceError = (state: RootState) =>
  state.maintenance.error;
export const selectMaintenanceDetailError = (state: RootState) =>
  state.maintenance.detailError;
export const selectMaintenanceLastFetched = (state: RootState) =>
  state.maintenance.lastFetched;
export const selectMaintenanceDetailNew = (state: RootState) =>
  state.maintenance.currentDetail;
export const selectMaintenanceById = (state: RootState, id: string) =>
  state.maintenance.list.find(item => item.id === id);


export default maintenanceSlice.reducer;
