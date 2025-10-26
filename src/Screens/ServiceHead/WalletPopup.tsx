import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface WalletPopupProps {
    visible: boolean;
    onClose: () => void;
}

const WalletPopup: React.FC<WalletPopupProps> = ({ visible, onClose }) => {
    const walletData = [
        { id: 1, partNumber: 'TXSP-MCI-25973', requested: 1, approved: 1, inHand: 1 },
        { id: 2, partNumber: 'TXSP-MCI-25973', requested: 10, approved: 10, inHand: 1 },
        { id: 3, partNumber: 'i/Z\' ISO 7/1 BSP...', requested: 2, approved: 2, inHand: 9 },
    ];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Wallet</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color="#1A1D29" />
                        </TouchableOpacity>
                    </View>

                    {/* Wallet Table */}
                    <ScrollView style={styles.tableContainer}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerText, styles.firstColumn]}>#</Text>
                            <Text style={[styles.headerText, styles.middleColumn]}>Part Number</Text>
                            <Text style={[styles.headerText, styles.middleColumn]}>Requested</Text>
                            <Text style={[styles.headerText, styles.middleColumn]}>Approved</Text>
                            <Text style={[styles.headerText, styles.lastColumn]}>In Hand</Text>
                        </View>

                        {walletData.map((item) => (
                            <View key={item.id} style={styles.tableRow}>
                                <Text style={[styles.cellText, styles.firstColumn]}>{item.id}</Text>
                                <Text style={[styles.cellText, styles.middleColumn]}>{item.partNumber}</Text>
                                <Text style={[styles.cellText, styles.middleColumn]}>{item.requested}</Text>
                                <Text style={[styles.cellText, styles.middleColumn]}>{item.approved}</Text>
                                <Text style={[styles.cellText, styles.lastColumn]}>{item.inHand}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Total Price */}
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalText}>Total Price</Text>
                        <Text style={styles.totalPrice}>#00/-</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9F2',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1D29',
    },
    closeButton: {
        padding: 4,
    },
    tableContainer: {
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F5F7FA',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9F2',
    },
    headerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1D29',
        textAlign: 'center',
    },
    cellText: {
        fontSize: 12,
        color: '#1A1D29',
        textAlign: 'center',
    },
    firstColumn: {
        flex: 0.5,
    },
    middleColumn: {
        flex: 1,
    },
    lastColumn: {
        flex: 1,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E9F2',
    },
    totalText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1D29',
    },
    totalPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#00BFA5',
    },
});

export default WalletPopup;