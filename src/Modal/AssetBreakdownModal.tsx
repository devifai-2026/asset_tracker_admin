import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const AssetBreakdownModal: React.FC<Props> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Asset Name Breakdown</Text>
          <Icon name="question" size={78} color="#999" style={styles.questionMark} />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.yesButton} onPress={onConfirm}>
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.noButton} onPress={onCancel}>
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AssetBreakdownModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    padding: 24,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
questionMark: {
  marginVertical: 16,
},
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    width: '100%',
  },
  yesButton: {
    flex: 1,
    backgroundColor: '#1271EE',
    paddingVertical: 10,
    marginRight: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  noButton: {
    flex: 1,
    backgroundColor: '#FF2E2E',
    paddingVertical: 10,
    marginLeft: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
