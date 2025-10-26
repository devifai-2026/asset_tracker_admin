import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Header } from './Header';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWalletParts,
  sendBackParts,
  selectWalletParts,
  selectWalletLoading,
  selectSendBackLoading,
} from '../Redux/Slices/walletSlice';

const { width, height } = Dimensions.get('window');

interface WalletPart {
  already_released: number;
  approve_quantity: number;
  comsumed_quantity: number | null;
  id: number;
  install_quantity: number | null;
  is_approved: boolean;
  is_removal_part: boolean;
  maintenance_id: string;
  part_inventory_id: number | null;
  part_no: string;
  requested_date: string;
  requested_quantity: number | null;
}

const Wallet = () => {
  const dispatch = useDispatch();
  const walletParts = useSelector(selectWalletParts) || [];
  const loading = useSelector(selectWalletLoading);
  const sendBackLoading = useSelector(selectSendBackLoading);

  const [selectedTab, setSelectedTab] = useState('current');
  const [selectedParts, setSelectedParts] = useState<Set<number>>(new Set());
  const [sendBackQuantity, setSendBackQuantity] = useState('');
  const [showSendBackModal, setShowSendBackModal] = useState(false);

  useEffect(() => {
    dispatch(fetchWalletParts() as any);
  }, [dispatch]);

  const filteredParts = walletParts.filter(part =>
    selectedTab === 'current' ? !part.is_removal_part : part.is_removal_part
  );

  const calculateInHand = (part: WalletPart) => {
    return (part.already_released || 0) - (part.comsumed_quantity || 0);
  };

  const togglePartSelection = (partId: number) => {
    const newSelectedParts = new Set(selectedParts);
    if (newSelectedParts.has(partId)) {
      newSelectedParts.delete(partId);
    } else {
      newSelectedParts.add(partId);
    }
    setSelectedParts(newSelectedParts);
  };

  const handleSendBack = async () => {
    if (selectedParts.size === 0 || !sendBackQuantity) {
      Alert.alert('Error', 'Please select at least one part and enter quantity');
      return;
    }

    const quantity = parseInt(sendBackQuantity);
    if (quantity <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }

    const payload = Array.from(selectedParts).map(id => ({
      id,
      back_item_count: quantity
    }));

    try {
      const result = await dispatch(sendBackParts(payload) as any);
      if (sendBackParts.fulfilled.match(result)) {
        Alert.alert('Success', 'Parts sent back successfully');
        setShowSendBackModal(false);
        setSelectedParts(new Set());
        setSendBackQuantity('');
        dispatch(fetchWalletParts() as any);
      }
    } catch (error) {
      console.error('Send back error:', error);
    }
  };

  const openSendBackModal = () => {
    if (selectedParts.size === 0) {
      Alert.alert('Error', 'Please select at least one part to send back');
      return;
    }
    setShowSendBackModal(true);
  };

  const getSelectedPartsCount = () => {
    return selectedParts.size;
  };

  const getTotalInHandForSelected = () => {
    let total = 0;
    selectedParts.forEach(partId => {
      const part = walletParts.find(p => p.id === partId);
      if (part) {
        total += calculateInHand(part);
      }
    });
    return total;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <Header />
      </View>

      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'current' && styles.tabActive]}
            onPress={() => {
              setSelectedTab('current');
              setSelectedParts(new Set());
            }}
          >
            <Text style={[styles.tabText, selectedTab === 'current' && styles.tabTextActive]}>
              Current Parts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'removed' && styles.tabActive]}
            onPress={() => {
              setSelectedTab('removed');
              setSelectedParts(new Set());
            }}
          >
            <Text style={[styles.tabText, selectedTab === 'removed' && styles.tabTextActive]}>
              Removed Parts
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0FA37F" style={styles.loader} />
        ) : (
          <>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={[styles.column, styles.selectColumn]}>
                  <Text style={styles.headerText}></Text>
                </View>
                <View style={[styles.column, styles.partNoColumn]}>
                  <Text style={styles.headerText}>
                    No</Text>
                </View>
                <View style={[styles.column, styles.quantityColumn]}>
                  <Text style={styles.headerText}>Requested</Text>
                </View>
                <View style={[styles.column, styles.quantityColumn]}>
                  <Text style={styles.headerText}>Approved</Text>
                </View>
                <View style={[styles.column, styles.quantityColumn]}>
                  <Text style={styles.headerText}>Released</Text>
                </View>
                <View style={[styles.column, styles.quantityColumn]}>
                  <Text style={styles.headerText}>Installed</Text>
                </View>
                <View style={[styles.column, styles.quantityColumn]}>
                  <Text style={styles.headerText}>In Hand</Text>
                </View>
              </View>

              <ScrollView style={styles.scrollView}>
                {/* Table Rows */}
                {filteredParts.map((part) => {
                  const inHand = calculateInHand(part);
                  const isSelected = selectedParts.has(part.id);
                  const canSelect = selectedTab === 'current' && inHand > 0;

                  return (
                    <TouchableOpacity
                      key={part.id}
                      style={[styles.tableRow, isSelected && styles.selectedRow]}
                      onPress={() => canSelect && togglePartSelection(part.id)}
                      disabled={!canSelect}
                    >
                      <View style={[styles.column, styles.selectColumn]}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && (
                            <Icon name="check" size={16} color="#fff" />
                          )}
                        </View>
                      </View>

                      <View style={[styles.column, styles.partNoColumn]}>
                        <Text style={[styles.cellText, !canSelect && styles.disabledText]} numberOfLines={1}>
                          {part.part_no}
                        </Text>
                      </View>

                      <View style={[styles.column, styles.quantityColumn]}>
                        <Text style={styles.cellText}>
                          {part.requested_quantity || 0}
                        </Text>
                      </View>

                      <View style={[styles.column, styles.quantityColumn]}>
                        <Text style={styles.cellText}>
                          {part.approve_quantity || 0}
                        </Text>
                      </View>

                      <View style={[styles.column, styles.quantityColumn]}>
                        <Text style={styles.cellText}>
                          {part.already_released || 0}
                        </Text>
                      </View>

                      <View style={[styles.column, styles.quantityColumn]}>
                        <Text style={styles.cellText}>
                          {part.install_quantity || 0}
                        </Text>
                      </View>

                      <View style={[styles.column, styles.quantityColumn]}>
                        <Text style={[styles.cellText, inHand > 0 ? styles.inHandText : styles.zeroText]}>
                          {inHand}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {filteredParts.length === 0 && (
                  <View style={styles.emptyState}>
                    <Icon name="package-variant" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>
                      No {selectedTab === 'current' ? 'current' : 'removed'} parts found
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Send Back Button */}
            {selectedTab === 'current' && selectedParts.size > 0 && (
              <TouchableOpacity
                style={styles.sendBackButton}
                onPress={openSendBackModal}
              >
                <Icon name="send" size={20} color="#fff" />
                <Text style={styles.sendBackButtonText}>
                  Send Back ({getSelectedPartsCount()} selected)
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Send Back Modal */}
      <Modal
        visible={showSendBackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSendBackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Back Parts</Text>
              <TouchableOpacity
                onPress={() => setShowSendBackModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.selectedPartsInfo}>
                <Text style={styles.selectedPartsCount}>
                  {getSelectedPartsCount()} part(s) selected
                </Text>
                <Text style={styles.totalInHand}>
                  Total In Hand: {getTotalInHandForSelected()}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity to Send Back *</Text>
                <TextInput
                  style={styles.input}
                  value={sendBackQuantity}
                  onChangeText={setSendBackQuantity}
                  placeholder="Enter quantity for all selected parts"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHelp}>
                  This quantity will be applied to all selected parts
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, sendBackLoading && styles.submitButtonDisabled]}
                onPress={handleSendBack}
                disabled={sendBackLoading}
              >
                {sendBackLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Confirm Send Back
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  stickyHeader: {
    padding: 16
  },
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#0FA37F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0FA37F',
    fontWeight: '700',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  loader: {
    marginTop: 50,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0FA37F',
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 2,
    alignItems: 'center',
  },
  column: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectColumn: {
    width: '10%',
  },
  partNoColumn: {
    width: '20%',
  },
  quantityColumn: {
    width: '12%',
  },
  headerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 9,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
    marginBottom: 2,
  },
  selectedRow: {
    backgroundColor: '#e8f5e8',
    borderColor: '#0FA37F',
    borderWidth: 1,
  },
  cellText: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  disabledText: {
    color: '#bdc3c7',
  },
  inHandText: {
    color: '#0FA37F',
    fontWeight: '700',
  },
  zeroText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0FA37F',
    borderColor: '#0FA37F',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  sendBackButton: {
    flexDirection: 'row',
    backgroundColor: '#0FA37F',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.6,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  selectedPartsInfo: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedPartsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0FA37F',
    marginBottom: 4,
  },
  totalInHand: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
  },
  inputHelp: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 6,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#0FA37F',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export { Wallet };