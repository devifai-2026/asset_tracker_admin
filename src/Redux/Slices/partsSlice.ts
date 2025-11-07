// Redux/Slices/partsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  partsApi,
  InventoryPart,
  PartRequest,
  PartRemoval,
  LocalPurchaseRequest,
} from '../../api/partsApi';
import {
  maintenanceApi,
  WalletPart,
  WalletResponse,
} from '../../api/maintenanceApi';
import { RootState } from '../store';
import { authClient } from '../../services/api.clients';
import { APIEndpoints } from '../../services/api.endpoints';

interface PartsState {
  walletParts: WalletPart[];
  inventoryParts: InventoryPart[];
  loading: boolean;
  walletLoading: boolean;
  inventoryLoading: boolean;
  requestLoading: boolean;
  removalLoading: boolean;
  localPurchaseLoading: boolean;
  error: string | null;
  walletError: string | null;
  inventoryError: string | null;
  requestError: string | null;
  removalError: string | null;
  localPurchaseError: string | null;
  lastFetched: number | null;
  assignLoading: boolean;
  assignError: string | null;
  inventoryAdminLoading: boolean;
  inventoryAdminError: string | null;
  inventoryAdminParts: InventoryPart[];
}

const initialState: PartsState = {
  walletParts: [],
  inventoryParts: [],
  loading: false,
  walletLoading: false,
  inventoryLoading: false,
  requestLoading: false,
  removalLoading: false,
  localPurchaseLoading: false,
  error: null,
  walletError: null,
  inventoryError: null,
  requestError: null,
  removalError: null,
  localPurchaseError: null,
  lastFetched: null,
  assignLoading: false,
  assignError: null,
  inventoryAdminLoading: false,
  inventoryAdminError: null,
  inventoryAdminParts: [],
};

// Async thunk for fetching wallet parts
export const fetchWalletParts = createAsyncThunk(
  'parts/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await maintenanceApi.getOwnWallet();
      console.log('API Response in thunk:', response);

      if (Array.isArray(response)) {
        return response;
      } else if (response && response.data) {
        return response.data;
      } else {
        return [];
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wallet parts',
      );
    }
  },
);

// Async thunk for fetching inventory parts
export const fetchInventoryParts = createAsyncThunk(
  'parts/fetchInventory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await partsApi.getAllInventoryParts();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch inventory parts',
      );
    }
  },
);

// Async thunk for requesting parts
export const requestParts = createAsyncThunk(
  'parts/requestParts',
  async (parts: PartRequest[], { rejectWithValue }) => {
    try {
      const response = await partsApi.requestParts(parts);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to request parts',
      );
    }
  },
);

// Async thunk for removing parts
export const removeParts = createAsyncThunk(
  'parts/removeParts',
  async (parts: PartRemoval[], { rejectWithValue }) => {
    try {
      const response = await partsApi.removeParts(parts);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove parts',
      );
    }
  },
);

export const entryPartToApprove = createAsyncThunk(
  'parts/entryPartToApprove',
  async (localPurchase: LocalPurchaseRequest, { rejectWithValue }) => {
    try {
      const response = await partsApi.entryPartToApprove(localPurchase);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit local purchase',
      );
    }
  },
);

export const assignParts = createAsyncThunk(
  'parts/assignParts',
  async (parts: any[], { rejectWithValue }) => {
    try {
      const response = await partsApi.assignParts(parts);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to assign parts',
      );
    }
  },
);

export const fetchInventoryPartsAdmin = createAsyncThunk(
  'parts/fetchInventoryAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await partsApi.getAllInventoryPartAdmin();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to fetch admin inventory parts',
      );
    }
  },
);

export const searchParts = createAsyncThunk(
  'parts/searchParts',
  async (searchQuery: string, { rejectWithValue }) => {
    try {
      const response = await authClient.get(APIEndpoints.searchParts, {
        params: { q: searchQuery },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const partsSlice = createSlice({
  name: 'parts',
  initialState,
  searchedParts: [],
  searchLoading: false,
  searchError: null,
  reducers: {
    clearPartsError: state => {
      state.error = null;
      state.walletError = null;
      state.inventoryError = null;
      state.requestError = null;
      state.removalError = null;
    },
    clearPartsData: state => {
      state.walletParts = [];
      state.inventoryParts = [];
      state.loading = false;
      state.walletLoading = false;
      state.inventoryLoading = false;
      state.requestLoading = false;
      state.removalLoading = false;
      state.error = null;
      state.walletError = null;
      state.inventoryError = null;
      state.requestError = null;
      state.removalError = null;
      state.lastFetched = null;
    },
    clearInventoryParts: state => {
      state.inventoryParts = [];
      state.inventoryError = null;
    },
    clearSearchedParts: state => {
      state.searchedParts = [];
      state.searchError = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch wallet parts
      .addCase(fetchWalletParts.pending, state => {
        state.walletLoading = true;
        state.walletError = null;
      })
      .addCase(fetchWalletParts.fulfilled, (state, action) => {
        state.walletLoading = false;
        state.walletParts = action.payload || [];
        state.lastFetched = Date.now();
        state.walletError = null;
      })
      .addCase(fetchWalletParts.rejected, (state, action) => {
        state.walletLoading = false;
        state.walletError = action.payload as string;
        state.walletParts = [];
      })
      // Fetch inventory parts
      .addCase(fetchInventoryParts.pending, state => {
        state.inventoryLoading = true;
        state.inventoryError = null;
      })
      .addCase(fetchInventoryParts.fulfilled, (state, action) => {
        state.inventoryLoading = false;
        state.inventoryParts = action.payload;
        state.inventoryError = null;
      })
      .addCase(fetchInventoryParts.rejected, (state, action) => {
        state.inventoryLoading = false;
        state.inventoryError = action.payload as string;
      })
      // Request parts
      .addCase(requestParts.pending, state => {
        state.requestLoading = true;
        state.requestError = null;
      })
      .addCase(requestParts.fulfilled, state => {
        state.requestLoading = false;
        state.requestError = null;
      })
      .addCase(requestParts.rejected, (state, action) => {
        state.requestLoading = false;
        state.requestError = action.payload as string;
      })
      // Remove parts
      .addCase(removeParts.pending, state => {
        state.removalLoading = true;
        state.removalError = null;
      })
      .addCase(removeParts.fulfilled, state => {
        state.removalLoading = false;
        state.removalError = null;
      })
      .addCase(removeParts.rejected, (state, action) => {
        state.removalLoading = false;
        state.removalError = action.payload as string;
      })
      .addCase(entryPartToApprove.pending, state => {
        state.localPurchaseLoading = true;
        state.localPurchaseError = null;
      })
      .addCase(entryPartToApprove.fulfilled, state => {
        state.localPurchaseLoading = false;
        state.localPurchaseError = null;
      })
      .addCase(entryPartToApprove.rejected, (state, action) => {
        state.localPurchaseLoading = false;
        state.localPurchaseError = action.payload as string;
      })
      .addCase(assignParts.pending, state => {
        state.assignLoading = true;
        state.assignError = null;
      })
      .addCase(assignParts.fulfilled, state => {
        state.assignLoading = false;
        state.assignError = null;
      })
      .addCase(assignParts.rejected, (state, action) => {
        state.assignLoading = false;
        state.assignError = action.payload as string;
      })
      .addCase(fetchInventoryPartsAdmin.pending, state => {
        state.inventoryAdminLoading = true;
        state.inventoryAdminError = null;
      })
      .addCase(fetchInventoryPartsAdmin.fulfilled, (state, action) => {
        state.inventoryAdminLoading = false;
        state.inventoryAdminParts = action.payload;
        state.inventoryAdminError = null;
      })
      .addCase(fetchInventoryPartsAdmin.rejected, (state, action) => {
        state.inventoryAdminLoading = false;
        state.inventoryAdminError = action.payload as string;
      }),
      builder
        .addCase(searchParts.pending, state => {
          state.searchLoading = true;
          state.searchError = null;
        })
        .addCase(searchParts.fulfilled, (state, action) => {
          state.searchLoading = false;
          state.searchedParts = action.payload;
        })
        .addCase(searchParts.rejected, (state, action) => {
          state.searchLoading = false;
          state.searchError = action.payload as string;
          state.searchedParts = [];
        });
  },
});

export const { clearPartsError, clearPartsData, clearInventoryParts } =
  partsSlice.actions;

// Selectors
export const selectWalletParts = (state: RootState) => state.parts.walletParts;
export const selectInventoryParts = (state: RootState) =>
  state.parts.inventoryParts;
export const selectPartsLoading = (state: RootState) => state.parts.loading;
export const selectWalletLoading = (state: RootState) =>
  state.parts.walletLoading;
export const selectInventoryLoading = (state: RootState) =>
  state.parts.inventoryLoading;
export const selectRequestLoading = (state: RootState) =>
  state.parts.requestLoading;
export const selectRemovalLoading = (state: RootState) =>
  state.parts.removalLoading;
export const selectPartsError = (state: RootState) => state.parts.error;
export const selectWalletError = (state: RootState) => state.parts.walletError;
export const selectInventoryError = (state: RootState) =>
  state.parts.inventoryError;
export const selectRequestError = (state: RootState) =>
  state.parts.requestError;
export const selectRemovalError = (state: RootState) =>
  state.parts.removalError;
export const selectPartsLastFetched = (state: RootState) =>
  state.parts.lastFetched;
export const selectLocalPurchaseLoading = (state: RootState) =>
  state.parts.localPurchaseLoading;
export const selectLocalPurchaseError = (state: RootState) =>
  state.parts.localPurchaseError;
export const selectAssignLoading = (state: RootState) =>
  state.parts.assignLoading;
export const selectAssignError = (state: RootState) => state.parts.assignError;
export const selectInventoryAdminParts = (state: RootState) =>
  state.parts.inventoryAdminParts;
export const selectInventoryAdminLoading = (state: RootState) =>
  state.parts.inventoryAdminLoading;
export const selectInventoryAdminError = (state: RootState) =>
  state.parts.inventoryAdminError;

export const selectSearchedParts = (state: RootState) =>
  state.parts.searchedParts;
export const selectSearchLoading = (state: RootState) =>
  state.parts.searchLoading;
export const selectSearchError = (state: RootState) => state.parts.searchError;

// Export the new action
export const { clearSearchedParts } = partsSlice.actions;

export default partsSlice.reducer;
