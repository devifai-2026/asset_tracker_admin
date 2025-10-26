import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useAssets } from '../hooks/useAssets';

type Props = {
  visible: boolean;
  onClose: () => void;
  assetCode: string;
  assetId: string;
};

const ReportBreakdownModal: React.FC<Props> = ({
  visible,
  onClose,
  assetCode,
  assetId,
}) => {
  const { reportMaintenance, loading } = useAssets();
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (d: Date) =>
    `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getFullYear()}`;

  const formatTime = (d: Date) => {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const toISOStringWithoutMs = (d: Date) => {
    // Formats as YYYY-MM-DDTHH:mm:ss
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  };

  const handleConfirm = async () => {
    const payload = {
      asset_no: assetCode,
      asset_id: assetId,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      requested_datetime: toISOStringWithoutMs(date), // YYYY-MM-DDTHH:mm:ss
    };

    const result = await reportMaintenance(payload);
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Reported',
        text2: 'Breakdown reported successfully',
      });
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Report Breakdown</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Asset</Text>
            <Text style={styles.value}>{assetCode}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerText}>{formatDate(date)}</Text>
              <Icon name="chevron-down" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerText}>{formatTime(date)}</Text>
              <Icon name="chevron-down" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
            />
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.yesButton}
              onPress={handleConfirm}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Please wait...' : 'Yes'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.noButton} onPress={onClose}>
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    minWidth: 130,
    paddingVertical: 2,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 130,
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 15,
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 20,
  },
  yesButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  noButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ReportBreakdownModal;
