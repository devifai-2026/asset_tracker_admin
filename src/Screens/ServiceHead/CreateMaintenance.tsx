import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Platform,
    Alert,
    PermissionsAndroid,
    ActivityIndicator,
    Modal,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { maintenanceApi } from '../../api/maintenanceApi';
import { Header } from "../Header";

export const CreateMaintenance = () => {
    const navigation = useNavigation<any>();

    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [breakdownTitle, setBreakdownTitle] = useState("");
    const [breakdownType, setBreakdownType] = useState("");
    const [label, setLabel] = useState("");
    const [breakdownDate, setBreakdownDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [assets, setAssets] = useState<any[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [ticketNo, setTicketNo] = useState("");
    const [showBreakdownTypeModal, setShowBreakdownTypeModal] = useState(false);

    useEffect(() => {
        fetchAssets();
    }, []);

    useEffect(() => {
        // Filter assets based on search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const filtered = assets.filter(asset =>
                (asset.asset_no && asset.asset_no.toLowerCase().includes(query)) ||
                (asset.name && asset.name.toLowerCase().includes(query)) ||
                (asset.id && asset.id.toString().toLowerCase().includes(query))
            );
            setFilteredAssets(filtered);
        } else {
            setFilteredAssets(assets);
        }
    }, [searchQuery, assets]);

    const fetchAssets = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await maintenanceApi.getAllAssets();

            // Handle different possible response structures
            if (response.data && Array.isArray(response.data)) {
                setAssets(response.data);
                setFilteredAssets(response.data);
            } else if (response.assets && Array.isArray(response.assets)) {
                setAssets(response.assets);
                setFilteredAssets(response.assets);
            } else if (Array.isArray(response)) {
                setAssets(response);
                setFilteredAssets(response);
            } else {
                console.log("Unexpected API response structure:", response);
                setError("Unexpected response format from server");
                Alert.alert("Error", "Failed to load assets: Unexpected format");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch assets';
            setError(errorMessage);
            Alert.alert("Error", "Failed to fetch assets: " + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: "Camera Permission",
                    message: "App needs access to your camera to take photos",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const requestGalleryPermission = async () => {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
                // Android 13+ - Use READ_MEDIA_IMAGES
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                        {
                            title: "Photos Permission",
                            message: "App needs access to your photos",
                            buttonNeutral: "Ask Me Later",
                            buttonNegative: "Cancel",
                            buttonPositive: "OK",
                        }
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                } catch (err) {
                    console.warn(err);
                    return false;
                }
            } else {
                // Android 12 and below - Use READ_EXTERNAL_STORAGE
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                        {
                            title: "Storage Permission",
                            message: "App needs access to your storage to read photos",
                            buttonNeutral: "Ask Me Later",
                            buttonNegative: "Cancel",
                            buttonPositive: "OK",
                        }
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                } catch (err) {
                    console.warn(err);
                    return false;
                }
            }
        }
        return true;
    };

    const handleTakePhoto = async () => {
        try {
            const hasCameraPermission = await requestCameraPermission();
            if (!hasCameraPermission) {
                Alert.alert("Permission denied", "Camera access is required to take photos");
                return;
            }

            launchCamera(
                {
                    mediaType: 'photo',
                    includeBase64: false,
                    quality: 0.8,
                },
                (response) => {
                    if (response.errorCode) {
                        Alert.alert("Error", response.errorMessage || "Failed to take photo");
                    } else if (!response.didCancel && response.assets && response.assets.length > 0) {
                        setSelectedImage(response.assets[0]);
                    }
                }
            );
        } catch (error) {
            Alert.alert("Error", "Failed to access camera");
        }
    };

    const handleSelectFromGallery = async () => {
        try {
            const hasPermission = await requestGalleryPermission();
            if (!hasPermission) {
                Alert.alert("Permission denied", "Storage/Photos access is required to select images");
                return;
            }

            launchImageLibrary(
                {
                    mediaType: 'photo',
                    includeBase64: false,
                    quality: 0.8,
                },
                (response) => {
                    if (response.errorCode) {
                        Alert.alert("Error", response.errorMessage || "Failed to select image");
                    } else if (!response.didCancel && response.assets && response.assets.length > 0) {
                        setSelectedImage(response.assets[0]);
                    }
                }
            );
        } catch (error) {
            Alert.alert("Error", "Failed to access gallery");
        }
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            "Select Image",
            "Choose an option",
            [
                {
                    text: "Take Photo",
                    onPress: handleTakePhoto,
                },
                {
                    text: "Choose from Gallery",
                    onPress: handleSelectFromGallery,
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    };

    const removeImage = () => {
        setSelectedImage(null);
    };

    const handleCreate = async () => {
        if (!selectedAsset) {
            Alert.alert("Error", "Please select an asset");
            return;
        }

        if (!breakdownTitle) {
            Alert.alert("Error", "Please enter a breakdown title");
            return;
        }

        if (!breakdownType) {
            Alert.alert("Error", "Please select a breakdown type");
            return;
        }

        setCreating(true);
        try {
            // Format the date to YYYY-MM-DD
            const formattedDate = breakdownDate.toISOString().split('T')[0];

            // Create the maintenance request
            const payload = {
                asset_no: selectedAsset.asset_no,
                asset_id: selectedAsset.id,
                complaint_type: breakdownType,
                complaint: breakdownTitle,
                description: label,
                issue_date: formattedDate,
                complaint_date: new Date().toISOString(),
            };

            // Create maintenance
            const createResponse = await maintenanceApi.createMaintenance(payload);

            // If there's an image, upload it
            if (selectedImage) {
                const formData = new FormData();
                formData.append('types', 'maintenance');
                formData.append('maintenance_id', createResponse.maintenace_id);
                formData.append('photo', {
                    uri: selectedImage.uri,
                    type: selectedImage.type || 'image/jpeg',
                    name: selectedImage.fileName || `photo_${Date.now()}.jpg`,
                });

                await maintenanceApi.uploadMaintenancePhoto(formData);
            }

            // Show success modal with ticket number
            setTicketNo(createResponse.tiket_no);
            setShowSuccessModal(true);

        } catch (err: any) {
            const errorMessage = err.response.data.error

            console.log("Create Maintenance Error:", err.response.data.error || err.message || err);

            // Handle specific error format for already registered complaints
            if (errorMessage.includes("maintenace_id") && errorMessage.includes("tiket_no")) {
                try {
                    // Try to parse the error message to extract ticket number
                    const errorObj = JSON.parse(errorMessage.replace(/'/g, '"'));
                    if (errorObj.tiket_no) {
                        Alert.alert(
                            "Error",
                            `A complaint is already registered for this asset with ticket id: ${errorObj.tiket_no}`
                        );
                        return;
                    }
                } catch (parseError) {
                    // If parsing fails, show the original error message
                    Alert.alert("Error", "Failed to create maintenance: " + errorMessage);
                }
            } else {
                Alert.alert("Error", "Failed to create maintenance: " + errorMessage);
            }
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            // Don't allow future dates
            const today = new Date();
            if (selectedDate > today) {
                Alert.alert("Error", "Breakdown date cannot be in the future");
                return;
            }
            setBreakdownDate(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
    };

    const selectAsset = (asset: any) => {
        setSelectedAsset(asset);
        setShowAssetModal(false);
        setSearchQuery(""); // Reset search query when an asset is selected
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigation.goBack();
    };

    const openAssetModal = () => {
        setShowAssetModal(true);
        setSearchQuery(""); // Reset search query when modal opens
    };

    const selectBreakdownType = (type: string) => {
        setBreakdownType(type);
        setShowBreakdownTypeModal(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
            <View style={styles.stickyHeader}>
                <Header />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.container}>


                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.title}>Create New Maintenance</Text>

                        {/* Select Asset */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Select assets</Text>
                            <TouchableOpacity
                                style={styles.selectInput}
                                onPress={openAssetModal}
                            >
                                <Text style={selectedAsset ? styles.selectText : styles.placeholderText}>
                                    {selectedAsset ? selectedAsset.asset_no : "Select asset"}
                                </Text>
                                <Icon name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Breakdown Title */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>breakdown title</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="enter breakdown title"
                                placeholderTextColor="#999"
                                value={breakdownTitle}
                                onChangeText={setBreakdownTitle}
                                returnKeyType="next"
                            />
                        </View>

                        {/* Breakdown Date */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Breakdown date</Text>
                            <TouchableOpacity
                                style={styles.selectInput}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.selectText}>
                                    {formatDate(breakdownDate)}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={breakdownDate}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                    maximumDate={new Date()} // This prevents selecting future dates in the picker
                                />
                            )}
                        </View>

                        {/* Breakdown Type */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>breakdown type</Text>
                            <TouchableOpacity
                                style={styles.selectInput}
                                onPress={() => setShowBreakdownTypeModal(true)}
                            >
                                <Text style={breakdownType ? styles.selectText : styles.placeholderText}>
                                    {breakdownType ? breakdownType.charAt(0).toUpperCase() + breakdownType.slice(1) : "select type"}
                                </Text>
                                <Icon name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Label/Description */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Breakdown Description</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                placeholder="Enter breakdown description"
                                placeholderTextColor="#999"
                                multiline={true}
                                numberOfLines={4}
                                value={label}
                                onChangeText={setLabel}
                                returnKeyType="done"
                                blurOnSubmit={true}
                            />
                        </View>

                        {/* Upload Image */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Upload Image</Text>
                            {selectedImage ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image
                                        source={{ uri: selectedImage?.uri || selectedImage?.path }}
                                        style={styles.imagePreview}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                                        <Icon name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.uploadButton} onPress={showImagePickerOptions}>
                                    <Icon name="plus" size={24} color="#0FA37F" />
                                    <Text style={styles.uploadText}>Upload Image</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.createButton, creating && styles.createButtonDisabled]}
                                onPress={handleCreate}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Icon name="plus" size={20} color="#fff" style={styles.createIcon} />
                                        <Text style={styles.createButtonText}>Create New</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Asset Selection Modal */}
                    <Modal
                        visible={showAssetModal}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowAssetModal(false)}
                    >
                        <SafeAreaView style={styles.modalSafeArea}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.assetModalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Select Asset</Text>
                                        <TouchableOpacity onPress={() => setShowAssetModal(false)}>
                                            <Icon name="close" size={24} color="#000" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Search Bar */}
                                    <View style={styles.searchContainer}>
                                        <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search assets..."
                                            placeholderTextColor="#999"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            autoFocus={true}
                                        />
                                    </View>

                                    {/* Assets List */}
                                    <ScrollView style={styles.assetsList}>
                                        {loading ? (
                                            <ActivityIndicator size="large" color="#0FA37F" style={styles.loader} />
                                        ) : error ? (
                                            <Text style={styles.errorText}>{error}</Text>
                                        ) : !filteredAssets || filteredAssets.length === 0 ? (
                                            <Text style={styles.noAssetsText}>
                                                {searchQuery ? "No assets found" : "No assets available"}
                                            </Text>
                                        ) : (
                                            filteredAssets.map((asset, index) => (
                                                <TouchableOpacity
                                                    key={asset.id || index}
                                                    style={[
                                                        styles.assetItem,
                                                        selectedAsset && selectedAsset.id === asset.id && styles.selectedAssetItem
                                                    ]}
                                                    onPress={() => selectAsset(asset)}
                                                >
                                                    <Text style={styles.assetItemText}>
                                                        {asset.asset_no || asset.name || `Asset ${index + 1}`}
                                                    </Text>
                                                    {selectedAsset && selectedAsset.id === asset.id && (
                                                        <Icon name="check" size={20} color="#0FA37F" />
                                                    )}
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            </View>
                        </SafeAreaView>
                    </Modal>

                    {/* Breakdown Type Modal */}
                    <Modal
                        visible={showBreakdownTypeModal}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowBreakdownTypeModal(false)}
                    >
                        <SafeAreaView style={styles.modalSafeArea}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.breakdownTypeModalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Select Breakdown Type</Text>
                                        <TouchableOpacity onPress={() => setShowBreakdownTypeModal(false)}>
                                            <Icon name="close" size={24} color="#000" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.breakdownTypeList}>
                                        <TouchableOpacity
                                            style={[
                                                styles.breakdownTypeItem,
                                                breakdownType === 'major' && styles.selectedBreakdownTypeItem
                                            ]}
                                            onPress={() => selectBreakdownType('major')}
                                        >
                                            <Text style={[
                                                styles.breakdownTypeText,
                                                breakdownType === 'major' && styles.selectedBreakdownTypeText
                                            ]}>
                                                Major
                                            </Text>
                                            {breakdownType === 'major' && (
                                                <Icon name="check" size={20} color="#0FA37F" />
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.breakdownTypeItem,
                                                breakdownType === 'minor' && styles.selectedBreakdownTypeItem
                                            ]}
                                            onPress={() => selectBreakdownType('minor')}
                                        >
                                            <Text style={[
                                                styles.breakdownTypeText,
                                                breakdownType === 'minor' && styles.selectedBreakdownTypeText
                                            ]}>
                                                Minor
                                            </Text>
                                            {breakdownType === 'minor' && (
                                                <Icon name="check" size={20} color="#0FA37F" />
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.breakdownTypeItem,
                                                breakdownType === 'others' && styles.selectedBreakdownTypeItem
                                            ]}
                                            onPress={() => selectBreakdownType('others')}
                                        >
                                            <Text style={[
                                                styles.breakdownTypeText,
                                                breakdownType === 'others' && styles.selectedBreakdownTypeText
                                            ]}>
                                                Others
                                            </Text>
                                            {breakdownType === 'others' && (
                                                <Icon name="check" size={20} color="#0FA37F" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </SafeAreaView>
                    </Modal>

                    {/* Success Modal */}
                    <Modal
                        visible={showSuccessModal}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={handleSuccessModalClose}
                    >
                        <SafeAreaView style={styles.modalSafeArea}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.successModalContent}>
                                    <View style={styles.successIconContainer}>
                                        <Icon name="check-circle" size={60} color="#0FA37F" />
                                    </View>
                                    <Text style={styles.successTitle}>Success!</Text>
                                    <Text style={styles.successMessage}>
                                        Maintenance request created successfully
                                    </Text>
                                    <Text style={styles.ticketText}>
                                        Ticket ID: {ticketNo}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.successButton}
                                        onPress={handleSuccessModalClose}
                                    >
                                        <Text style={styles.successButtonText}>OK</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </Modal>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    stickyHeader: {
        padding: 16
    },
    keyboardAvoid: {
        flex: 1,
    },
    modalSafeArea: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    logo: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
        flexGrow: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 24,
        color: "#000",
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 8,
        color: "#000",
        textTransform: "capitalize",
    },
    textInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#000",
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    selectInput: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
    },
    selectText: {
        fontSize: 16,
        color: "#000",
    },
    placeholderText: {
        fontSize: 16,
        color: "#999",
    },
    uploadButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#0FA37F",
        borderStyle: "dashed",
        borderRadius: 8,
        padding: 20,
        gap: 8,
    },
    uploadText: {
        fontSize: 16,
        color: "#0FA37F",
    },
    imagePreviewContainer: {
        position: "relative",
        width: "100%",
        height: 200,
        borderRadius: 8,
        overflow: "hidden",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    removeImageButton: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 16,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#666",
    },
    createButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0FA37F",
        borderRadius: 8,
        padding: 16,
        gap: 8,
    },
    createButtonDisabled: {
        opacity: 0.7,
    },
    createIcon: {
        marginRight: 4,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#fff",
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    assetModalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: "100%",
        maxHeight: "80%",
        overflow: "hidden",
    },
    breakdownTypeModalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: "80%",
        maxHeight: "40%",
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        margin: 16,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: "#000",
    },
    assetsList: {
        maxHeight: 400,
        paddingHorizontal: 16,
    },
    assetItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    selectedAssetItem: {
        backgroundColor: "#f0f9f6",
    },
    assetItemText: {
        fontSize: 16,
        color: "#000",
    },
    // Breakdown Type Modal styles
    breakdownTypeList: {
        padding: 16,
    },
    breakdownTypeItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    selectedBreakdownTypeItem: {
        backgroundColor: "#f0f9f6",
        borderRadius: 8,
    },
    breakdownTypeText: {
        fontSize: 16,
        color: "#000",
    },
    selectedBreakdownTypeText: {
        color: "#0FA37F",
        fontWeight: "500",
    },
    loader: {
        padding: 20,
    },
    errorText: {
        color: "red",
        textAlign: "center",
        padding: 20,
    },
    noAssetsText: {
        textAlign: "center",
        padding: 20,
        color: "#999",
    },
    // Success Modal styles
    successModalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        width: "80%",
    },
    successIconContainer: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 16,
    },
    ticketText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0FA37F",
        marginBottom: 24,
    },
    successButton: {
        backgroundColor: "#0FA37F",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        width: "100%",
        alignItems: "center",
    },
    successButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#fff",
    },
});