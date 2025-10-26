import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slices/authSlice';
import maintenanceReducer from './Slices/maintenanceSlice';
import partsReducer from './Slices/partsSlice';
import walletReducer from './Slices/walletSlice';
import offlineAttendanceReducer from './Slices/attendanceSlice';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import logger from 'redux-logger';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  offlineAttendance: offlineAttendanceReducer,
  maintenance: maintenanceReducer,
  parts: partsReducer,
  wallet: walletReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(logger),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
