import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Image,
    Platform,
    Alert,
    PermissionsAndroid,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import WalletPopup from './WalletPopup'; // Make sure to create this component
import { useNavigation } from "@react-navigation/native";

const OpenDetails = ({ route }: any) => {
    const { ticket } = route.params || {};
    const [comment, setComment] = useState("");
    const [visited, setVisited] = useState(false);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [showWalletPopup, setShowWalletPopup] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedEngineer, setSelectedEngineer] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedPart, setSelectedPart] = useState("");
    const navigation = useNavigation();

    // Sample data (replace with props or API)
    const maintenance = {
        ticketId: "MAU033-2025-0001",
        complainDate: "07-05-2025",
        breakdownType: "Major",
        breakdownTitle: "Machine Not Working",
        breakdownDate: "05-05-2025",
        priority: "High",
        status: "In Progress",
        deadline: "16-05-2025",
        engineer: "P. Raja",
    };

    const assetDetails = {
        assetName: "MTU02",
        capacity: "36kg - 10ft",
        access: "Integer Access",
        modelNo: "234567",
        category: "Telescopic Boom",
        customer: "SSSH",
        mode: "VOA",
        retailDate: "06-03-2025",
        serialNo: "55514",
        year: "2022",
        scaleFactor: "N/A",
        sales: "Sales 02"
    };

    const engineers = [
        { id: "1", name: "P. Raja" },
        { id: "2", name: "Avinandan" },
    ];

    const priorities = [
        { id: "1", name: "Low" },
        { id: "2", name: "Medium" },
        { id: "3", name: "High" },
    ];

    const parts = [
        { id: "1", name: "Part 1" },
        { id: "2", name: "Part 2" },
        { id: "3", name: "Part 3" },
    ];

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
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
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const requestGalleryPermission = async () => {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
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
            } else {
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
            }
        }
        return true;
    };

    const handleTakePhoto = async () => {
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
                if (!response.didCancel && response.assets && response.assets.length > 0) {
                    setSelectedImage(response.assets[0]);
                }
            }
        );
    };

    const handleSelectFromGallery = async () => {
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
                if (!response.didCancel && response.assets && response.assets.length > 0) {
                    setSelectedImage(response.assets[0]);
                }
            }
        );
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

    const handleUpdate = () => {
        Alert.alert("Success", "Breakdown details updated successfully");
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setSelectedDate(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const showEngineerOptions = () => {
        Alert.alert(
            "Select Engineer",
            "Choose an engineer",
            [
                ...engineers.map(engineer => ({
                    text: engineer.name,
                    onPress: () => setSelectedEngineer(engineer.name),
                })),
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    };

    const showPriorityOptions = () => {
        Alert.alert(
            "Select Priority",
            "Choose a priority level",
            [
                ...priorities.map(priority => ({
                    text: priority.name,
                    onPress: () => setSelectedPriority(priority.name),
                })),
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    };

    const showPartOptions = () => {
        Alert.alert(
            "Select Part",
            "Choose a part",
            [
                ...parts.map(part => ({
                    text: part.name,
                    onPress: () => setSelectedPart(part.name),
                })),
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>
                    Asset<Text style={styles.logoAccent}>Tracker</Text>
                </Text>
                <View style={styles.profileContainer}>
                    <View style={styles.profilePic}>
                        <Image
                            source={{ uri: 'https://via.placeholder.com/40x40/4CAF50/FFFFFF?text=P' }}
                            style={styles.profileImage}
                        />
                    </View>
                </View>
            </View>

            {/* Closure Request Banner */}
            <View style={styles.closureBanner}>
                <View style={styles.closureBannerContent}>
                    <View style={styles.closureTextContainer}>
                        <Text style={styles.closureTitle}>Closer Requested</Text>
                        <Text style={styles.closureDescription}>
                            Closer request has been created by cataloged service engineer, please click the button to close.
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.dismissButton}>
                    <Icon name="close" size={16} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Asset Details */}
            <View style={styles.section}>
                <TouchableOpacity style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Asset Details</Text>
                    <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <View style={styles.assetGrid}>
                    <View style={styles.assetRow}>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Asset</Text>
                            <Text style={styles.assetValue}>{assetDetails.assetName}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Integer Capacity</Text>
                            <Text style={styles.assetValue}>{assetDetails.capacity}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Mode</Text>
                            <View style={styles.modeTag}>
                                <Text style={styles.modeText}>{assetDetails.mode}</Text>
                            </View>
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
                            <Text style={styles.assetLabel}>Serial No.</Text>
                            <Text style={styles.assetValue}>{assetDetails.serialNo}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Year</Text>
                            <Text style={styles.assetValue}>{assetDetails.year}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Re-tail-ID/Date</Text>
                            <Text style={styles.assetValue}>{assetDetails.retailDate}</Text>
                        </View>
                    </View>

                    <View style={styles.assetRow}>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Optional Scale Factor</Text>
                            <Text style={styles.assetValue}>{assetDetails.scaleFactor}</Text>
                        </View>
                        <View style={styles.assetItem}>
                            <Text style={styles.assetLabel}>Sales</Text>
                            <Text style={styles.assetValue}>{assetDetails.sales}</Text>
                        </View>
                        <View style={styles.assetItem} />
                    </View>
                </View>
            </View>

            {/* Maintenance Details */}
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
                                <Text style={styles.statusText}>{maintenance.status}</Text>
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

            {/* Engineer Section */}
            <View style={styles.section}>
                <View style={styles.engineerInfo}>
                    <Text style={styles.engineerName}>P.Raja <Text style={styles.pendingText}>(pending)</Text></Text>
                    <TouchableOpacity
                        style={styles.walletLink}
                        onPress={() => setShowWalletPopup(true)}
                    >
                        <Text style={styles.walletLinkText}>View Wallet</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.engineerInfo}>
                    <Text style={styles.engineerName}>Avinandan <Text style={styles.pendingText}>(pending)</Text></Text>
                    <TouchableOpacity
                        style={styles.walletLink}
                        onPress={() => setShowWalletPopup(true)}
                    >
                        <Text style={styles.walletLinkText}>View Wallet</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formRow}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>SELECT</Text>
                        <TouchableOpacity style={styles.selectInput} onPress={showEngineerOptions}>
                            <Text style={selectedEngineer ? styles.selectTextSelected : styles.selectText}>
                                {selectedEngineer || "select"}
                            </Text>
                            <Icon name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>EDIT BREAKDOWN TITLE</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Edit breakdown title"
                            value={maintenance.breakdownTitle}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.partsDetailsHeader}
                    onPress={() => navigation.navigate("PartsDetails" as never)}
                >
                    <Text style={styles.partsTitle}>Parts Details</Text>
                    <Icon name="chevron-right" size={16} color="#666" />
                </TouchableOpacity>

                <View style={styles.formRow}>
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.selectInput} onPress={showPartOptions}>
                            <Text style={selectedPart ? styles.selectTextSelected : styles.selectText}>
                                {selectedPart || "select"}
                            </Text>
                            <Icon name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.selectInput} onPress={showPartOptions}>
                            <Text style={selectedPart ? styles.selectTextSelected : styles.selectText}>
                                {selectedPart || "select"}
                            </Text>
                            <Icon name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formRow}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>PRIORITY</Text>
                        <TouchableOpacity style={styles.selectInput} onPress={showPriorityOptions}>
                            <Text style={selectedPriority ? styles.selectTextSelected : styles.selectText}>
                                {selectedPriority || "select"}
                            </Text>
                            <Icon name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>DEADLINE</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={selectedDate ? styles.selectTextSelected : styles.selectText}>
                                {formatDate(selectedDate)}
                            </Text>
                            <Icon name="calendar" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>UPDATE BREAKDOWN DESCRIPTION</Text>
                    <TextInput
                        style={[styles.textInput, styles.textArea]}
                        placeholder="Test"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>ADD COMMENT</Text>
                    <TextInput
                        style={[styles.textInput, styles.textArea]}
                        placeholder="write your comment"
                        multiline
                        numberOfLines={3}
                        value={comment}
                        onChangeText={setComment}
                    />
                </View>

                {/* Upload Image */}
                <View style={styles.uploadSection}>
                    {selectedImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image
                                source={{ uri: selectedImage.uri }}
                                style={styles.imagePreview}
                                resizeMode="cover"
                            />
                            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                                <Icon name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.uploadButton} onPress={showImagePickerOptions}>
                            <Icon name="cloud-upload" size={20} color="#ffffff" />
                            <Text style={styles.uploadButtonText}>Upload Image</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                    <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
            </View>

            {/* Wallet Popup */}
            <WalletPopup
                visible={showWalletPopup}
                onClose={() => setShowWalletPopup(false)}
            />

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    selectTextSelected: {
        fontSize: 14,
        color: "#1A1D29",
    },
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E9F2",
    },
    logoText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1D29",
    },
    logoAccent: {
        color: "#00BFA5",
    },
    profileContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    profilePic: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#E8F5E8",
    },
    profileImage: {
        width: "100%",
        height: "100%",
    },
    closureBanner: {
        backgroundColor: "#FFF5F5",
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#FF5252",
        position: "relative",
    },
    closureBannerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    closureTextContainer: {
        flex: 1,
        paddingRight: 12,
    },
    closureTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#D32F2F",
        marginBottom: 4,
    },
    closureDescription: {
        fontSize: 13,
        color: "#757575",
        lineHeight: 18,
    },
    closeButton: {
        backgroundColor: "#FF5252",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    closeButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
    },
    dismissButton: {
        position: "absolute",
        top: 8,
        right: 8,
        padding: 4,
    },
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
        marginBottom: 16,
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
    modeTag: {
        backgroundColor: "#E8F5E8",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    modeText: {
        color: "#2E7D2E",
        fontSize: 12,
        fontWeight: "600",
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
    engineerActions: {
        marginBottom: 16,
    },
    walletButton: {
        backgroundColor: "#E3F2FD",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 12,
    },
    walletButtonText: {
        color: "#1976D2",
        fontSize: 14,
        fontWeight: "600",
    },
    engineerInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    engineerName: {
        fontSize: 16,
        color: "#1A1D29",
        fontWeight: "600",
    },
    pendingText: {
        color: "#FF9800",
        fontWeight: "400",
    },
    walletLink: {
        backgroundColor: "#E3F2FD",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    walletLinkText: {
        color: "#1976D2",
        fontSize: 12,
        fontWeight: "500",
    },
    partsDetailsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        marginVertical: 16,
    },
    partsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
    },
    formRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    inputContainer: {
        flex: 1,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 11,
        color: "#9E9E9E",
        marginBottom: 8,
        textTransform: "uppercase",
        fontWeight: "500",
        letterSpacing: 0.5,
    },
    selectInput: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#E5E9F2",
        borderRadius: 8,
        padding: 14,
        backgroundColor: "#ffffff",
    },
    textInput: {
        borderWidth: 1,
        borderColor: "#E5E9F2",
        borderRadius: 8,
        padding: 14,
        fontSize: 14,
        color: "#1A1D29",
        backgroundColor: "#ffffff",
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    selectText: {
        fontSize: 14,
        color: "#9E9E9E",
    },
    uploadSection: {
        marginBottom: 24,
    },
    uploadButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#00BFA5",
        borderRadius: 8,
        padding: 16,
        gap: 8,
    },
    uploadButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
    },
    imagePreviewContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateButton: {
        backgroundColor: "#00BFA5",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
        shadowColor: "#00BFA5",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    updateButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    bottomNav: {
        flexDirection: "row",
        backgroundColor: "#ffffff",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E9F2",
        marginTop: 20,
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
    },
    navText: {
        fontSize: 12,
        color: "#9E9E9E",
        marginTop: 4,
        fontWeight: "500",
    },
    navTextActive: {
        color: "#00BFA5",
    },
});

export default OpenDetails;