import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Modal,
    TextInput,
    Alert,
    PanResponder,
    Animated,
    Dimensions,
    SafeAreaView,
    RefreshControl
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchWalletParts, selectWalletParts, selectPartsLoading, selectPartsError } from "../Redux/Slices/partsSlice";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WalletPart } from "../api/maintenanceApi";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Utils/types";
import { Header } from "./Header";
import { authClient } from "../services/api.clients";
import { APIEndpoints } from "../services/api.endpoints";


const { height } = Dimensions.get('window');

// Install Part API Function
const installPart = async (installData: any[]): Promise<any> => {
    try {
        const response = await authClient.post(APIEndpoints.installPart, installData);
        return response.data;
    } catch (error) {
        console.error('Install part error:', error);
        throw error;
    }
};

const SePartsDetails = () => {
    const route = useRoute();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const dispatch = useDispatch();

    const { maintenanceId, status }: any = route.params || {};

    const walletParts = useSelector(selectWalletParts);
    const loading = useSelector(selectPartsLoading);
    const error = useSelector(selectPartsError);

    const [filter, setFilter] = useState("all");
    const [expandedItems, setExpandedItems] = useState<number[]>([]);
    const [showAllParts, setShowAllParts] = useState(false);
    const [selectedParts, setSelectedParts] = useState<WalletPart[]>([]);
    const [showInstallDrawer, setShowInstallDrawer] = useState(false);
    const [quantityInputs, setQuantityInputs] = useState<{ [key: number]: string }>({});
    const [drawerHeight] = useState(new Animated.Value(0));
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [installing, setInstalling] = useState(false);

    // Fetch data on component mount and when screen comes into focus
    const loadData = useCallback(() => {
        dispatch(fetchWalletParts() as any);
    }, [dispatch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchWalletParts() as any);
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    }, [dispatch]);

    const toggleItemExpansion = (id: number) => {
        if (expandedItems.includes(id)) {
            setExpandedItems(expandedItems.filter(itemId => itemId !== id));
        } else {
            setExpandedItems([...expandedItems, id]);
        }
    };

    // Helper function to check if part is already installed
    const isPartInstalled = (part: WalletPart) => {
        return part.install_quantity !== null && part.install_quantity > 0;
    };

    // Helper function to check if part can be selected for installation
    const canSelectPartForInstallation = (part: WalletPart) => {
        return part.is_approved &&
            !part.is_removal_part &&
            !isPartInstalled(part) &&
            part.approve_quantity > 0;
    };

    const togglePartSelection = (part: WalletPart) => {
        if (selectedParts.some(p => p.id === part.id)) {
            setSelectedParts(selectedParts.filter(p => p.id !== part.id));
            const newInputs = { ...quantityInputs };
            delete newInputs[part.id];
            setQuantityInputs(newInputs);
        } else {
            setSelectedParts([...selectedParts, part]);
            setQuantityInputs({
                ...quantityInputs,
                [part.id]: "1" // Start with minimum quantity of 1 instead of approved quantity
            });
        }
    };

    const handleQuantityChange = (partId: number, value: string) => {
        // Allow only numbers
        const numericValue = value.replace(/[^0-9]/g, '');

        // If empty, set to minimum 1
        if (numericValue === '') {
            setQuantityInputs({
                ...quantityInputs,
                [partId]: "1"
            });
            return;
        }

        const quantity = parseInt(numericValue);
        const part = selectedParts.find(p => p.id === partId);
        const maxQuantity = part?.approve_quantity || 1;

        // Ensure quantity is at least 1
        const validatedQuantity = Math.max(1, quantity);

        // Ensure quantity doesn't exceed approved quantity
        const finalQuantity = Math.min(validatedQuantity, maxQuantity);

        setQuantityInputs({
            ...quantityInputs,
            [partId]: finalQuantity.toString()
        });
    };

    const handleInstallSubmit = async () => {
        if (installing) return;

        // Validate quantities
        for (const part of selectedParts) {
            const quantity = parseInt(quantityInputs[part.id] || "0");
            if (quantity <= 0) {
                Alert.alert("Error", `Please enter a valid quantity for part ${part.part_no}`);
                return;
            }
            if (quantity > part.approve_quantity) {
                Alert.alert("Error", `Cannot install more than approved quantity (${part.approve_quantity}) for part ${part.part_no}`);
                return;
            }
        }

        const installData = selectedParts.map(part => ({
            part_id: part.id,
            maintenance_id: part.maintenance_id,
            quantity: quantityInputs[part.id] || "0"
        }));

        console.log("Install data:", installData);

        setInstalling(true);
        try {
            // Call the installPart API directly
            await installPart(installData);

            Alert.alert("Success", "Parts installed successfully!");
            closeInstallDrawer();
            setSelectedParts([]);
            setQuantityInputs({});

            // Refresh data after installation
            loadData();
        } catch (error: any) {
            console.error("Installation error:", error);
            Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to install parts. Please try again."
            );
        } finally {
            setInstalling(false);
        }
    };

    const openInstallDrawer = () => {
        setShowInstallDrawer(true);
        Animated.timing(drawerHeight, {
            toValue: height * 0.7,
            duration: 300,
            useNativeDriver: false
        }).start();
    };

    const closeInstallDrawer = () => {
        Animated.timing(drawerHeight, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false
        }).start(() => setShowInstallDrawer(false));
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            if (gestureState.dy > 0) {
                drawerHeight.setValue(height * 0.7 - gestureState.dy);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dy > 100) {
                closeInstallDrawer();
            } else {
                Animated.spring(drawerHeight, {
                    toValue: height * 0.7,
                    useNativeDriver: false
                }).start();
            }
        }
    });

    // Filter parts based on search query and other filters
    const filteredParts = (walletParts || [])
        .filter(part => {
            if (showAllParts) return true;
            return !maintenanceId || part.maintenance_id === maintenanceId;
        })
        .filter(part => {
            switch (filter) {
                case "installed":
                    return isPartInstalled(part);
                case "removed":
                    return part.is_removal_part;
                case "approved":
                    return part.is_approved;
                case "pending":
                    return !part.is_approved;
                default:
                    return true;
            }
        })
        .filter(part => {
            if (!searchQuery) return true;

            const query = searchQuery.toLowerCase();
            return (
                part.part_no?.toLowerCase().includes(query) ||
                part.maintenance_id?.toLowerCase().includes(query) ||
                getStatusText(part).toLowerCase().includes(query)
            );
        });

    const getStatusColor = (part: WalletPart) => {
        if (isPartInstalled(part)) return "#2196F3"; // Blue for installed
        if (part.is_approved) return "#0FA37F"; // Green for approved
        if (part.is_removal_part) return "#dc3545"; // Red for removal
        return "#f7b267"; // Orange for pending
    };

    const getStatusText = (part: WalletPart) => {
        if (isPartInstalled(part)) return "Installed";
        if (part.is_approved) return "Approved";
        if (part.is_removal_part) return "Removal Part";
        return "Pending Approval";
    };

    const getStatusIcon = (part: WalletPart) => {
        if (isPartInstalled(part)) return "check-circle";
        if (part.is_approved) return "check-circle";
        if (part.is_removal_part) return "remove-circle";
        return "pending";
    };

    if (loading && !refreshing) {
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
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadData}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    console.log("Rendering SePartsDetails with maintenanceId:", maintenanceId, "and status:", status);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <Header />
            </View>

            {/* Main Content */}
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>

                    <View style={styles.headerRightButtons}>
                        {status !== "closed" && (
                            <>
                                <TouchableOpacity
                                    style={[styles.headerButton, styles.requestButton]}
                                    onPress={() => navigation.navigate("RequestParts", { maintenanceId, onGoBack: loadData })}
                                >
                                    <Icon name="add" size={18} color="#fff" />
                                    <Text style={styles.headerButtonText}>Request</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.headerButton, styles.removeButton]}
                                    onPress={() => navigation.navigate("RemoveParts", { maintenanceId, onGoBack: loadData })}
                                >
                                    <Icon name="remove" size={18} color="#fff" />
                                    <Text style={styles.headerButtonText}>Remove</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                    <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                            <Icon name="close" size={18} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Show All Button */}
                <TouchableOpacity
                    style={[styles.showAllButton, showAllParts && styles.showAllButtonActive]}
                    onPress={() => setShowAllParts(!showAllParts)}
                >
                    <Text style={[styles.showAllText, showAllParts && styles.showAllTextActive]}>
                        {showAllParts ? "Show Filtered" : "Show All Parts"}
                    </Text>
                </TouchableOpacity>

                {/* Filter Buttons */}
                <View style={styles.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContainer}
                    >
                        <TouchableOpacity
                            style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
                            onPress={() => setFilter("all")}
                        >
                            <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>All Parts</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, filter === "installed" && styles.filterButtonActive]}
                            onPress={() => setFilter("installed")}
                        >
                            <Text style={[styles.filterText, filter === "installed" && styles.filterTextActive]}>Installed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, filter === "removed" && styles.filterButtonActive]}
                            onPress={() => setFilter("removed")}
                        >
                            <Text style={[styles.filterText, filter === "removed" && styles.filterTextActive]}>Removed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, filter === "approved" && styles.filterButtonActive]}
                            onPress={() => setFilter("approved")}
                        >
                            <Text style={[styles.filterText, filter === "approved" && styles.filterTextActive]}>Approved</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, filter === "pending" && styles.filterButtonActive]}
                            onPress={() => setFilter("pending")}
                        >
                            <Text style={[styles.filterText, filter === "pending" && styles.filterTextActive]}>Pending</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Parts List */}
                <FlatList
                    data={filteredParts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={[
                            styles.partCard,
                            selectedParts.some(p => p.id === item.id) && styles.selectedPartCard
                        ]}>
                            <TouchableOpacity
                                style={styles.partHeader}
                                onPress={() => toggleItemExpansion(item.id)}
                            >
                                <View style={styles.partInfo}>
                                    <View style={styles.partNumberRow}>
                                        <Icon
                                            name={getStatusIcon(item)}
                                            size={20}
                                            color={getStatusColor(item)}
                                            style={styles.statusIcon}
                                        />
                                        <Text style={styles.partNo}>{item.part_no}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
                                        <Text style={styles.statusText}>{getStatusText(item)}</Text>
                                    </View>
                                </View>

                                <View style={styles.headerRightActions}>
                                    {/* Only show checkbox for parts that can be installed */}
                                    {canSelectPartForInstallation(item) && (
                                        <TouchableOpacity
                                            onPress={() => togglePartSelection(item)}
                                            style={styles.checkboxContainer}
                                        >
                                            <Icon
                                                name={selectedParts.some(p => p.id === item.id) ? "check-box" : "check-box-outline-blank"}
                                                size={24}
                                                color={selectedParts.some(p => p.id === item.id) ? "#0FA37F" : "#666"}
                                            />
                                        </TouchableOpacity>
                                    )}
                                    <Icon
                                        name={expandedItems.includes(item.id) ? "expand-less" : "expand-more"}
                                        size={24}
                                        color="#666"
                                    />
                                </View>
                            </TouchableOpacity>

                            {expandedItems.includes(item.id) && (
                                <View style={styles.detailsContainer}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Requested Quantity:</Text>
                                        <Text style={styles.detailValue}>{item.requested_quantity || "N/A"}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Approved Quantity:</Text>
                                        <Text style={styles.detailValue}>{item.approve_quantity}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Already Released:</Text>
                                        <Text style={styles.detailValue}>{item.already_released}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Consumed Quantity:</Text>
                                        <Text style={styles.detailValue}>{item.comsumed_quantity !== null ? item.comsumed_quantity : "N/A"}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Installed Quantity:</Text>
                                        <Text style={styles.detailValue}>{item.install_quantity !== null ? item.install_quantity : "0"}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Requested Date:</Text>
                                        <Text style={styles.detailValue}>
                                            {new Date(item.requested_date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Part Inventory ID:</Text>
                                        <Text style={styles.detailValue}>{item.part_inventory_id || "N/A"}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Install Status:</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
                                            <Text style={styles.statusText}>{getStatusText(item)}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="inventory" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>No parts found</Text>
                            {searchQuery && (
                                <Text style={styles.emptySubText}>Try adjusting your search</Text>
                            )}
                            {maintenanceId && !searchQuery && (
                                <Text style={styles.emptySubText}>for this maintenance request</Text>
                            )}
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#0FA37F"]}
                            tintColor="#0FA37F"
                        />
                    }
                />

                {/* Install Floating Button */}
                {selectedParts.length > 0 && !showInstallDrawer && (
                    <TouchableOpacity
                        style={styles.installFloatingButton}
                        onPress={openInstallDrawer}
                    >
                        <Icon name="build" size={20} color="#fff" />
                        <Text style={styles.installButtonText}>Install ({selectedParts.length})</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Install Drawer - Outside main content with absolute positioning */}
            {showInstallDrawer && (
                <View style={styles.overlay}>
                    <Animated.View
                        style={[styles.drawerContainer, { height: drawerHeight }]}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.drawerHandle} />
                        <Text style={styles.drawerTitle}>Install Parts</Text>

                        <FlatList
                            data={selectedParts}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                                const currentQuantity = parseInt(quantityInputs[item.id] || "1");
                                const maxQuantity = item.approve_quantity;

                                return (
                                    <View style={styles.drawerPartItem}>
                                        <View style={styles.drawerPartInfo}>
                                            <Text style={styles.drawerPartNo}>{item.part_no}</Text>
                                            <Text style={styles.drawerApprovedQty}>Approved: {maxQuantity}</Text>
                                        </View>

                                        <View style={styles.quantityContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.quantityButton,
                                                    currentQuantity <= 1 && styles.quantityButtonDisabled
                                                ]}
                                                onPress={() => {
                                                    if (currentQuantity > 1) {
                                                        handleQuantityChange(item.id, (currentQuantity - 1).toString());
                                                    }
                                                }}
                                                disabled={currentQuantity <= 1}
                                            >
                                                <Icon name="remove" size={16} color={currentQuantity <= 1 ? "#ccc" : "#333"} />
                                            </TouchableOpacity>

                                            <TextInput
                                                style={styles.quantityInput}
                                                value={quantityInputs[item.id] || "1"}
                                                onChangeText={(text) => handleQuantityChange(item.id, text)}
                                                keyboardType="numeric"
                                                placeholder="Qty"
                                                maxLength={5}
                                            />

                                            <TouchableOpacity
                                                style={[
                                                    styles.quantityButton,
                                                    currentQuantity >= maxQuantity && styles.quantityButtonDisabled
                                                ]}
                                                onPress={() => {
                                                    if (currentQuantity < maxQuantity) {
                                                        handleQuantityChange(item.id, (currentQuantity + 1).toString());
                                                    }
                                                }}
                                                disabled={currentQuantity >= maxQuantity}
                                            >
                                                <Icon name="add" size={16} color={currentQuantity >= maxQuantity ? "#ccc" : "#333"} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            }}
                        />

                        <View style={styles.drawerButtons}>
                            <TouchableOpacity
                                style={[styles.drawerButton, styles.cancelButton]}
                                onPress={closeInstallDrawer}
                                disabled={installing}
                            >
                                <Text style={styles.drawerButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.drawerButton, styles.submitButton, installing && styles.submitButtonDisabled]}
                                onPress={handleInstallSubmit}
                                disabled={installing}
                            >
                                {installing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.drawerButtonText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    stickyHeader: {
        padding: 16
    },
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
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
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        backgroundColor: "#fff",
    },
    backButton: {
        padding: 5,
    },
    headerRightButtons: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 5,
        marginLeft: 10,
    },
    requestButton: {
        backgroundColor: "#0FA37F",
    },
    removeButton: {
        backgroundColor: "#dc3545",
    },
    refreshButton: {
        backgroundColor: "#2196F3",
    },
    headerButtonText: {
        color: "#fff",
        marginLeft: 4,
        fontSize: 14,
        fontWeight: "500",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        margin: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
    },
    clearButton: {
        padding: 4,
    },
    showAllButton: {
        padding: 12,
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        margin: 10,
        borderRadius: 8,
    },
    showAllButtonActive: {
        backgroundColor: "#0FA37F",
    },
    showAllText: {
        color: "#666",
        fontSize: 16,
        fontWeight: "500",
    },
    showAllTextActive: {
        color: "#fff",
    },
    filterWrapper: {
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    filterContainer: {
        padding: 10,
    },
    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
        marginRight: 10,
        minWidth: 100,
        alignItems: "center",
    },
    filterButtonActive: {
        backgroundColor: "#0FA37F",
    },
    filterText: {
        color: "#666",
        fontSize: 14,
    },
    filterTextActive: {
        color: "#fff",
        fontWeight: "600",
    },
    installFloatingButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2196F3",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 25,
        zIndex: 999,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    installButtonText: {
        color: "#fff",
        marginLeft: 5,
        fontWeight: "500",
    },
    partCard: {
        backgroundColor: "#fff",
        margin: 10,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedPartCard: {
        borderWidth: 2,
        borderColor: "#0FA37F",
    },
    partHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
    },
    partInfo: {
        flex: 1,
    },
    partNumberRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    statusIcon: {
        marginRight: 8,
    },
    partNo: {
        fontSize: 16,
        fontWeight: "600",
    },
    headerRightActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    checkboxContainer: {
        marginRight: 10,
    },
    statusBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "500",
    },
    detailsContainer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    detailValue: {
        fontSize: 14,
        color: "#333",
    },
    maintenanceId: {
        maxWidth: "50%",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: "#999",
    },
    emptySubText: {
        fontSize: 14,
        color: "#999",
        marginTop: 5,
    },
    errorText: {
        color: "#ff0202",
        fontSize: 16,
        marginBottom: 16,
        textAlign: "center",
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
    },
    // Drawer styles with higher z-index
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        zIndex: 1000, // Higher z-index to ensure it's above everything
    },
    drawerContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        maxHeight: height * 0.7,
    },
    drawerHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    drawerTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 15,
        textAlign: "center",
    },
    drawerPartItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    drawerPartInfo: {
        flex: 1,
    },
    drawerPartNo: {
        fontSize: 16,
        fontWeight: "500",
    },
    drawerApprovedQty: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },
    drawerButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    drawerButton: {
        padding: 12,
        borderRadius: 5,
        minWidth: 100,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "#dc3545",
    },
    submitButton: {
        backgroundColor: "#0FA37F",
    },
    submitButtonDisabled: {
        backgroundColor: "#ccc",
    },
    drawerButtonText: {
        color: "#fff",
        fontWeight: "600",
    },

    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    quantityButton: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#f8f8f8",
    },
    quantityButtonDisabled: {
        backgroundColor: "#f0f0f0",
        borderColor: "#eee",
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 0,
        padding: 8,
        width: 60,
        textAlign: "center",
        fontSize: 16,
        marginHorizontal: 5,
    },
});

export default SePartsDetails;