import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Keyboard
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from "react-redux";
import {
    searchParts,
    requestParts,
    entryPartToApprove,
    clearPartsError,
    selectSearchedParts,
    selectSearchLoading,
    selectSearchError,
    selectRequestError,
    selectRequestLoading,
    selectLocalPurchaseLoading,
    selectLocalPurchaseError,
    clearSearchedParts
} from "../Redux/Slices/partsSlice";
import { Header } from "./Header";
import debounce from 'lodash/debounce';

interface PartRequest {
    part_id: number | number[];
    maintenance_id: string;
    quantity: string;
    part_no?: string;
}

interface LocalPurchaseItem {
    part_no: string;
    part_name: string;
    part_description: string;
    quantity: string;
    price_per_unit: string;
    total_price: string;
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

const SEARCH_DELAY_MS = 500;

interface RouteParams {
    maintenanceId?: string;
    onGoBack?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RequestPartsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();

    const { maintenanceId: routeMaintenanceId, onGoBack }: RouteParams = route.params || {};

    const searchedParts = useSelector(selectSearchedParts);
    const searchLoading = useSelector(selectSearchLoading);
    const searchError = useSelector(selectSearchError);
    const requestError = useSelector(selectRequestError);
    const requestLoading = useSelector(selectRequestLoading);
    const localPurchaseLoading = useSelector(selectLocalPurchaseLoading);
    const localPurchaseError = useSelector(selectLocalPurchaseError);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedParts, setSelectedParts] = useState<{ [key: number]: PartRequest }>({});
    const [showLocalPurchaseModal, setShowLocalPurchaseModal] = useState(false);
    const [localPurchaseItems, setLocalPurchaseItems] = useState<LocalPurchaseItem[]>([
        {
            part_no: "",
            part_name: "",
            part_description: "",
            quantity: "1",
            price_per_unit: "",
            total_price: "0"
        }
    ]);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Keyboard listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Debounced search function
    const debouncedSearch = useRef(
        debounce((query: string) => {
            if (query.trim().length > 0) {
                dispatch(searchParts(query) as any);
            } else {
                dispatch(clearSearchedParts());
            }
        }, SEARCH_DELAY_MS)
    ).current;

    useEffect(() => {
        // Clear searched parts when component unmounts
        return () => {
            dispatch(clearSearchedParts());
        };
    }, [dispatch]);

    useEffect(() => {
        if (searchError) {
            Alert.alert("Error", searchError);
            dispatch(clearPartsError());
        }

        if (requestError) {
            Alert.alert("Error", requestError);
            dispatch(clearPartsError());
        }

        if (localPurchaseError) {
            Alert.alert("Error", localPurchaseError);
            dispatch(clearPartsError());
        }
    }, [searchError, requestError, localPurchaseError, dispatch]);

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    const handleSearchSelect = (part: InventoryPart) => {
        setSearchQuery(part.part_no);
        togglePartSelection(part);
        // Dismiss keyboard when part is selected
        Keyboard.dismiss();
    };

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
                        part_id: part.id,
                        part_no: part.part_no,
                        maintenance_id: routeMaintenanceId,
                        quantity: "1",
                    }
                };
            }
        });
    }, [routeMaintenanceId]);

    const updateQuantity = useCallback((partId: number, quantity: string) => {
        setSelectedParts(prev => ({
            ...prev,
            [partId]: {
                ...prev[partId],
                quantity
            }
        }));
    }, []);

    const addLocalPurchaseItem = () => {
        setLocalPurchaseItems([...localPurchaseItems,
        {
            part_no: "",
            part_name: "",
            part_description: "",
            quantity: "1",
            price_per_unit: "",
            total_price: "0"
        }
        ]);
    };

    const removeLocalPurchaseItem = (index: number) => {
        if (localPurchaseItems.length > 1) {
            const newItems = [...localPurchaseItems];
            newItems.splice(index, 1);
            setLocalPurchaseItems(newItems);
        }
    };

    const updateLocalPurchaseItem = (index: number, field: keyof LocalPurchaseItem, value: string) => {
        const newItems = [...localPurchaseItems];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'quantity' || field === 'price_per_unit') {
            const quantity = parseFloat(newItems[index].quantity) || 0;
            const price = parseFloat(newItems[index].price_per_unit) || 0;
            newItems[index].total_price = (quantity * price).toFixed(2);
        }

        setLocalPurchaseItems(newItems);
    };

    const handlePartsRequest = async (partsToRequest: PartRequest[]) => {
        try {
            if (partsToRequest.length === 0) {
                Alert.alert("Error", "Please select at least one part");
                return;
            }

            const cleanPayload = partsToRequest.map(part => ({
                quantity: part.quantity,
                part_no: part.part_no || "",
                maintenance_id: part.maintenance_id,
            }));

            const result = await dispatch(requestParts(cleanPayload) as any);

            if (requestParts.fulfilled.match(result)) {
                Alert.alert("Success", "Parts requested successfully");
                // Call the callback to refresh data in parent
                if (onGoBack) {
                    onGoBack();
                }
                navigation.goBack();
            }
        } catch (error: any) {
            console.error("Request parts error:", error);
        }
    };

    // Update the submitLocalPurchase function to call onGoBack after success
    const submitLocalPurchase = async () => {
        for (const item of localPurchaseItems) {
            if (!item.part_no.trim() || !item.quantity.trim() || !item.price_per_unit.trim()) {
                Alert.alert("Error", "Please fill all required fields for local purchase items");
                return;
            }
        }

        try {
            for (const item of localPurchaseItems) {
                const localPurchaseData = {
                    part_no: item.part_no,
                    part_name: item.part_no, // Using part_no as part_name since we removed part_name field
                    part_description: "", // Empty since description removed
                    quantity: parseInt(item.quantity) || 0,
                    price: parseFloat(item.price_per_unit) || 0,
                    maintenance_id: routeMaintenanceId,
                    entry_date: new Date().toISOString().split('T')[0],
                    is_arrived: true,
                    is_refurbish: false
                };

                const result = await dispatch(entryPartToApprove(localPurchaseData) as any);

                if (entryPartToApprove.rejected.match(result)) {
                    throw new Error(result.payload as string);
                }
            }

            Alert.alert("Success", "Local purchase submitted successfully");
            setLocalPurchaseItems([{
                part_no: "",
                part_name: "",
                part_description: "",
                quantity: "1",
                price_per_unit: "",
                total_price: "0"
            }]);
            setShowLocalPurchaseModal(false);

            if (onGoBack) {
                onGoBack();
            }

        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit local purchase");
        }
    };

    const handleSubmit = async () => {
        const partsToRequest = Object.values(selectedParts);
        handlePartsRequest(partsToRequest);
    };

    const totalSelectedParts = Object.keys(selectedParts).length;

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
                            {item.part_name || item.description || 'No description available'}
                        </Text>
                        <Text style={styles.availableText}>
                            Available: {item.quantity || 0}
                        </Text>
                    </View>
                    <Icon
                        name={selectedParts[item.id] ? "check-box" : "check-box-outline-blank"}
                        size={24}
                        color={selectedParts[item.id] ? "#0FA37F" : "#666"}
                    />
                </View>
            </TouchableOpacity>

            {selectedParts[item.id] && (
                <View style={styles.detailsContainer}>
                    <TextInput
                        style={styles.quantityInput}
                        placeholder="Quantity"
                        placeholderTextColor="#999"
                        value={selectedParts[item.id].quantity}
                        onChangeText={(text) => updateQuantity(item.id, text)}
                        keyboardType="numeric"
                    />
                </View>
            )}
        </View>
    ), [selectedParts, togglePartSelection, updateQuantity]);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <Header />
            </View>

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Request Parts</Text>

                    <TouchableOpacity
                        onPress={() => setShowLocalPurchaseModal(true)}
                        style={styles.localPurchaseButton}
                    >
                        <Icon name="local-offer" size={20} color="#fff" />
                        <Text style={styles.localPurchaseButtonText}>Local Purchase</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search parts by name, number or description..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={true}
                        />
                    </View>

                    {searchQuery && (
                        <View style={styles.searchInfo}>
                            <Text style={styles.searchInfoText}>
                                {searchLoading ?
                                    "Searching..." :
                                    `Found ${searchedParts.length} results for "${searchQuery}"`
                                }
                            </Text>
                        </View>
                    )}
                </View>

                {searchLoading ? (
                    <ActivityIndicator size="large" color="#0FA37F" style={styles.loader} />
                ) : (
                    <View style={[
                        styles.listContainer,
                        keyboardVisible && styles.listContainerWithKeyboard
                    ]}>
                        <FlatList
                            data={searchedParts}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderPartItem}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Icon name="inventory" size={50} color="#ccc" />
                                    <Text style={styles.emptyText}>
                                        {searchQuery ? "No parts found" : "Search for parts to request"}
                                    </Text>
                                    <Text style={styles.emptySubText}>
                                        {searchQuery ? "Try a different search term" : "Enter part name or number to search"}
                                    </Text>
                                </View>
                            }
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={searchedParts?.length === 0 ? styles.emptyListContent : undefined}
                        />
                    </View>
                )}

                {(totalSelectedParts > 0) && (
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={requestLoading}
                    >
                        <Text style={styles.submitButtonText}>
                            {requestLoading ? "Processing..." : `Request ${totalSelectedParts} Parts`}
                        </Text>
                    </TouchableOpacity>
                )}

                <Modal
                    visible={showLocalPurchaseModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowLocalPurchaseModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.keyboardAvoidingView}
                        >
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Local Purchase</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowLocalPurchaseModal(false)}
                                        style={styles.modalCloseButton}
                                    >
                                        <Icon name="close" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    style={styles.modalBody}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.modalBodyContent}
                                >
                                    {localPurchaseItems.map((item, index) => (
                                        <View key={index} style={styles.localPurchaseItem}>
                                            <View style={styles.itemHeader}>
                                                <Text style={styles.itemTitle}>Item {index + 1}</Text>
                                                {localPurchaseItems.length > 1 && (
                                                    <TouchableOpacity
                                                        onPress={() => removeLocalPurchaseItem(index)}
                                                        style={styles.removeItemButton}
                                                    >
                                                        <Icon name="remove" size={20} color="#dc3545" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Part Number */}
                                            <Text style={styles.inputLabel}>Part No/Name *</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter part number"
                                                placeholderTextColor="#999"
                                                value={item.part_no}
                                                onChangeText={(text) => updateLocalPurchaseItem(index, 'part_no', text)}
                                            />

                                            {/* Quantity and Price Row */}
                                            <View style={styles.rowInputs}>
                                                <View style={styles.columnInput}>
                                                    <Text style={styles.inputLabel}>Quantity *</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Enter quantity"
                                                        placeholderTextColor="#999"
                                                        value={item.quantity}
                                                        onChangeText={(text) => updateLocalPurchaseItem(index, 'quantity', text)}
                                                        keyboardType="numeric"
                                                    />
                                                </View>

                                                <View style={styles.columnInput}>
                                                    <Text style={styles.inputLabel}>Price/Unit (₹) *</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Enter price"
                                                        placeholderTextColor="#999"
                                                        value={item.price_per_unit}
                                                        onChangeText={(text) => updateLocalPurchaseItem(index, 'price_per_unit', text)}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                            </View>

                                            {/* Total Price (Read-only) */}
                                            <Text style={styles.inputLabel}>Total Price</Text>
                                            <TextInput
                                                style={[styles.input, styles.disabledInput]}
                                                value={`₹${item.total_price}`}
                                                editable={false}
                                            />
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        onPress={addLocalPurchaseItem}
                                        style={styles.addItemButton}
                                    >
                                        <Icon name="add" size={20} color="#0FA37F" />
                                        <Text style={styles.addItemText}>Add Another Item</Text>
                                    </TouchableOpacity>
                                </ScrollView>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setShowLocalPurchaseModal(false)}
                                    >
                                        <Text style={styles.modalButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.submitModalButton]}
                                        onPress={submitLocalPurchase}
                                        disabled={localPurchaseLoading}
                                    >
                                        <Text style={styles.modalButtonText}>
                                            {localPurchaseLoading ? "Processing..." : "Submit Purchase"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Updated styles with fixes for keyboard issues
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
        padding: 16
    },
    backButton: {
        padding: 5
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333"
    },
    localPurchaseButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FF9800",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 5
    },
    localPurchaseButtonText: {
        color: "#fff",
        marginLeft: 5,
        fontSize: 12,
        fontWeight: "500"
    },
    searchSection: {
        position: "relative",
        zIndex: 1000
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        margin: 10,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd"
    },
    searchIcon: {
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: "#333",
    },
    searchInfo: {
        paddingHorizontal: 15,
        paddingBottom: 10
    },
    searchInfoText: {
        fontSize: 14,
        color: "#666"
    },
    listContainer: {
        flex: 1,
    },
    listContainerWithKeyboard: {
        flex: 0.7, // Reduce height when keyboard is visible to ensure content fits
    },
    emptyListContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
   
    loader: {
        marginTop: 50
    },
    partCard: {
        backgroundColor: "#fff",
        margin: 10,
        borderRadius: 10,
        padding: 15
    },
    selectedPartCard: {
        borderWidth: 2,
        borderColor: "#0FA37F"
    },
    partHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start"
    },
    partInfo: {
        flex: 1,
        marginRight: 10
    },
    partNo: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333"
    },
    partDesc: {
        fontSize: 14,
        color: "#666",
        marginTop: 4
    },
    availableText: {
        fontSize: 12,
        color: "#0FA37F",
        marginTop: 4
    },
    detailsContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "#eee"
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        color: "#333",
    },
    emptyContainer: {
        alignItems: "center",
        padding: 40
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: "#999"
    },
    emptySubText: {
        fontSize: 14,
        color: "#999"
    },
    submitButton: {
        backgroundColor: "#0FA37F",
        margin: 15,
        padding: 15,
        borderRadius: 8,
        alignItems: "center"
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600"
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center"
    },
    keyboardAvoidingView: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: "90%",
        maxHeight: SCREEN_HEIGHT * 0.75, // Reduced height
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333"
    },
    modalCloseButton: {
        padding: 5
    },
     modalBody: {
        maxHeight: SCREEN_HEIGHT * 0.5, // Reduced height
    },
    modalBodyContent: {
        padding: 15,
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: "#eee"
    },
    modalButton: {
        padding: 12,
        borderRadius: 5,
        minWidth: 100,
        alignItems: "center"
    },
    cancelButton: {
        backgroundColor: "#dc3545"
    },
    submitModalButton: {
        backgroundColor: "#0FA37F"
    },
    modalButtonText: {
        color: "#fff",
        fontWeight: "600"
    },
     localPurchaseItem: {
        marginBottom: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 8,
        backgroundColor: "#fafafa"
    },
     inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 5,
        marginLeft: 5
    },
    input: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        color: "#333",
        marginBottom: 15,
    },
    disabledInput: {
        backgroundColor: "#f5f5f5",
        color: "#666"
    },
    rowInputs: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10
    },
    columnInput: {
        flex: 1
    },
    smallInput: {
        width: "48%"
    },
    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333"
    },
    removeItemButton: {
        padding: 5
    },
    
    addItemButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderWidth: 1,
        borderColor: "#0FA37F",
        borderRadius: 5,
        marginTop: 10,
        marginBottom: 20
    },
    addItemText: {
        color: "#0FA37F",
        marginLeft: 5,
        fontWeight: "600"
    },
});

export default RequestPartsScreen;