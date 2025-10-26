// walletSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  maintenanceApi,
  WalletPart,
  SendBackPayload,
} from '../../api/maintenanceApi';
import { RootState } from '../store';

interface WalletState {
  parts: WalletPart[];
  loading: boolean;
  error: string | null;
  sendBackLoading: boolean;
  sendBackError: string | null;
}

const initialState: WalletState = {
  parts: [],
  loading: false,
  error: null,
  sendBackLoading: false,
  sendBackError: null,
};

// Fetch wallet parts
export const fetchWalletParts = createAsyncThunk(
  'wallet/fetchParts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await maintenanceApi.getOwnWallet();
      return response; // Return the entire WalletResponse object
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wallet data',
      );
    }
  },
);

// Send back parts
export const sendBackParts = createAsyncThunk(
  'wallet/sendBackParts',
  async (payload: SendBackPayload[], { rejectWithValue }) => {
    try {
      const response = await maintenanceApi.sendBackParts(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send back parts',
      );
    }
  },
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError: state => {
      state.error = null;
      state.sendBackError = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch wallet parts
      .addCase(fetchWalletParts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletParts.fulfilled, (state, action) => {
        state.loading = false;
        state.parts = action.payload;
        console.log('Wallet Parts Fetched:', action.payload);
        state.error = null;
      })
      .addCase(fetchWalletParts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send back parts
      .addCase(sendBackParts.pending, state => {
        state.sendBackLoading = true;
        state.sendBackError = null;
      })
      .addCase(sendBackParts.fulfilled, state => {
        state.sendBackLoading = false;
        state.sendBackError = null;
      })
      .addCase(sendBackParts.rejected, (state, action) => {
        state.sendBackLoading = false;
        state.sendBackError = action.payload as string;
      });
  },
});

export const { clearWalletError } = walletSlice.actions;

// Selectors
export const selectWalletParts = (state: RootState) => state.wallet.parts;
export const selectWalletLoading = (state: RootState) => state.wallet.loading;
export const selectWalletError = (state: RootState) => state.wallet.error;
export const selectSendBackLoading = (state: RootState) =>
  state.wallet.sendBackLoading;
export const selectSendBackError = (state: RootState) =>
  state.wallet.sendBackError;

export default walletSlice.reducer;
