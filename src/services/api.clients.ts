import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import { enviornment, URLs } from './api.enviroments';
import { store } from '../Redux/store';

const axiosConfig: AxiosRequestConfig = {
  baseURL: URLs[enviornment].apiURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie authentication
  
};

export const baseClient: AxiosInstance = axios.create(axiosConfig);
export const authClient: AxiosInstance = axios.create(axiosConfig);

const applyInterceptors = (
  client: AxiosInstance,
  withAuth: boolean = false,
) => {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      if (withAuth) {
        const state = store.getState();
        const token = state.auth.token;

        if (token) {
          config.headers['x-access-tokens'] = token;
        }
      }

      console.log('📤 [REQUEST]');
      console.log(
        `➡️ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      );
      console.log('Headers:', config.headers);
      if (config.data) {
        console.log('Payload:', config.data);
      }

      return config;
    },
    (error: AxiosError) => {
      console.error('🛑 [REQUEST ERROR]', error);
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('✅ [RESPONSE]');
      console.log(`⬅️ ${response.status} ${response.config.url}`);
      console.log('Response:', response.data);
      return response;
    },
    (error: AxiosError) => {
      if (error.response) {
        console.error('❌ [ERROR RESPONSE]', {
          url: error.config?.url,
          status: error.response.status,
          data: error.response.data,
        });

        if (error.response.status === 401) {
          console.warn('⚠️ Unauthorized (401)');
          // Optional: Dispatch logout action here if needed
        }
      } else if (error.request) {
        console.error('⚠️ [NO RESPONSE]', error.request);
      } else {
        console.error('🚨 [REQUEST SETUP ERROR]', error.message);
      }

      return Promise.reject(error);
    },
  );
};

applyInterceptors(baseClient);
applyInterceptors(authClient, true);

export default {
  baseClient,
  authClient,
};
