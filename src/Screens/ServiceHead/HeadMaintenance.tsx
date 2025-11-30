// HeadMaintenance.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAllMaintenance,
    selectMaintenanceList,
    selectMaintenanceLoading,
    selectMaintenanceError,
} from "../../Redux/Slices/maintenanceSlice";
import { RootState } from "../../Redux/store";
import { logout } from "../../Redux/Slices/authSlice";
import { Header } from "../Header";

export const HeadMaintenance = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const [selectedTab, setSelectedTab] = useState("open");
    const [searchText, setSearchText] = useState("");

    // Get data from Redux store
    const maintenanceList = useSelector(selectMaintenanceList);
    const loading = useSelector(selectMaintenanceLoading);
    const error = useSelector(selectMaintenanceError);

    useEffect(() => {
        loadMaintenanceData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadMaintenanceData();
        }, [])
    );

    const loadMaintenanceData = () => {
        dispatch(fetchAllMaintenance() as any);
    };

    const handleProfilePress = () => {
        navigation.navigate('Profile');
    };

    const handlePlusPress = () => {
        navigation.navigate('CreateMaintenance');
    };

    const handleClearSearch = () => {
        setSearchText("");
    };

    const handleLogout = () => {
        dispatch(logout());
        navigation.navigate('Login');
    };

    // Universal date formatter that handles multiple input formats
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";

        try {
            // Remove any extra spaces and trim
            dateString = dateString.toString().trim();

            // Handle different separator types and formats
            let date;

            // Try parsing as ISO format (YYYY-MM-DD)
            if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
                const [year, month, day] = dateString.split('-');
                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
            // Try parsing as DD-MM-YYYY format
            else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
                const [day, month, year] = dateString.split('-');
                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
            // Try parsing as DD/MM/YYYY format
            else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
                const [day, month, year] = dateString.split('/');
                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
            // Try parsing as YYYY/MM/DD format
            else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateString)) {
                const [year, month, day] = dateString.split('/');
                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
            // Try parsing as standard Date string
            else {
                date = new Date(dateString);
            }

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "N/A";
            }

            // Format to DD/MM/YYYY
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;

        } catch (error) {
            console.error('Date formatting error:', error);
            return "N/A";
        }
    };

    // Map API status to UI status labels
    const getStatusLabel = (status: string) => {
        switch (status) {
            case "open": return "Open";
            case "in_progress": return "In Progress";
            case "closed": return "Closed";
            case "temporary_closed": return "Temporary Closed";
            default: return status;
        }
    };

    // Simpler version without helper function
    const filteredTickets = (maintenanceList || [])
        .filter((ticket) => {
            const matchesTab = selectedTab === "closed"
                ? (ticket.status === "closed" || ticket.status === "temporary_closed")
                : ticket.status === selectedTab;

            const matchesSearch = searchText === "" ||
                ticket.ticket_no.toLowerCase().includes(searchText.toLowerCase()) ||
                (ticket.title && ticket.title.toLowerCase().includes(searchText.toLowerCase())) ||
                ticket.asset_no.toLowerCase().includes(searchText.toLowerCase());

            return matchesTab && matchesSearch;
        })
        .sort((a, b) => {
            // Helper function inside the sort
            const parseDate = (dateString: string): Date | null => {
                if (!dateString) return null;
                try {
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? null : date;
                } catch {
                    return null;
                }
            };

            // First, sort by breakdown date (oldest first)
            const dateA = parseDate(a.issue_date);
            const dateB = parseDate(b.issue_date);

            if (dateA && dateB) {
                const dateComparison = dateA.getTime() - dateB.getTime();
                if (dateComparison !== 0) {
                    return dateComparison;
                }
            }

            // If breakdown dates are the same or invalid, sort by create date (oldest first)
            const createDateA = parseDate(a.compaint_date || a.created_at);
            const createDateB = parseDate(b.compaint_date || b.created_at);

            if (createDateA && createDateB) {
                return createDateA.getTime() - createDateB.getTime();
            }

            // Fallback: sort by ticket ID if dates are invalid
            return a.id - b.id;
        });

    const truncateText = (text: string, limit: number) => {
        if (!text) return "No Title";
        return text.length > limit ? text.substring(0, limit) + "..." : text;
    };

    // Also update the getTicketCount function:
    const getTicketCount = (status: string) => {
        if (status === "closed") {
            return (maintenanceList || []).filter(ticket =>
                ticket.status === "closed" || ticket.status === "temporary_closed"
            ).length;
        }
        return (maintenanceList || []).filter(ticket => ticket.status === status).length;
    };

    // Get tab active color based on tab key
    const getTabActiveColor = (tabKey: string) => {
        switch (tabKey) {
            case "open": return "#0FA37F";
            case "in_progress": return "#1271EE";
            case "closed": return "#ff0202";
            default: return "#0FA37F";
        }
    };

    const renderTicket = ({ item }: any) => {
        const showEngineer = selectedTab === "in_progress" || selectedTab === "closed";
        const statusLabel = getStatusLabel(item.status);
        const showCloserRequested = item.is_ready_for_closer;
        const isTemporaryClosed = item.status === "temporary_closed";

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    if (selectedTab === "open") {
                        navigation.navigate("AssetDetailsScreen", { maintenanceId: item.id });
                    } else if (selectedTab === "in_progress") {
                        navigation.navigate("AssetDetailsScreen", { maintenanceId: item.id });
                    } else if (selectedTab === "closed") {
                        navigation.navigate("AssetDetailsScreen", { maintenanceId: item.id });
                    }
                }}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.ticketIdContainer}>
                        <Text style={styles.label}>Ticket ID</Text>
                        <Text style={styles.ticketId} numberOfLines={1} ellipsizeMode="tail">
                            {item.ticket_no}
                        </Text>
                    </View>
                    <View style={styles.complainDateContainer}>
                        <Text style={styles.label}>Complain Date</Text>
                        <Text style={styles.complainDate} numberOfLines={1} ellipsizeMode="tail">
                            {formatDate(item.compaint_date)}
                        </Text>
                    </View>
                </View>

                {/* Breakdown Info */}
                <View style={styles.breakdownContainer}>
                    <View style={styles.breakdownTitleContainer}>
                        <Text style={styles.label}>Breakdown Title</Text>
                        <Text style={styles.breakdownTitle} numberOfLines={2}>
                            {item.title || "No Title"}
                        </Text>
                    </View>
                    <View style={styles.breakdownSinceContainer}>
                        <Text style={styles.label}>Breakdown from</Text>
                        <Text style={styles.breakdownSince} numberOfLines={1} ellipsizeMode="tail">
                            {formatDate(item.issue_date)}
                        </Text>
                    </View>
                </View>

                <View style={styles.categoryPriorityContainer}>
                    <View style={styles.categoryContainer}>
                        <Text style={styles.label}>Service Category</Text>
                        <Text style={styles.serviceCategory} numberOfLines={1} ellipsizeMode="tail">
                            {item.types === "warranty" ? "Warranty" :
                                item.types === "non_warranty" ? "Non-Warranty" :
                                    item.types === "safety_notice" ? "Safety Notice" :
                                        item.types || "Not Specified"}
                        </Text>
                    </View>
                    <View style={styles.priorityContainer}>
                        <Text style={styles.label}>Priority</Text>
                        <Text style={[styles.priority, getPriorityStyle(item.priority)]} numberOfLines={1}>
                            {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : "Not Set"}
                        </Text>
                    </View>
                </View>

                {/* Assigned Engineer - Show in In Progress and Closed tabs */}
                {showEngineer && (
                    <View style={styles.statusContainer}>
                        <View style={styles.statusLabelContainer}>
                            <Text style={styles.label}>Assigned Engineer</Text>
                            <View style={styles.engineerRow}>
                                <Text style={styles.status} numberOfLines={1}>
                                    {item.serviceSalePerson?.[0] || "Not Assigned"}
                                </Text>
                                {showCloserRequested && (
                                    <View style={styles.closerRequestedBadge}>
                                        <Text style={styles.closerRequestedText}>Closer Requested</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Status - Only show in closed tab */}
                {selectedTab === "closed" && (
                    <View style={styles.statusRow}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={[
                            styles.statusBadge,
                            isTemporaryClosed && styles.temporaryClosedBadge,
                            item.status === "closed" && styles.closedBadge,
                            item.status === "open" && styles.openBadge,
                            item.status === "in_progress" && styles.inProgressBadge
                        ]}>
                            {statusLabel}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading && maintenanceList?.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0FA37F" />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <View style={styles.errorButtonContainer}>
                        <TouchableOpacity style={styles.retryButton} onPress={loadMaintenanceData}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

            <View style={styles.container}>
                {/* Sticky Header */}
                <View>
                    <Header />
                </View>

                {/* Search with Plus and Clear Icons */}
                <View style={styles.searchRow}>
                    <View style={styles.searchContainer}>
                        <TextInput
                            placeholder="Search"
                            placeholderTextColor="#888"
                            style={styles.searchInput}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <View style={styles.searchIconsContainer}>
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={handleClearSearch} style={styles.iconButton}>
                                    <Icon name="close" size={22} color="#000" />
                                </TouchableOpacity>
                            )}
                            <Icon name="magnify" size={22} color="#000" />
                        </View>
                    </View>
                    <TouchableOpacity onPress={handlePlusPress} style={styles.plusButton}>
                        <Icon name="plus" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    {[
                        { key: "open", label: "Open" },
                        { key: "in_progress", label: "In Progress" },
                        { key: "closed", label: "Closed" }
                    ].map((tab) => {
                        const isActive = selectedTab === tab.key;
                        const activeColor = getTabActiveColor(tab.key);

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.tab,
                                    isActive && {
                                        borderBottomColor: activeColor,
                                        borderBottomWidth: 2,
                                        paddingBottom: 4
                                    }
                                ]}
                                onPress={() => setSelectedTab(tab.key)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        isActive && { color: activeColor, fontWeight: "600" }
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                                <View
                                    style={[
                                        styles.counter,
                                        tab.key === "open" && styles.counterGreen,
                                        tab.key === "in_progress" && styles.counterBlue,
                                        tab.key === "closed" && styles.counterRed
                                    ]}
                                >
                                    <Text style={styles.counterText}>
                                        {getTicketCount(tab.key)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Tickets List */}
                <FlatList
                    data={filteredTickets}
                    renderItem={renderTicket}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={loadMaintenanceData}
                            colors={["#0FA37F"]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchText ? "No matching tickets found" : "No tickets found"}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
};

// Priority Colors
const getPriorityStyle = (priority: string | null) => {
    switch (priority) {
        case "high":
            return { backgroundColor: "#ff0202", fontWeight: "700" as const };
        case "medium":
            return { backgroundColor: "#0FA37F", fontWeight: "700" as const };
        case "low":
            return { backgroundColor: "#1271EE", fontWeight: "700" as const };
        default:
            return { backgroundColor: "#aaa" };
    }
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    logo: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        fontFamily: 'Inter-Bold',
    },
    profilePic: { width: 36, height: 36, borderRadius: 18 },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 6,
        paddingRight: 10,
        fontFamily: 'Inter-Regular',
    },
    searchIconsContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconButton: {
        padding: 4,
        marginRight: 8,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#ddd",
        paddingRight: 8,
    },
    plusButton: {
        backgroundColor: "#097C69",
        width: 40,
        height: 40,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
    tabs: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 16,
        marginTop: 16,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: 4,
    },
    tabText: {
        fontSize: 14,
        color: "#000",
        fontFamily: 'Inter-Regular',
    },
    counter: {
        marginLeft: 4,
        paddingHorizontal: 6,
        borderRadius: 10,
    },
    counterGreen: {
        backgroundColor: "#0FA37F",
    },
    counterBlue: {
        backgroundColor: "#1271EE",
    },
    counterRed: {
        backgroundColor: "#ff0202",
    },
    counterText: {
        color: "#fff",
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    row: { flexDirection: "row", alignItems: "center" },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
        paddingBottom: 10,
    },
    errorText: {
        color: "#ff0202",
        fontSize: 16,
        marginBottom: 16,
        textAlign: "center",
        fontFamily: 'Inter-Regular',
    },
    retryButton: {
        backgroundColor: "#0FA37F",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: "#fff",
        fontWeight: "600",
        fontFamily: 'Inter-SemiBold',
    },
    emptyContainer: {
        padding: 20,
        alignItems: "center",
    },
    emptyText: {
        color: "#666",
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },

    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    ticketIdContainer: {
        flex: 1,
        marginRight: 8,
    },
    complainDateContainer: {
        alignItems: 'flex-end',
    },
    breakdownContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    breakdownTitleContainer: {
        flex: 1,
        marginRight: 8,
    },
    breakdownSinceContainer: {
        alignItems: 'flex-end',
        minWidth: 100, // Ensure minimum width for date
    },
    categoryPriorityContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryContainer: {
        flex: 1,
        marginRight: 8,
    },
    priorityContainer: {
        alignItems: 'flex-end',
        minWidth: 80, // Ensure minimum width for priority badge
    },
    statusContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statusLabelContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
        fontFamily: 'Inter-Regular',
    },
    ticketId: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        fontFamily: 'Inter-SemiBold',
    },
    complainDate: {
        fontSize: 14,
        color: "#000",
        fontWeight: "500",
        textAlign: "right",
        fontFamily: 'Inter-Medium',
    },
    breakdownTitle: {
        fontSize: 16,
        fontWeight: "500",
        color: "#000",
        flexShrink: 1, // Allow text to wrap
        fontFamily: 'Inter-Medium',
    },
    breakdownSince: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
        fontFamily: 'Inter-Medium',
    },
    serviceCategory: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
        fontFamily: 'Inter-Medium',
    },
    priority: {
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 4,
        textTransform: "capitalize",
        color: "#fff",
        fontWeight: "700" as const,
        textAlign: 'center',
        minWidth: 70, // Ensure consistent width
        fontFamily: 'Inter-Bold',
    },
    status: {
        color: "#1271EE",
        fontSize: 14,
        fontWeight: "500",
        fontFamily: 'Inter-Medium',
        flex: 1,
    },
    errorButtonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    logoutButton: {
        backgroundColor: "#ff0202",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    logoutText: {
        color: "#fff",
        fontWeight: "600",
        fontFamily: 'Inter-SemiBold',
    },
    // New styles for closer requested badge
    engineerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    closerRequestedBadge: {
        backgroundColor: "#FFEBEE",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#D32F2F",
    },
    closerRequestedText: {
        color: "#D32F2F",
        fontSize: 12,
        fontWeight: "600",
        fontFamily: 'Inter-SemiBold',
    },
    // Status row styles
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    statusBadge: {
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        textTransform: "capitalize",
        color: "#fff",
        fontWeight: "600" as const,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        minWidth: 100,
    },
    temporaryClosedBadge: {
        backgroundColor: "#FFA500",
    },
    closedBadge: {
        backgroundColor: "#ff0202",
    },
    openBadge: {
        backgroundColor: "#0FA37F",
    },
    inProgressBadge: {
        backgroundColor: "#1271EE",
    },
});