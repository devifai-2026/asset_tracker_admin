// useAttendance.ts
import NetInfo from '@react-native-community/netinfo';
import { useDispatch, useSelector } from 'react-redux';
import { addOfflineAttendance, setLastAction } from '../Redux/Slices/attendanceSlice';
import { RootState } from '../Redux/store';
import { getLocationManually } from '../Utils/locationUtils';
import { baseClient } from '../services/api.clients';
import { APIEndpoints } from '../services/api.endpoints';
import Toast from 'react-native-toast-message';
import { useState } from 'react';

export const useAttendance = () => {
  const dispatch = useDispatch();
  const { uid } = useSelector((state: RootState) => state.auth);
  const lastAction = useSelector((state: RootState) => state.offlineAttendance.lastAction);

  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = lastAction === 'login';

  // ===== API call for attendance list =====
  const getAttendanceList = async (
    start_date: string,
    end_date: string,
    limit: number = 10,
    offset: number = 0
  ) => {
    setLoading(true);
    try {
      const query = `?start_date=${start_date}&end_date=${end_date}&limit=${limit}&offset=${offset}`;
      const res = await baseClient.get(`${APIEndpoints.attendanceList}${query}`);

      if (res?.data?.types === 'successful') {
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setAttendanceList(data);
        return data;
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res?.data?.msg || 'Failed to fetch attendance list',
        });
        setAttendanceList([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching attendance list:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to fetch attendance list',
      });
      setAttendanceList([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ===== Send attendance API =====
  const sendToApi = async (payload: { lat_lon: number[]; date_time?: string }) => {
    try {
      const res = await baseClient.post(APIEndpoints.attend, payload);

      if (res?.data?.sts === false) {
        Toast.show({
          type: 'error',
          text1: 'Attendance Failed',
          text2: res?.data?.msg || 'Could not record attendance.',
        });
        return false;
      }

      console.log('✅ Attendance sent to server');
      return true;
    } catch (err) {
      console.warn('❌ Attendance API failed:', err);
      return false;
    }
  };

  // ===== Handle Login/Logout =====
  const handleAttendance = async (type: 'login' | 'logout') => {
    const coords = await getLocationManually();
    if (!coords) return;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    const dateTimeStr = `${date} ${time}`;

    const payload = {
      lat_lon: [coords.lat, coords.lng],
      date_time: dateTimeStr,
    };

    const net = await NetInfo.fetch();

    if (net.isConnected) {
      const success = await sendToApi(payload);
      if (!success) return;
    } else {
      dispatch(
        addOfflineAttendance({
          emp_id: uid,
          lat: coords.lat,
          lng: coords.lng,
          date,
          time,
          type,
        })
      );
    }

    dispatch(setLastAction(type));
  };

  const login = async () => {
    if (isLoggedIn) return;
    await handleAttendance('login');
  };

  const logout = async () => {
    if (!isLoggedIn) return;
    await handleAttendance('logout');
  };

  return {
    login,
    logout,
    isLoggedIn,
    getAttendanceList,
    attendanceList,
    loading,
  };
};
