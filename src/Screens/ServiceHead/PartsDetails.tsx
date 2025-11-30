// PartsDetails.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Modal,
    FlatList,
    ScrollView,
    Alert,
    RefreshControl
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Header } from "../Header";
import { maintenanceApi } from "../../api/maintenanceApi";
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { fetchMaintenanceDetailNew } from "../../Redux/Slices/maintenanceSlice";
import { useDispatch } from "react-redux";

const PartsDetails = ({ navigation, route }: any) => {
    const [searchText, setSearchText] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [showApproveDrawer, setShowApproveDrawer] = useState(false);
    const [selectedParts, setSelectedParts] = useState<any[]>([]);
    const [partNumber, setPartNumber] = useState("");
    const [quantity, setQuantity] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [approveQuantities, setApproveQuantities] = useState<{ [key: string]: string }>({});
    const [refreshing, setRefreshing] = useState(false);
    const isFocused = useIsFocused();


    // Get serviceSalePersons data from navigation params
    const { serviceSalePersons } = route.params || [];

    // Convert data to the format expected by the component
    const [partsData, setPartsData] = useState<any[]>([]);
    const [engineersData, setEngineersData] = useState<any[]>([]);
    const dispatch = useDispatch();

    // Get maintenanceId from route params
    const { maintenanceId } = route.params || {};
    // Function to load parts data
    const loadPartsData = useCallback(() => {
        console.log("Loading parts data...");
        if (serviceSalePersons && serviceSalePersons.length > 0) {
            // Prepare engineers data for tabs
            const engineers = serviceSalePersons.map((person: any) => ({
                id: person.id.toString(),
                name: person.name,
                wallet: person.wallet || []
            }));

            setEngineersData(engineers);

            // Prepare all parts data - FILTERED by maintenanceId
            const allParts: any[] = [];

            serviceSalePersons.forEach((person: any) => {
                if (person.wallet && person.wallet.length > 0) {
                    person.wallet.forEach((item: any, index: number) => {
                        // Only include parts that match the maintenanceId
                        if (item.maintenance_id === maintenanceId) {
                            // IMPORTANT: Check if it's a local part
                            const isLocalPart = item.is_local_part || false;

                            // For local parts, use approve_quantity as the base quantity
                            // For non-local parts, use requested_quantity
                            const baseQuantity = isLocalPart ?
                                (item.approve_quantity || 0) :
                                (item.requested_quantity || 0);

                            allParts.push({
                                id: item.id?.toString() || `${person.id}-${index}`,
                                partNo: item.part_no || "N/A",
                                requestedBy: person.name,
                                engineerId: person.id.toString(),
                                date: item.requested_date ?
                                    new Date(item.requested_date).toLocaleDateString('en-GB').split('/').join('-') : "N/A",
                                status: item.is_approved ? "approved" : "requested",
                                requestedQuantity: baseQuantity, // Use the calculated base quantity
                                approvedQuantity: item.approve_quantity || null,
                                quantity: baseQuantity, // For compatibility
                                originalData: item,
                                isSelected: false,
                                isLocalPart: isLocalPart // Add this flag for easy access
                            });
                        }
                    });
                }
            });

            console.log("Filtered parts for maintenance ID:", maintenanceId, allParts);
            setPartsData(allParts);
        }
    }, [serviceSalePersons, route.params]);

    // Load data on component mount and when focused
    useEffect(() => {
        loadPartsData();
    }, [loadPartsData]);

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (isFocused) {
                loadPartsData();
            }
        }, [isFocused, loadPartsData])
    );


    // Refresh function for manual refresh
    const refreshPartsData = () => {
        setRefreshing(true);
        loadPartsData();
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Update the navigation to AddPartsScreen to include callback
    const navigateToAddParts = () => {
        navigation.navigate('AddParts', {
            maintenanceId: route.params.maintenanceId,
            serviceSalePersonId: serviceSalePersons.length > 0 ? serviceSalePersons[0].id : null,
            onPartsAdded: refreshPartsData // Pass callback to refresh data when returning
        });
    };

    // Filter parts based on active tab and status filter
    const filteredParts = partsData.filter(part => {
        // Engineer filter
        const engineerMatch = activeTab === "all" || part.engineerId === activeTab;

        // Status filter
        const statusMatch = statusFilter === "all" || part.status === statusFilter;

        // Search filter
        const searchMatch = part.partNo.toLowerCase().includes(searchText.toLowerCase());

        return engineerMatch && statusMatch && searchMatch;
    });

    const handleRequestPart = () => {
        if (partNumber && quantity) {
            const newPart = {
                id: (partsData.length + 1).toString(),
                partNo: partNumber,
                requestedBy: "Engineer",
                date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
                status: "requested",
                quantity: parseInt(quantity) || 1,
                isSelected: false
            };

            setPartsData([...partsData, newPart]);
            setShowAddForm(false);
            setPartNumber("");
            setQuantity("");
        }
    };

    const togglePartSelection = (item: any) => {
        // Only allow selection of requested parts (not approved ones)
        if (item.status === "approved") {
            return;
        }

        const updatedParts = partsData.map(part =>
            part.id === item.id ? { ...part, isSelected: !part.isSelected } : part
        );

        setPartsData(updatedParts);

        // Update selected parts - only include requested parts
        const selected = updatedParts.filter(part => part.isSelected && part.status === "requested");
        setSelectedParts(selected);

        // Initialize quantity values for selected parts with minimum 1
        const newQuantities = { ...approveQuantities };
        if (!item.isSelected) {
            // Use requestedQuantity if available, otherwise fall back to quantity
            newQuantities[item.id] = (item.requestedQuantity || item.quantity).toString();
        } else {
            delete newQuantities[item.id];
        }
        setApproveQuantities(newQuantities);
    };

    const handleApproveParts = async () => {
        try {
            const invalidParts: string[] = [];

            selectedParts.forEach(part => {
                const inputValue = approveQuantities[part.id];
                const approvedQty = inputValue ? parseInt(inputValue) : 0;
                const requestedQty = part.requestedQuantity || part.quantity;

                // Check for empty or 0 value
                if (!inputValue || inputValue.trim() === '' || approvedQty === 0) {
                    invalidParts.push(`${part.partNo} - Cannot approve 0 or empty quantity`);
                }
                // Check for value greater than requested quantity
                else if (approvedQty > requestedQty) {
                    invalidParts.push(`${part.partNo} - Approved quantity (${approvedQty}) exceeds requested quantity (${requestedQty})`);
                }
                // Check for negative values
                else if (approvedQty < 0) {
                    invalidParts.push(`${part.partNo} - Cannot approve negative quantity`);
                }
            });

            // If there are invalid parts, show alert and stop submission
            if (invalidParts.length > 0) {
                Alert.alert(
                    "Invalid Quantities",
                    `Please fix the following issues:\n\n• ${invalidParts.join('\n• ')}`,
                    [{ text: "OK" }]
                );
                return;
            }

            // CORRECTED PAYLOAD STRUCTURE - WEB COMPATIBLE
            const approvalPayload = selectedParts.map(part => {
                const approvedQuantity = parseInt(approveQuantities[part.id]);

                // WEB-COMPATIBLE PAYLOAD STRUCTURE
                return {
                    id: part.originalData.id,
                    part_inventory_id: part.originalData.part_inventory_id,
                    maintenance_id: part.originalData.maintenance_id,
                    approve_quantity: approvedQuantity.toString(), // Web uses string format
                    is_approved: true,
                    part_no: part.partNo,
                    requested_quantity: part.requestedQuantity || part.quantity,
                    in_stock_quantity: part.originalData?.in_stock_quantity || "0",
                    is_local_part: part.originalData?.is_local_part || false,
                    // Include additional fields that web expects
                    comsumed_quantity: 0,
                    requested_date: part.originalData?.requested_date || new Date().toISOString(),
                    quantity: approvedQuantity // Additional field for web compatibility
                };
            });

            console.log("Approval Payload:", approvalPayload);

            const response = await maintenanceApi.approvePartsRequest(approvalPayload);

            if (response.msg === "successful") {
                if (maintenanceId) {
                    dispatch(fetchMaintenanceDetailNew(maintenanceId) as any);
                }

                // IMMEDIATE FRONTEND UPDATE - Real-time change
                const updatedParts = partsData.map(part => {
                    if (part.isSelected) {
                        const approvedQty = parseInt(approveQuantities[part.id]);
                        return {
                            ...part,
                            status: "approved",
                            approvedQuantity: approvedQty,
                            quantity: approvedQty,
                            isSelected: false
                        };
                    }
                    return part;
                });

                setPartsData(updatedParts);
                setSelectedParts([]);
                setApproveQuantities({});
                setShowApproveDrawer(false);

                Alert.alert("Success", "Parts approved successfully");
            } else {
                Alert.alert("Error", "Failed to approve parts");
            }
        } catch (error) {
            console.error("Approve parts error:", error);
            Alert.alert("Error", "Failed to approve parts");
        }
    };

    // FLEXIBLE: Allow any input including empty for typing
    const handleQuantityChange = (partId: string, value: string) => {
        // Allow empty string for flexible typing
        if (value === '') {
            setApproveQuantities({
                ...approveQuantities,
                [partId]: ''
            });
            return;
        }

        // Only allow numbers (including multiple zeros for typing flexibility)
        if (/^\d+$/.test(value)) {
            setApproveQuantities({
                ...approveQuantities,
                [partId]: value
            });
        }
    };

    const incrementQuantity = (partId: string) => {
        const currentValue = approveQuantities[partId];
        const currentQty = currentValue ? parseInt(currentValue) : 0;
        const part = selectedParts.find(p => p.id === partId);

        // For local parts, use approve_quantity as maximum limit
        // For non-local parts, use requested_quantity as maximum limit
        const maxAllowedQty = part?.isLocalPart ?
            part.originalData.approve_quantity :
            (part?.requestedQuantity || part?.quantity || 1);

        if (currentQty < maxAllowedQty) {
            setApproveQuantities({
                ...approveQuantities,
                [partId]: (currentQty + 1).toString()
            });
        } else {
            Alert.alert(
                "Maximum Quantity",
                `Cannot exceed ${part?.isLocalPart ? 'approved' : 'requested'} quantity of ${maxAllowedQty}`,
                [{ text: "OK" }]
            );
        }
    };

    const decrementQuantity = (partId: string) => {
        const currentValue = approveQuantities[partId];
        const currentQty = currentValue ? parseInt(currentValue) : 1;

        if (currentQty > 1) {
            setApproveQuantities({
                ...approveQuantities,
                [partId]: (currentQty - 1).toString()
            });
        } else {
            Alert.alert(
                "Minimum Quantity",
                "Cannot approve 0 quantity",
                [{ text: "OK" }]
            );
        }
    };

    // NEW: Check if all parts have valid quantities (not empty, > 0, and <= requested)
    const allPartsHaveValidQuantities = selectedParts.every(part => {
        const inputValue = approveQuantities[part.id];
        if (!inputValue || inputValue.trim() === '') return false;

        const quantity = parseInt(inputValue);

        // For local parts, use approve_quantity as maximum limit
        // For non-local parts, use requested_quantity as maximum limit
        const maxAllowedQty = part.isLocalPart ?
            part.originalData.approve_quantity :
            part.requestedQuantity;

        return quantity > 0 && quantity <= maxAllowedQty;
    });

    // Helper to get display value for input (shows empty when typing)
    const getDisplayValue = (partId: string) => {
        return approveQuantities[partId] || '';
    };

    const getStatusButtonStyle = (status: string) => {
        switch (status) {
            case "requested":
                return styles.requestedButton;
            case "approved":
                return styles.approvedButton;
            case "reclosed":
                return styles.reclosedButton;
            default:
                return styles.requestedButton;
        }
    };

    const getStatusButtonText = (status: string) => {
        switch (status) {
            case "requested":
                return "Requested";
            case "approved":
                return "Approved";
            case "reclosed":
                return "Reclosed";
            default:
                return "Requested";
        }
    };

    const renderPartItem = ({ item }: any) => (
        <TouchableOpacity onPress={() => togglePartSelection(item)}>
            <View style={[styles.partItem, item.isSelected && styles.selectedPartItem]}>
                <View style={styles.checkboxContainer}>
                    {item.isSelected ? (
                        <Icon name="checkbox-marked" size={24} color="#00BFA5" />
                    ) : item.status === "approved" ? (
                        <Icon name="check-circle" size={24} color="#00BFA5" />
                    ) : (
                        <Icon name="checkbox-blank-circle-outline" size={24} color="#9E9E9E" />
                    )}
                </View>
                <View style={styles.partInfo}>
                    <View style={styles.partHeader}>
                        <Text style={styles.partLabel}>Part No.</Text>
                        {item.isLocalPart && (
                            <View style={styles.localPartBadge}>
                                <Text style={styles.localPartText}>Local Part</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.partNumber}>{item.partNo}</Text>
                    <Text style={styles.requestedBy}>Requested By: {item.requestedBy}</Text>

                    {/* Show different quantity info based on status */}
                    {item.status === "approved" ? (
                        <View style={styles.quantityContainer}>
                            <Text style={styles.quantityText}>
                                {item.isLocalPart ? 'Approved' : 'Requested'}: <Text style={styles.quantityValue}>{item.requestedQuantity}</Text>
                            </Text>
                            <Text style={styles.quantityText}>
                                Final Approved: <Text style={styles.approvedQuantityValue}>{item.approvedQuantity}</Text>
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.quantityText}>
                            {item.isLocalPart ? 'Approved Qty' : 'Requested Qty'}: {item.quantity}
                        </Text>
                    )}
                </View>
                <View style={styles.statusContainer}>
                    <TouchableOpacity style={[styles.statusButton, getStatusButtonStyle(item.status)]}>
                        <Text style={styles.statusButtonText}>{getStatusButtonText(item.status)}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateLabel}>Date</Text>
                    <Text style={styles.date}>{item.date}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header />
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#1A1D29" />
                    <Text style={styles.headerTitle}>Parts Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.addButtonTop}
                    onPress={navigateToAddParts}
                >
                    <Icon name="plus" size={16} color="#ffffff" style={styles.plusIcon} />
                    <Text style={styles.addButtonText}>Add New</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by part number"
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor="#9E9E9E"
                />
                <Icon name="magnify" size={20} color="#9E9E9E" />
            </View>

            {/* Status Filter Buttons */}
            <View style={styles.statusFilterContainer}>
                <TouchableOpacity
                    style={[styles.statusFilterButton, statusFilter === "all" && styles.statusFilterButtonActive]}
                    onPress={() => setStatusFilter("all")}
                >
                    <Text style={[styles.statusFilterText, statusFilter === "all" && styles.statusFilterTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statusFilterButton, statusFilter === "requested" && styles.statusFilterButtonActive]}
                    onPress={() => setStatusFilter("requested")}
                >
                    <Text style={[styles.statusFilterText, statusFilter === "requested" && styles.statusFilterTextActive]}>
                        Requested
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statusFilterButton, statusFilter === "approved" && styles.statusFilterButtonActive]}
                    onPress={() => setStatusFilter("approved")}
                >
                    <Text style={[styles.statusFilterText, statusFilter === "approved" && styles.statusFilterTextActive]}>
                        Approved
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Parts List */}
            <FlatList
                data={filteredParts}
                renderItem={renderPartItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshPartsData}
                        colors={["#00BFA5"]}
                        tintColor="#00BFA5"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No parts found</Text>
                    </View>
                }
            />

            {/* Approve Button (shown when REQUESTED parts are selected) */}
            {selectedParts.length > 0 && (
                <TouchableOpacity
                    style={styles.approveFloatingButton}
                    onPress={() => setShowApproveDrawer(true)}
                >
                    <Text style={styles.approveFloatingButtonText}>
                        Approve ({selectedParts.length})
                    </Text>
                </TouchableOpacity>
            )}

            {/* Add New Form Drawer */}
            <Modal
                visible={showAddForm}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddForm(false)}
            >
                <View style={styles.drawerOverlay}>
                    <View style={styles.drawerContent}>
                        <View style={styles.drawerHandle} />
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>Assign new part</Text>
                            <TouchableOpacity onPress={() => setShowAddForm(false)}>
                                <Icon name="close" size={24} color="#1A1D29" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.drawerBody}>
                            <View style={styles.formContainer}>
                                <Text style={styles.formLabel}>Enter Part Number</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Search by part Number"
                                    value={partNumber}
                                    onChangeText={setPartNumber}
                                />

                                <Text style={styles.formLabel}>Quantity</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Enter Quantity"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="numeric"
                                />

                                <View style={styles.formButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowAddForm(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.requestButton}
                                        onPress={handleRequestPart}
                                    >
                                        <Text style={styles.requestButtonText}>Request Part</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Approve Parts Drawer */}
            <Modal
                visible={showApproveDrawer}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowApproveDrawer(false)}
            >
                <View style={styles.drawerOverlay}>
                    <View style={styles.drawerContent}>
                        <View style={styles.drawerHandle} />
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>Approve Parts</Text>
                            <TouchableOpacity onPress={() => setShowApproveDrawer(false)}>
                                <Icon name="close" size={24} color="#1A1D29" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.drawerBody}>
                            {selectedParts.map((part) => (
                                <View key={part.id} style={styles.approveItem}>
                                    <View style={styles.approveItemHeader}>
                                        <View style={styles.partHeader}>
                                            <Text style={styles.approvePartNumber}>{part.partNo}</Text>
                                            {part.isLocalPart && (
                                                <View style={styles.localPartBadge}>
                                                    <Text style={styles.localPartText}>Local Part</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.approveRequestedBy}>By: {part.requestedBy}</Text>
                                    </View>

                                    <View style={styles.approveItemDetails}>
                                        <View style={styles.quantitySection}>
                                            <Text style={styles.quantityLabel}>
                                                {part.isLocalPart ? 'Approved Quantity' : 'Requested Quantity'}: {part.quantity}
                                            </Text>

                                            <View style={styles.quantityControlContainer}>
                                                <Text style={styles.approveQuantityLabel}>Approve Quantity:</Text>

                                                <View style={styles.quantityInputWrapper}>
                                                    <TouchableOpacity
                                                        style={styles.quantityButton}
                                                        onPress={() => decrementQuantity(part.id)}
                                                    >
                                                        <Icon name="minus" size={16} color="#1A1D29" />
                                                    </TouchableOpacity>

                                                    <TextInput
                                                        style={styles.quantityInput}
                                                        value={getDisplayValue(part.id)}
                                                        onChangeText={(value) => handleQuantityChange(part.id, value)}
                                                        keyboardType="numeric"
                                                        textAlign="center"
                                                        placeholder="1"
                                                        placeholderTextColor="#9E9E9E"
                                                    />

                                                    <TouchableOpacity
                                                        style={styles.quantityButton}
                                                        onPress={() => incrementQuantity(part.id)}
                                                    >
                                                        <Icon name="plus" size={16} color="#1A1D29" />
                                                    </TouchableOpacity>
                                                </View>

                                                {part.isLocalPart && (
                                                    <Text style={styles.localPartNote}>
                                                        Maximum allowed: {part.originalData?.approve_quantity || part.quantity}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.stockInfo}>
                                            <Text style={styles.stockLabel}>In Stock:</Text>
                                            <Text style={styles.stockValue}>
                                                {part.originalData?.in_stock_quantity || "0"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.drawerFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowApproveDrawer(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.requestButton, !allPartsHaveValidQuantities && styles.disabledButton]}
                                onPress={handleApproveParts}
                                disabled={!allPartsHaveValidQuantities}
                            >
                                <Text style={styles.requestButtonText}>Approve Selected</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

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
    addButtonTop: {
        backgroundColor: "#00BFA5",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    plusIcon: {
        marginRight: 4,
    },
    addButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
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
    listContainer: {
        padding: 16,
        paddingBottom: 80, // Extra padding for floating button
    },
    partItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedPartItem: {
        backgroundColor: "#E8F5E9",
        borderWidth: 1,
        borderColor: "#00BFA5",
    },
    checkboxContainer: {
        marginRight: 12,
    },
    partInfo: {
        flex: 1,
    },
    partLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 2,
    },
    partNumber: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
        marginBottom: 4,
    },
    requestedBy: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 2,
    },
    quantityText: {
        fontSize: 12,
        color: "#6B7280",
    },
    statusContainer: {
        marginHorizontal: 12,
    },
    statusButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    statusButtonText: {
        fontSize: 12,
        fontWeight: "600",
    },
    requestedButton: {
        backgroundColor: "#FFECB3",
    },
    approvedButton: {
        backgroundColor: "#C8E6C9",
    },
    reclosedButton: {
        backgroundColor: "#FFCDD2",
    },
    dateContainer: {
        alignItems: "flex-end",
    },
    dateLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1A1D29",
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
    approveFloatingButton: {
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
    approveFloatingButtonText: {
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
        maxHeight: "80%",
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
    drawerBody: {
        padding: 16,
    },
    drawerFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E9F2",
    },
    formContainer: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
        marginBottom: 8,
    },
    formInput: {
        borderWidth: 1,
        borderColor: "#E5E9F2",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 14,
        color: "#1A1D29",
    },
    formButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E5E9F2",
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
        marginRight: 8,
    },
    cancelButtonText: {
        color: "#6B7280",
        fontSize: 14,
        fontWeight: "600",
    },
    requestButton: {
        flex: 1,
        backgroundColor: "#00BFA5",
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
        marginLeft: 8,
    },
    requestButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    statusFilterContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    statusFilterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E9F2",
        marginHorizontal: 4,
    },
    statusFilterButtonActive: {
        backgroundColor: "#00BFA5",
        borderColor: "#00BFA5",
    },
    statusFilterText: {
        fontSize: 14,
        color: "#6B7280",
    },
    statusFilterTextActive: {
        color: "#FFFFFF",
    },
    approveItem: {
        backgroundColor: "#F9F9F9",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    approveItemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    approvePartNumber: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1D29",
    },
    approveRequestedBy: {
        fontSize: 12,
        color: "#6B7280",
    },
    approveItemDetails: {
        flexDirection: "column",
    },
    quantitySection: {
        marginBottom: 12,
    },
    quantityLabel: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 8,
    },
    approveQuantityLabel: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 8,
    },
    quantityControlContainer: {
        flexDirection: "column",
    },
    quantityInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 4,
        backgroundColor: "#E5E9F2",
        alignItems: "center",
        justifyContent: "center",
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: "#E5E9F2",
        borderRadius: 4,
        padding: 8,
        width: 80,
        textAlign: "center",
        backgroundColor: "#FFFFFF",
        fontSize: 14,
        color: "#1A1D29",
        marginHorizontal: 8,
    },
    stockInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    stockLabel: {
        fontSize: 14,
        color: "#6B7280",
        marginRight: 4,
    },
    stockValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
    },
    disabledButton: {
        backgroundColor: "#CCCCCC",
        opacity: 0.6,
    },
    quantityContainer: {
        marginTop: 4,
    },

    quantityValue: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1A1D29",
    },
    approvedQuantityValue: {
        fontSize: 12,
        fontWeight: "600",
        color: "#00BFA5", // Green color for approved quantity
    },








    partHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    localPartBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    localPartText: {
        fontSize: 10,
        color: '#1976D2',
        fontWeight: '600',
    },
    localPartNote: {
        fontSize: 10,
        color: '#666',
        fontStyle: 'italic',
    },
    localPartApproval: {
        backgroundColor: '#E8F5E8',
        padding: 8,
        borderRadius: 4,
        marginTop: 4,
    },
    localPartApprovalText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '600',
    },
});

export default PartsDetails;