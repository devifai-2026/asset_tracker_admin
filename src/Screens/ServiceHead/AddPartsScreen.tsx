// AddPartsScreen.tsx - সম্পূর্ণ ফাইলটি replace করুন
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    FlatList,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Header } from "../Header";
import { useDispatch, useSelector } from "react-redux";
import { 
  searchParts, 
  assignParts, 
  selectSearchedParts, 
  selectSearchLoading,
  clearSearchedParts
} from "../../Redux/Slices/partsSlice";
import debounce from 'lodash/debounce';

const AddPartsScreen = ({ navigation, route }: any) => {
    const { maintenanceId, serviceSalePersonId, onPartsAdded } = route.params;
    const dispatch = useDispatch();
    const searchedParts = useSelector(selectSearchedParts);
    const searchLoading = useSelector(selectSearchLoading);

    const [searchText, setSearchText] = useState("");
    const [selectedParts, setSelectedParts] = useState<{ [key: string]: { part_no: string, quantity: number } }>({});
    const [loading, setLoading] = useState(false);
    const [showQuantityDrawer, setShowQuantityDrawer] = useState(false);
    const [currentEditingPart, setCurrentEditingPart] = useState<any>(null);

    // Debounced search function
    const debouncedSearch = useRef(
        debounce((query: string) => {
            if (query.trim().length > 0) {
                dispatch(searchParts(query) as any);
            }
        }, 500)
    ).current;

    useEffect(() => {
        // Clear searched parts when component unmounts
        return () => {
            dispatch(clearSearchedParts());
        };
    }, [dispatch]);

    useEffect(() => {
        if (searchText.trim().length > 0) {
            debouncedSearch(searchText);
        } else {
            dispatch(clearSearchedParts());
        }
    }, [searchText, debouncedSearch, dispatch]);

    const togglePartSelection = (part: any) => {
        setSelectedParts(prev => {
            const newSelection = { ...prev };
            if (newSelection[part.id]) {
                delete newSelection[part.id];
            } else {
                newSelection[part.id] = {
                    part_no: part.part_no,
                    quantity: 1
                };
                // Open drawer for quantity adjustment when a new part is selected
                setCurrentEditingPart(part);
                setShowQuantityDrawer(true);
            }
            return newSelection;
        });
    };

    const updateQuantity = (partId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        setSelectedParts(prev => ({
            ...prev,
            [partId]: {
                ...prev[partId],
                quantity: newQuantity
            }
        }));
    };

    const handleIncrement = () => {
        if (currentEditingPart) {
            const currentQty = selectedParts[currentEditingPart.id]?.quantity || 1;
            updateQuantity(currentEditingPart.id.toString(), currentQty + 1);
        }
    };

    const handleDecrement = () => {
        if (currentEditingPart) {
            const currentQty = selectedParts[currentEditingPart.id]?.quantity || 1;
            if (currentQty > 1) {
                updateQuantity(currentEditingPart.id.toString(), currentQty - 1);
            }
        }
    };

    const handleQuantityInputChange = (text: string) => {
        if (currentEditingPart) {
            const newQuantity = parseInt(text) || 1;
            updateQuantity(currentEditingPart.id.toString(), newQuantity);
        }
    };

    const removePart = (partId: string) => {
        setSelectedParts(prev => {
            const newSelection = { ...prev };
            delete newSelection[partId];
            return newSelection;
        });
    };

    const handleAssignParts = async () => {
        if (Object.keys(selectedParts).length === 0) {
            Alert.alert("Error", "Please select at least one part");
            return;
        }

        setLoading(true);
        try {
            const partsPayload = Object.entries(selectedParts).map(([id, part]) => ({
                part_no: part.part_no,
                quantity: part.quantity,
                service_sale_person_id: serviceSalePersonId,
                maintenance_id: maintenanceId
            }));

            await dispatch(assignParts(partsPayload) as any);
            Alert.alert("Success", "Parts assigned successfully");
            
            // Call the callback to refresh data in PartsDetails
            if (onPartsAdded) {
                onPartsAdded();
            }
            
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to assign parts");
        } finally {
            setLoading(false);
        }
    };

    const renderPartItem = ({ item }: any) => (
        <View style={styles.partItem}>
            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => togglePartSelection(item)}
            >
                {selectedParts[item.id] ? (
                    <Icon name="checkbox-marked" size={24} color="#00BFA5" />
                ) : (
                    <Icon name="checkbox-blank-outline" size={24} color="#9E9E9E" />
                )}
            </TouchableOpacity>

            <View style={styles.partInfo}>
                <Text style={styles.partNumber}>{item.part_no}</Text>
                <Text style={styles.partDescription} numberOfLines={2}>
                    {item.description || 'No description available'}
                </Text>
                <Text style={styles.stockText}>
                    In Stock: {item.quantity || 0}
                </Text>
            </View>

            {selectedParts[item.id] && (
                <View style={styles.quantityBadge}>
                    <Text style={styles.quantityBadgeText}>
                        Qty: {selectedParts[item.id].quantity}
                    </Text>
                </View>
            )}
        </View>
    );

    const renderSelectedPart = (part: any, partData: any) => (
        <View key={part} style={styles.selectedPartItem}>
            <View style={styles.selectedPartInfo}>
                <Text style={styles.selectedPartNumber}>{partData.part_no}</Text>
                <Text style={styles.selectedPartQuantity}>
                    Quantity: {partData.quantity}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePart(part)}
            >
                <Icon name="close" size={20} color="#FF3B30" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#1A1D29" />
                    <Text style={styles.headerTitle}>Add Parts</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search parts by name or number..."
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor="#9E9E9E"
                    autoFocus={true}
                />
                <Icon name="magnify" size={20} color="#9E9E9E" />
            </View>

            {/* Selected Parts Summary */}
            {Object.keys(selectedParts).length > 0 && (
                <View style={styles.selectedPartsContainer}>
                    <Text style={styles.selectedPartsTitle}>Selected Parts:</Text>
                    <ScrollView style={styles.selectedPartsList}>
                        {Object.entries(selectedParts).map(([partId, partData]) => 
                            renderSelectedPart(partId, partData)
                        )}
                    </ScrollView>
                </View>
            )}

            {searchLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00BFA5" />
                    <Text style={styles.loadingText}>Searching parts...</Text>
                </View>
            ) : (
                <FlatList
                    data={searchedParts}
                    renderItem={renderPartItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    initialNumToRender={20}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            {searchText.length > 0 ? (
                                <Text style={styles.emptyText}>No parts found for "{searchText}"</Text>
                            ) : (
                                <Text style={styles.emptyText}>Search for parts to add</Text>
                            )}
                        </View>
                    }
                />
            )}

            {Object.keys(selectedParts).length > 0 && (
                <TouchableOpacity
                    style={styles.assignButton}
                    onPress={handleAssignParts}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.assignButtonText}>
                            Assign ({Object.keys(selectedParts).length}) Parts
                        </Text>
                    )}
                </TouchableOpacity>
            )}

            {/* Quantity Adjustment Drawer */}
            <Modal
                visible={showQuantityDrawer}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowQuantityDrawer(false)}
            >
                <View style={styles.drawerOverlay}>
                    <View style={styles.drawerContent}>
                        <View style={styles.drawerHandle} />
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>
                                Adjust Quantity for {currentEditingPart?.part_no}
                            </Text>
                            <TouchableOpacity onPress={() => setShowQuantityDrawer(false)}>
                                <Icon name="close" size={24} color="#1A1D29" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.quantityAdjustContainer}>
                            <Text style={styles.availableStock}>
                                Available Stock: {currentEditingPart?.quantity || 0}
                            </Text>
                            
                            <View style={styles.quantityControls}>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={handleDecrement}
                                >
                                    <Icon name="minus" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                                
                                <TextInput
                                    style={styles.quantityInput}
                                    value={currentEditingPart ? 
                                        (selectedParts[currentEditingPart.id]?.quantity || 1).toString() 
                                        : "1"}
                                    onChangeText={handleQuantityInputChange}
                                    keyboardType="numeric"
                                    textAlign="center"
                                />
                                
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={handleIncrement}
                                >
                                    <Icon name="plus" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={() => setShowQuantityDrawer(false)}
                            >
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Styles remain the same as your original file
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
        marginLeft: 8,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E9F2",
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: "#FFFFFF",
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 10,
        paddingRight: 10,
        color: "#1A1D29",
    },
    selectedPartsContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        maxHeight: 150,
    },
    selectedPartsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
        marginBottom: 8,
    },
    selectedPartsList: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 8,
    },
    selectedPartItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E9F2",
    },
    selectedPartInfo: {
        flex: 1,
    },
    selectedPartNumber: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
    },
    selectedPartQuantity: {
        fontSize: 12,
        color: "#6B7280",
    },
    removeButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        color: "#6B7280",
    },
    listContainer: {
        padding: 16,
        paddingBottom: 80,
    },
    partItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    checkboxContainer: {
        marginRight: 12,
    },
    partInfo: {
        flex: 1,
    },
    partNumber: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
        marginBottom: 4,
    },
    partDescription: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 4,
    },
    stockText: {
        fontSize: 12,
        color: "#6B7280",
    },
    quantityBadge: {
        backgroundColor: "#E8F5E9",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    quantityBadgeText: {
        fontSize: 12,
        color: "#00BFA5",
        fontWeight: "600",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: "#9E9E9E",
    },
    assignButton: {
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: "#00BFA5",
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    assignButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    drawerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    drawerContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 20,
    },
    drawerHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#E5E9F2",
        borderRadius: 2,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 8,
    },
    drawerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E9F2",
    },
    drawerTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1D29",
    },
    quantityAdjustContainer: {
        padding: 16,
        alignItems: "center",
    },
    availableStock: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 20,
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    quantityButton: {
        backgroundColor: "#00BFA5",
        borderRadius: 8,
        width: 50,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: "#E5E9F2",
        borderRadius: 8,
        width: 80,
        height: 50,
        marginHorizontal: 16,
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
    },
    confirmButton: {
        backgroundColor: "#00BFA5",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: "center",
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default AddPartsScreen;