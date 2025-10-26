import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
    SafeAreaView
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from "react-redux";
import {
    fetchInventoryParts,
    removeParts,
    clearPartsError,
    selectInventoryError,
    selectInventoryLoading,
    selectInventoryParts,
    selectRemovalError,
    selectRemovalLoading
} from "../Redux/Slices/partsSlice";
import { Header } from "./Header";

interface PartRemoval {
    part_id: number;
    maintenance_id: string;
    quantity: string;
}

interface InventoryPart {
    id: number;
    part_no: string;
    part_name: string;
    description?: string;
    available_quantity?: number;
    price?: string[];
    quantity?: number;
}

const ITEMS_PER_PAGE = 20;
const SEARCH_DELAY_MS = 300;
interface RouteParams {
    maintenanceId?: string;
    onGoBack?: () => void;
}

const RemovePartsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();

    // Get maintenanceId from route params
    const { maintenanceId: routeMaintenanceId, onGoBack }: RouteParams = route.params || {};

    console.log("Route maintenanceId:", routeMaintenanceId);

    const inventoryParts = useSelector(selectInventoryParts);
    const loading = useSelector(selectInventoryLoading);
    const error = useSelector(selectInventoryError);
    const removalLoading = useSelector(selectRemovalLoading);
    const removalError = useSelector(selectRemovalError);

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedParts, setSelectedParts] = useState<{ [key: number]: PartRemoval }>({});

    console.log("||||||||||||||||||||||||||", selectedParts)

    useEffect(() => {
        dispatch(fetchInventoryParts() as any);
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            Alert.alert("Error", error);
            dispatch(clearPartsError());
        }

        if (removalError) {
            Alert.alert("Error", removalError);
            dispatch(clearPartsError());
        }
    }, [error, removalError, dispatch]);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setCurrentPage(1); // Reset to first page on search
        }, SEARCH_DELAY_MS);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // Filter and paginate parts
    const { filteredParts, totalPages } = useMemo(() => {
        if (!inventoryParts || inventoryParts.length === 0) {
            return { filteredParts: [], totalPages: 0 };
        }

        let filtered = inventoryParts;

        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            filtered = inventoryParts.filter(part =>
                part?.part_no?.toLowerCase().includes(query) ||
                part?.part_name?.toLowerCase().includes(query) ||
                part?.description?.toLowerCase().includes(query)
            );
        }

        // Calculate total pages
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

        // Apply pagination
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedParts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return { filteredParts: paginatedParts, totalPages };
    }, [inventoryParts, debouncedSearchQuery, currentPage]);

    const togglePartSelection = useCallback((part: InventoryPart) => {
        setSelectedParts(prev => {
            if (prev[part.id]) {
                const newSelection = { ...prev };
                delete newSelection[part.id];
                return newSelection;
            } else {
                return {
                    ...prev,
                    [part.id]: {
                        part_id: part.id, // Store just the ID, not an array
                        maintenance_id: routeMaintenanceId,
                        quantity: "1"
                    }
                };
            }
        });
    }, [routeMaintenanceId]);

    const updateQuantity = useCallback((partId: number, quantity: string) => {
        // Allow only numeric input
        const numericQuantity = quantity.replace(/[^0-9]/g, '');
        setSelectedParts(prev => ({
            ...prev,
            [partId]: {
                ...prev[partId],
                quantity: numericQuantity || "1"
            }
        }));
    }, []);

    const handleSubmit = async () => {
        try {
            const partsToRemove = Object.values(selectedParts);

            if (partsToRemove.length === 0) {
                Alert.alert("Error", "Please select at least one part");
                return;
            }

            // Clean up the payload to match the required structure
            const cleanPayload = partsToRemove.map(part => {
                // Ensure part_id is always a single number, not an array
                let partId = part.part_id;

                // If part_id is an array, take the first element
                if (Array.isArray(partId)) {
                    partId = partId[0];
                }

                // If the first element is still an array (nested), extract it
                if (Array.isArray(partId)) {
                    partId = partId[0];
                }

                return {
                    part_id: partId,
                    maintenance_id: part.maintenance_id,
                    quantity: parseInt(part.quantity) || 1
                };
            });

            console.log("Submitting payload:", cleanPayload);

            const result = await dispatch(removeParts(cleanPayload) as any);

            if (removeParts.fulfilled.match(result)) {
                Alert.alert("Success", "Parts removal requested successfully");
                // Call the callback to refresh data in parent
                if (onGoBack) {
                    onGoBack();
                }
                navigation.goBack();
            }
        } catch (error: any) {
            console.error("Remove parts error:", error);
        }
    };

    const renderPaginationControls = () => {
        if (totalPages <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                <TouchableOpacity
                    style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                >
                    <Icon name="chevron-left" size={20} color={currentPage === 1 ? "#ccc" : "#dc3545"} />
                    <Text style={[styles.paginationText, currentPage === 1 && styles.paginationTextDisabled]}>
                        Previous
                    </Text>
                </TouchableOpacity>

                <Text style={styles.paginationInfo}>
                    Page {currentPage} of {totalPages}
                </Text>

                <TouchableOpacity
                    style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                >
                    <Text style={[styles.paginationText, currentPage === totalPages && styles.paginationTextDisabled]}>
                        Next
                    </Text>
                    <Icon name="chevron-right" size={20} color={currentPage === totalPages ? "#ccc" : "#dc3545"} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderPartItem = useCallback(({ item }: { item: InventoryPart }) => (
        <View style={[
            styles.partCard,
            selectedParts[item.id] && styles.selectedPartCard
        ]}>
            <TouchableOpacity onPress={() => togglePartSelection(item)}>
                <View style={styles.partHeader}>
                    <View style={styles.partInfo}>
                        <Text style={styles.partNo}>{item.part_no}</Text>
                        <Text style={styles.partDesc} numberOfLines={2}>
                            {item.part_name || item.description}
                        </Text>
                        {item.available_quantity !== undefined && (
                            <Text style={styles.availableText}>
                                Available: {item.available_quantity}
                            </Text>
                        )}
                    </View>
                    <Icon
                        name={selectedParts[item.id] ? "check-box" : "check-box-outline-blank"}
                        size={24}
                        color={selectedParts[item.id] ? "#dc3545" : "#666"}
                    />
                </View>
            </TouchableOpacity>

            {selectedParts[item.id] && (
                <View style={styles.detailsContainer}>
                    <TextInput
                        style={styles.quantityInput}
                        placeholder="Quantity to remove"
                        value={selectedParts[item.id].quantity}
                        onChangeText={(text) => updateQuantity(item.id, text)}
                        keyboardType="numeric"
                    />
                </View>
            )}
        </View>
    ), [selectedParts, togglePartSelection, updateQuantity]);

    const totalSelectedParts = Object.keys(selectedParts).length;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <Header />
            </View>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Remove Parts</Text>
                    <View style={styles.headerRight} />
                </View>


                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search parts by name, number or description..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {debouncedSearchQuery && (
                        <View style={styles.searchInfo}>
                            <Text style={styles.searchInfoText}>
                                Found {filteredParts.length} results for "{debouncedSearchQuery}"
                            </Text>
                        </View>
                    )}
                </View>

                {renderPaginationControls()}

                {loading ? (
                    <ActivityIndicator size="large" color="#dc3545" style={styles.loader} />
                ) : (
                    <FlatList
                        data={filteredParts}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderPartItem}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Icon name="inventory" size={50} color="#ccc" />
                                <Text style={styles.emptyText}>
                                    {debouncedSearchQuery ? "No parts found" : "No parts available"}
                                </Text>
                                <Text style={styles.emptySubText}>
                                    {debouncedSearchQuery ? "Try a different search term" : "Check back later"}
                                </Text>
                            </View>
                        }
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                    />
                )}

                {totalSelectedParts > 0 && (
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={removalLoading}
                    >
                        <Text style={styles.submitButtonText}>
                            {removalLoading ? "Processing..." : `Remove ${totalSelectedParts} Parts`}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    stickyHeader: {
        padding: 16,

    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    headerRight: {
        width: 30,
    },
    searchSection: {
        position: "relative",
        zIndex: 1000,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        margin: 10,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
    },
    searchInfo: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    searchInfoText: {
        fontSize: 14,
        color: "#666",
    },
    loader: {
        marginTop: 50,
    },
    partCard: {
        backgroundColor: "#fff",
        margin: 10,
        borderRadius: 10,
        padding: 15,
    },
    selectedPartCard: {
        borderWidth: 2,
        borderColor: "#dc3545",
    },
    partHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    partInfo: {
        flex: 1,
        marginRight: 10,
    },
    partNo: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    partDesc: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    availableText: {
        fontSize: 12,
        color: "#0FA37F",
        marginTop: 4,
    },
    detailsContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    emptyContainer: {
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
    },
    submitButton: {
        backgroundColor: "#dc3545",
        margin: 15,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    // Pagination styles
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    paginationButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        borderRadius: 5,
        backgroundColor: "#f0f0f0",
    },
    paginationButtonDisabled: {
        backgroundColor: "#f5f5f5",
    },
    paginationText: {
        marginHorizontal: 5,
        color: "#dc3545",
        fontWeight: "500",
    },
    paginationTextDisabled: {
        color: "#ccc",
    },
    paginationInfo: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
});

export default RemovePartsScreen;