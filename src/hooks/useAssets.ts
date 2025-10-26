import { useState } from 'react';
import { baseClient } from '../services/api.clients';
import { APIEndpoints } from '../services/api.endpoints';
import Toast from 'react-native-toast-message';

interface Asset {
  asset_id: string;
  asset_no: string;
  report_maintenance_is_closed: string | null;
}

interface ReportMaintenancePayload {
  asset_no: string;
  date: string; // format: YYYY-MM-DD
  requested_datetime: string; // format: YYYY-MM-DDTHH:mm:ss
  asset_id: string;
}

export const useAssets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assetNoList, setAssetNoList] = useState<Asset[]>([]);
  const [nextAssetNoList, setNextAssetNoList] = useState<Asset[]>([]);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await baseClient.get(APIEndpoints.assets);
      const { data, types, msg } = response.data;

      if (types === 'successful') {
        setAssetNoList(data.asset_no_list || []);
        setNextAssetNoList(data.next_asset_no_list || []);
        return { success: true };
      } else {
        setError(msg || 'Failed to fetch assets');
        Toast.show({
          type: 'error',
          text1: 'Fetch Failed',
          text2: msg || 'Please try again.',
        });
        return { success: false };
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.data || // <-- show backend "data" field if present
        err?.response?.data?.msg ||  // fallback to msg
        'Something went wrong';
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

  const reportMaintenance = async (payload: ReportMaintenancePayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await baseClient.post(APIEndpoints.report, payload);
      const { types, msg } = response.data;

      if (types === 'successful') {
        Toast.show({
          type: 'success',
          text1: 'Report Submitted',
          text2: msg || 'Maintenance report submitted successfully.',
        });
        return { success: true };
      } else {
        const errMsg = msg || 'Failed to submit report';
        setError(errMsg);
        Toast.show({
          type: 'error',
          text1: 'Submit Failed',
          text2: errMsg,
        });
        return { success: false };
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.data || // backend detailed error
        err?.response?.data?.msg || 
        'Something went wrong';
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
    fetchAssets,
    reportMaintenance,
    loading,
    error,
    assetNoList,
    nextAssetNoList,
  };
};
