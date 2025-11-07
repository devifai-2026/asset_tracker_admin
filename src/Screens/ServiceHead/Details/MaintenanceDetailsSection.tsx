import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MaintenanceDetails {
    ticketId: string;
    complainDate: string;
    breakdownType: string;
    breakdownTitle: string;
    breakdownDate: string;
    priority: string;
    status: string;
    deadline: string;
    engineer: string;
}

interface MaintenanceDetailsSectionProps {
    maintenance: MaintenanceDetails;
}

const MaintenanceDetailsSection = ({ maintenance }: MaintenanceDetailsSectionProps) => {

    console.log("Maintenance Details::::::::::::::::::::::::::::", maintenance);
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maintenance Details</Text>

            <View style={styles.maintenanceGrid}>
                <View style={styles.maintenanceRow}>
                    <View style={styles.maintenanceItem}>
                        <Text style={styles.maintenanceLabel}>Ticket ID</Text>
                        <Text style={styles.maintenanceValue}>{maintenance.ticketId}</Text>
                    </View>
                    <View style={styles.maintenanceItem}>
                        <Text style={styles.maintenanceLabel}>Date of Complaint</Text>
                        <Text style={styles.maintenanceValue}>{maintenance.complainDate}</Text>
                    </View>
                    <View style={styles.maintenanceItem}>
                        <Text style={styles.maintenanceLabel}>Breakdown Type</Text>
                        <Text style={styles.maintenanceValue}>{maintenance.breakdownType}</Text>
                    </View>
                </View>

                <View style={styles.maintenanceRow}>
                    <View style={styles.maintenanceItem}>
                        <Text style={styles.maintenanceLabel}>Breakdown Title</Text>
                        <Text style={styles.maintenanceValue}>{maintenance.breakdownTitle}</Text>
                    </View>
                    <View style={styles.maintenanceItem}>
                        <Text style={styles.maintenanceLabel}>Breakdown Date</Text>
                        <Text style={styles.maintenanceValue}>{maintenance.breakdownDate}</Text>
                    </View>
                    <View style={styles.maintenanceItem}>
                        <Text style={styles.maintenanceLabel}>Priority</Text>
                        <View style={styles.priorityTag}>
                            <Text style={styles.priorityText}>{maintenance.priority}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.maintenanceRow}>
                    <View style={styles.maintenanceItem}>
                        <Text style={styles.maintenanceLabel}>Status</Text>
                        <View style={styles.statusTag}>
                            <Text style={styles.statusText}>
                                {maintenance.status === 'open' ? 'Open' :
                                    maintenance.status === 'in_progress' ? 'In Progress' :
                                        maintenance.status === 'closed' ? 'Closed' : maintenance.status}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.maintenanceItem}>
                        <Text style={styles.maintenanceLabel}>Deadline</Text>
                        <Text style={styles.maintenanceValue}>{maintenance.deadline}</Text>
                    </View>
                    <View style={styles.maintenanceItem} />
                </View>
            </View>
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1D29",
        marginBottom: 16,
    },
    maintenanceGrid: {
        gap: 16,
    },
    maintenanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    maintenanceItem: {
        flex: 1,
        minHeight: 40,
    },
    maintenanceLabel: {
        fontSize: 11,
        color: "#9E9E9E",
        marginBottom: 4,
        textTransform: "uppercase",
        fontWeight: "500",
    },
    maintenanceValue: {
        fontSize: 14,
        color: "#1A1D29",
        fontWeight: "500",
    },
    priorityTag: {
        backgroundColor: "#FFEBEE",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    priorityText: {
        color: "#C62828",
        fontSize: 12,
        fontWeight: "600",
    },
    statusTag: {
        backgroundColor: "#E3F2FD",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    statusText: {
        color: "#1976D2",
        fontSize: 12,
        fontWeight: "600",
    },
});

export default MaintenanceDetailsSection;