// hooks/useAuth.ts
import { useState } from 'react';
import { baseClient, authClient } from '../services/api.clients';
import { APIEndpoints } from '../services/api.endpoints';
import { useDispatch } from 'react-redux';
import {
  login as loginAction,
  setPermissions,
  passwordChanged,
  setCurrentRole,
} from '../Redux/Slices/authSlice';
import Toast from 'react-native-toast-message';

interface LoginPayload {
  email: string;
  password: string;
}

interface ChangePasswordPayload {
  email: string;
  old_password: string;
  new_password: string;
}

export const useAuth = () => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyLogin = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await baseClient.post(
        APIEndpoints.companyLogin,
        payload,
      );
      const { token, is_password_changed_once, message } = response.data;

      if (response.status === 200) {
        dispatch(
          loginAction({
            token,
            email: payload.email,
            isPasswordChanged: is_password_changed_once,
          }),
        );

        // Fetch permissions after successful login
        const permissions = await fetchPermissions();

        // Set initial role based on permissions
        if (permissions.includes('SERVICE.ALL')) {
          dispatch(setCurrentRole('Service Engineer'));
        } else if (
          permissions.includes('MAINT.ALL') ||
          permissions.includes('ASSETS.VIEW')
        ) {
          dispatch(setCurrentRole('Service Head'));
        } else if (permissions.includes('ADMIN.ALL')) {
          dispatch(setCurrentRole('Admin'));
        }

        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome back!',
        });

        return { success: true, isPasswordChanged: is_password_changed_once };
      } else {
        const errorMessage = message || 'Login failed';
        setError(errorMessage);
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Invalid email or password. Please try again.',
        });
        return { success: false, isPasswordChanged: false };
      }
    } catch (err: any) {
      // Standardize error messages for login failures
      let errorTitle = 'Login Failed';
      let errorMessage = 'Invalid email or password. Please try again.';

      // Check for specific error types from API
      const apiError = err?.response?.data;
      
      if (apiError?.message?.toLowerCase().includes('invalid credentials') || 
          apiError?.error?.toLowerCase().includes('invalid credentials') ||
          err?.response?.status === 401) {
        errorTitle = 'Login Failed';
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err?.response?.status === 404) {
        errorTitle = 'Login Failed';
        errorMessage = 'Account not found. Please check your email.';
      } else if (err?.response?.status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = 'Temporary server issue. Please try again later.';
      } else if (err.message === 'Network Error') {
        errorTitle = 'Network Error';
        errorMessage = 'Please check your internet connection and try again.';
      } else {
        // For any other unexpected errors, use a generic message
        errorTitle = 'Login Failed';
        errorMessage = 'Unable to login. Please try again.';
      }

      setError(errorMessage);
      Toast.show({
        type: 'error',
        text1: errorTitle,
        text2: errorMessage,
      });
      return { success: false, isPasswordChanged: false };
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await authClient.get(APIEndpoints.viewPermissions);
      const { permissions } = response.data;

      dispatch(setPermissions(permissions));
      return permissions;
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err);
      // Don't throw error here, just return empty array
      return [];
    }
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authClient.post(
        APIEndpoints.changePassword,
        payload,
      );
      const { message } = response.data;

      if (response.status === 200) {
        dispatch(passwordChanged());

        // Re-fetch permissions after password change
        await fetchPermissions();

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: message || 'Password changed successfully',
        });

        return { success: true };
      } else {
        const errorMessage = message || 'Password change failed';
        setError(errorMessage);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
        });
        return { success: false };
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Something went wrong';
      setError(errMsg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    companyLogin,
    changePassword,
    fetchPermissions,
    loading,
    error,
  };
};