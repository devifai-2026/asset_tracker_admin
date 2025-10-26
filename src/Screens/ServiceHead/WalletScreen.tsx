import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const WalletScreen = ({ navigation, route }: any) => {
    const { engineerName, walletData } = route.params || {};

    console.log("Wallet Data:", walletData);

    // Format the wallet data properly
    const walletItems = walletData?.map((item: any, index: number) => ({
        id: item.id || index + 1,
        partNumber: item.part_no || 'N/A',
        requested: item.requested_quantity || 0,
        approved: item.approve_quantity || 0,
        inHand: item.consumed_quantity !== null ? item.consumed_quantity : 'N/A',
        status: item.is_approved ? 'Approved' : 'Pending',
        requestedDate: item.requested_date ? 
            new Date(item.requested_date).toLocaleDateString('en-GB') : 'N/A'
    })) || [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#1A1D29" />
                    <Text style={styles.headerTitle}>Wallet</Text>
                </TouchableOpacity>
            </View>

            {/* Engineer Name */}
            <View style={styles.engineerHeader}>
                <Text style={styles.engineerName}>{engineerName || 'Engineer'}'s Wallet</Text>
                <Text style={styles.itemCount}>{walletItems.length} items</Text>
            </View>

            {/* Wallet Table */}
            <ScrollView style={styles.tableContainer}>
                {walletItems.length > 0 ? (
                    <>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerText, styles.serialColumn]}>#</Text>
                            <Text style={[styles.headerText, styles.partColumn]}>Part Number</Text>
                            <Text style={[styles.headerText, styles.quantityColumn]}>Req Qty</Text>
                            <Text style={[styles.headerText, styles.quantityColumn]}>Appr Qty</Text>
                            <Text style={[styles.headerText, styles.quantityColumn]}>In Hand</Text>
                            <Text style={[styles.headerText, styles.statusColumn]}>Status</Text>
                        </View>

                        {walletItems.map((item: any, index: number) => (
                            <View key={item.id} style={styles.tableRow}>
                                <Text style={[styles.cellText, styles.serialColumn]}>{index + 1}</Text>
                                <Text style={[styles.cellText, styles.partColumn]} numberOfLines={1}>
                                    {item.partNumber}
                                </Text>
                                <Text style={[styles.cellText, styles.quantityColumn]}>{item.requested}</Text>
                                <Text style={[styles.cellText, styles.quantityColumn]}>{item.approved}</Text>
                                <Text style={[styles.cellText, styles.quantityColumn]}>{item.inHand}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    item.status === 'Approved' ? styles.approvedBadge : styles.pendingBadge
                                ]}>
                                    <Text style={styles.statusText}>{item.status}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon name="wallet-outline" size={48} color="#9E9E9E" />
                        <Text style={styles.emptyText}>No items in wallet</Text>
                    </View>
                )}
            </ScrollView>

            {/* Summary Section */}
            {walletItems.length > 0 && (
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Requested:</Text>
                        <Text style={styles.summaryValue}>
                            {walletItems.reduce((sum: number, item: any) => sum + (item.requested || 0), 0)}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Approved:</Text>
                        <Text style={styles.summaryValue}>
                            {walletItems.reduce((sum: number, item: any) => sum + (item.approved || 0), 0)}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Items:</Text>
                        <Text style={styles.summaryValue}>{walletItems.length}</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9F2',
        // Add extra padding for iOS notch devices
        paddingTop: Platform.OS === 'ios' ? 10 : 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1D29',
        marginLeft: 12,
    },
    engineerHeader: {
        padding: 16,
        backgroundColor: '#F5F7FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9F2',
    },
    engineerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1D29',
        marginBottom: 4,
    },
    itemCount: {
        fontSize: 14,
        color: '#6B7280',
    },
    tableContainer: {
        flex: 1,
        padding: 16,
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
        alignItems: 'center',
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
    serialColumn: {
        flex: 0.5,
    },
    partColumn: {
        flex: 2,
        textAlign: 'left',
        paddingLeft: 4,
    },
    quantityColumn: {
        flex: 1,
    },
    statusColumn: {
        flex: 1.2,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    approvedBadge: {
        backgroundColor: '#C8E6C9',
    },
    pendingBadge: {
        backgroundColor: '#FFECB3',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1A1D29',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#9E9E9E',
        marginTop: 12,
    },
    summaryContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E9F2',
        backgroundColor: '#FFFFFF',
        // Add safe area padding for bottom on iOS
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1D29',
    },
});

export default WalletScreen;