// authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  email: string | null;
  permissions: string[];
  isPasswordChanged: boolean;
  isAuthenticated: boolean;
  userRole?: string;
  currentRole: string;
}

const initialState: AuthState = {
  token: null,
  email: null,
  permissions: [],
  isPasswordChanged: false,
  isAuthenticated: false,
  currentRole: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{
        token: string;
        email: string;
        isPasswordChanged: boolean;
      }>,
    ) => {
      state.token = action.payload.token;
      state.email = action.payload.email;
      state.isPasswordChanged = action.payload.isPasswordChanged;
      state.isAuthenticated = true;

      // Set initial role based on permissions
      if (state.permissions.includes('SERVICE.ALL')) {
        state.currentRole = 'Service Engineer';
      } else if (
        state.permissions.includes('MAINT.ALL') ||
        state.permissions.includes('ASSETS.VIEW')
      ) {
        state.currentRole = 'Service Head';
      } else if (state.permissions.includes('ADMIN.ALL')) {
        state.currentRole = 'Admin';
      }
    },
    logout: state => {
      state.isPasswordChanged = false;
      state.isAuthenticated = false;
      state.token = null;
      state.email = null;
      state.permissions = [];
      state.currentRole = '';
    },
    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
      
      // Set initial role when permissions are set
      if (action.payload.includes('SERVICE.ALL')) {
        state.currentRole = 'Service Engineer';
      } else if (
        action.payload.includes('MAINT.ALL') ||
        action.payload.includes('ASSETS.VIEW')
      ) {
        state.currentRole = 'Service Head';
      } else if (action.payload.includes('ADMIN.ALL')) {
        state.currentRole = 'Admin';
      }
    },
    passwordChanged: state => {
      state.isPasswordChanged = true;
    },
    setCurrentRole: (state, action: PayloadAction<string>) => {
      state.currentRole = action.payload;
    },
  },
});

export const {
  login,
  logout,
  setPermissions,
  passwordChanged,
  setCurrentRole,
} = authSlice.actions;

export default authSlice.reducer;