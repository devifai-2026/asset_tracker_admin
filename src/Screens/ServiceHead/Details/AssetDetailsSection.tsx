// AssetDetailsSection.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface AssetDetails {
    assetName: string;
    capacity: string;
    lease: string;
    modelNo: string;
    category: string;
    customer: string;
    make: string;
    yom: string;
    rentalEndDate: string;
    operator: string;
    salesPerson: string;
}

interface AssetDetailsSectionProps {
    assetDetails: AssetDetails;
    isExpanded: boolean;
    onToggle: () => void;
}

const AssetDetailsSection = ({ assetDetails, isExpanded, onToggle }: AssetDetailsSectionProps) => {
    return (
        <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
                <Text style={styles.sectionTitle}>Asset Details</Text>
                <Icon
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#666"
                />
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.assetGrid}>
                    <View style={styles.assetRow}>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Asset</Text>
                            <Text style={styles.assetValue}>{assetDetails.assetName}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Height-Capacity</Text>
                            <Text style={styles.assetValue}>{assetDetails.capacity}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Lease</Text>
                            <Text style={styles.assetValue}>{assetDetails.lease}</Text>
                        </View>
                    </View>

                    <View style={styles.assetRow}>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Model No.</Text>
                            <Text style={styles.assetValue}>{assetDetails.modelNo}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Category</Text>
                            <Text style={styles.assetValue}>{assetDetails.category}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Customer</Text>
                            <Text style={styles.assetValue}>{assetDetails.customer}</Text>
                        </View>
                    </View>

                    <View style={styles.assetRow}>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Make</Text>
                            <Text style={styles.assetValue}>{assetDetails.make}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>YOM</Text>
                            <Text style={styles.assetValue}>{assetDetails.yom}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Rental End Date</Text>
                            <Text style={styles.assetValue}>{assetDetails.rentalEndDate}</Text>
                        </View>
                    </View>

                    <View style={styles.assetRow}>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Operator</Text>
                            <Text style={styles.assetValue}>{assetDetails.operator}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Sales Person</Text>
                            <Text style={styles.assetValue}>{assetDetails.salesPerson}</Text>
                        </View>
                        <View style={styles.assetItem} />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: "#ffffff",
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1D29",
    },
    assetGrid: {
        gap: 16,
    },
    assetRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    assetItem: {
        flex: 1,
        minHeight: 40,
    },
    assetLabel: {
        fontSize: 11,
        color: "#9E9E9E",
        marginBottom: 4,
        textTransform: "uppercase",
        fontWeight: "500",
    },
    assetValue: {
        fontSize: 14,
        color: "#1A1D29",
        fontWeight: "500",
    },
});

export default AssetDetailsSection;