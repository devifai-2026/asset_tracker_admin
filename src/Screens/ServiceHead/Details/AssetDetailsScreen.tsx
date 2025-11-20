// AssetDetailsScreen.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    Modal,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Image
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch, useSelector } from "react-redux";
import { Header } from "../../Header";
import ClosureBanner from "./ClosureBanner";
import AssetDetailsSection from "./AssetDetailsSection";
import MaintenanceDetailsSection from "./MaintenanceDetailsSection";
import EngineerSection from "./EngineerSection";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
    fetchMaintenanceDetailNew,
    selectMaintenanceDetail,
    selectMaintenanceDetailLoading,
    selectMaintenanceDetailError
} from "../../../Redux/Slices/maintenanceSlice";
import { RootState } from "../../../Redux/store";
import { maintenanceApi } from "../../../api/maintenanceApi";

const AssetDetailsScreen = ({ navigation, route }: { navigation: any; route: any }) => {
    const { maintenanceId } = route.params || {};
    const dispatch = useDispatch();

    const [showWalletPopup, setShowWalletPopup] = useState(false);
    const [selectedEngineer, setSelectedEngineer] = useState("");
    const [selectedPart, setSelectedPart] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [comment, setComment] = useState("");
    const [selectedImage, setSelectedImage] = useState<any>(null);

    // New states for closure confirmation
    const [showClosureConfirm, setShowClosureConfirm] = useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isAssetDetailsExpanded, setIsAssetDetailsExpanded] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [showRejectComments, setShowRejectComments] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    
    // New state for full screen image view
    const [selectedFullScreenImage, setSelectedFullScreenImage] = useState<any>(null);
    const [showFullScreenImage, setShowFullScreenImage] = useState(false);

    // Get data from Redux store
    const maintenanceDetail = useSelector(selectMaintenanceDetail);
    const loading = useSelector(selectMaintenanceDetailLoading);
    const error = useSelector(selectMaintenanceDetailError);

    useEffect(() => {
        if (maintenanceId) {
            dispatch(fetchMaintenanceDetailNew(maintenanceId) as any);
        }
    }, [maintenanceId, dispatch]);

    // Handle maintenance closure
    const handleMaintenanceClosure = async () => {
        setIsClosing(true);
        try {
            // Call the API to close the maintenance
            const response = await maintenanceApi.acceptCloserRequest({
                accept: true,
                maintenance_id: maintenanceId
            });

            if (response.msg === "success") {
                Alert.alert("Success", "Maintenance closed successfully");
                dispatch(fetchMaintenanceDetailNew(maintenanceId) as any);
            } else {
                Alert.alert("Error", response.msg || "Failed to close maintenance");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while closing the maintenance");
            console.error("Closure error:", error);
        } finally {
            setIsClosing(false);
            setShowFinalConfirm(false);
        }
    };

    // Format date to DD/MM/YYYY
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";

            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (error) {
            return "N/A";
        }
    };

    // Robust formatDateTime function for GMT time strings
    const formatDateTime = (dateTimeString: string) => {
        if (!dateTimeString) return "N/A";

        try {
            // Parse the GMT date string
            const date = new Date(dateTimeString);

            if (isNaN(date.getTime())) {
                // Fallback: try parsing as is
                const fallbackDate = new Date(dateTimeString.replace('GMT', ''));
                if (isNaN(fallbackDate.getTime())) return "N/A";

                const day = fallbackDate.getDate().toString().padStart(2, '0');
                const month = (fallbackDate.getMonth() + 1).toString().padStart(2, '0');
                const year = fallbackDate.getFullYear();

                let hours = fallbackDate.getHours();
                const minutes = fallbackDate.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;

                return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
            }

            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;

            return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return "N/A";
        }
    };

    // Format the asset details from API response - Provide default values instead of null
    const assetDetails = {
        assetName: maintenanceDetail?.asset_no || "NA",
        capacity: maintenanceDetail?.asset?.capacity || "NA",
        access: "Public",
        modelNo: maintenanceDetail?.asset?.model || "NA",
        category: maintenanceDetail?.asset?.category || "NA",
        customer: maintenanceDetail?.lease_customer || "NA",
        mode: "Online",
        retailDate: formatDate(maintenanceDetail?.asset?.asset_sold_date || "NA"),
        serialNo: maintenanceDetail?.asset?.serial_no || "NA",
        yom: maintenanceDetail?.asset?.yom || "2023",
        scaleFactor: "1.0",
        sales: "$10,000",
        make: maintenanceDetail?.asset?.make || "NCR",
        rentalEndDate: formatDate(maintenanceDetail?.lease_end_date || "NA"),
        lease: maintenanceDetail?.lease || "NA",
        operator: maintenanceDetail?.lease_operator?.length ? maintenanceDetail.lease_operator[0] : "NA",
        salesPerson: maintenanceDetail?.lease_sale_person || "NA"
    };

    // Format the maintenance details from API response - Provide default values instead of null
    const maintenance = {
        ticketId: maintenanceDetail?.ticket_no || "TKT123456",
        complainDate: formatDate(maintenanceDetail?.compaint_date || "2023-10-15"),
        breakdownType: maintenanceDetail?.complaint_type || "Hardware",
        breakdownTitle: maintenanceDetail?.complaint || "Machine Not Working",
        breakdownDate: formatDate(maintenanceDetail?.issue_date || "2023-10-14"),
        priority: maintenanceDetail?.priority || "NA",
        status: maintenanceDetail?.status || "In Progress",
        deadline: formatDate(maintenanceDetail?.ready_date || "2023-10-20"),
        engineer: maintenanceDetail?.serviceSalePersons?.[0]?.name || "John Doe"
    };

    // Function to handle image tap for full screen view
    const handleImageTap = (photo: any) => {
        setSelectedFullScreenImage(photo);
        setShowFullScreenImage(true);
    };

    // Function to close full screen image
    const closeFullScreenImage = () => {
        setShowFullScreenImage(false);
        setSelectedFullScreenImage(null);
    };

    const showEngineerOptions = () => {
        Alert.alert(
            "Select Engineer",
            "",
            [
                { text: "John Doe", onPress: () => setSelectedEngineer("John Doe") },
                { text: "Jane Smith", onPress: () => setSelectedEngineer("Jane Smith") },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const showPartOptions = () => {
        Alert.alert(
            "Select Part",
            "",
            [
                { text: "Motherboard", onPress: () => setSelectedPart("Motherboard") },
                { text: "Power Supply", onPress: () => setSelectedPart("Power Supply") },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const showPriorityOptions = () => {
        Alert.alert(
            "Select Priority",
            "",
            [
                { text: "High", onPress: () => setSelectedPriority("High") },
                { text: "Medium", onPress: () => setSelectedPriority("Medium") },
                { text: "Low", onPress: () => setSelectedPriority("Low") },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            "Select Image",
            "Choose an option",
            [
                {
                    text: "Take Photo",
                    onPress: () => launchCamera(
                        { mediaType: 'photo', quality: 0.8 },
                        (response) => {
                            if (response.assets && response.assets.length > 0) {
                                setSelectedImage(response.assets[0]);
                            }
                        }
                    )
                },
                {
                    text: "Choose from Gallery",
                    onPress: () => launchImageLibrary(
                        { mediaType: 'photo', quality: 0.8 },
                        (response) => {
                            if (response.assets && response.assets.length > 0) {
                                setSelectedImage(response.assets[0]);
                            }
                        }
                    )
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const removeImage = () => {
        setSelectedImage(null);
    };

    const handleUpdate = () => {
        Alert.alert("Success", "Details updated successfully");
        dispatch(fetchMaintenanceDetailNew(maintenanceId) as any);
    };

    const onDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    // Function to get status icon and color for reject comments
    const getStatusInfo = (isAccepted: boolean | null) => {
        if (isAccepted === true) {
            return { icon: "check-circle", color: "#4CAF50", text: "Accepted" };
        } else if (isAccepted === false) {
            return { icon: "close-circle", color: "#F44336", text: "Rejected" };
        } else {
            return { icon: "clock-outline", color: "#FF9800", text: "Pending" };
        }
    };

    const shouldShowEngineerSection = () => {
        if (!maintenanceDetail?.serviceSalePersons?.length) return false;

        if (!maintenanceDetail?.reject_comments?.length) return true;

        const hasAcceptedEngineer = maintenanceDetail.serviceSalePersons.some((person: any) => {
            const personComment = maintenanceDetail.reject_comments.find(
                (comment: any) => comment.name === person.name
            );
            return personComment?.is_accepted === true;
        });

        return hasAcceptedEngineer;
    };

    const showEngineerSection = shouldShowEngineerSection();

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
                <Header />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00BFA5" />
                    <Text style={styles.loadingText}>Loading asset details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
                <Header />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => dispatch(fetchMaintenanceDetailNew(maintenanceId) as any)}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <Header />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
            >
                <View style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollViewContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {maintenanceDetail?.is_ready_for_closer && (
                            <ClosureBanner onClosePress={() => setShowClosureConfirm(true)} />
                        )}

                        {/* Always render these sections with the data we have */}
                        <AssetDetailsSection
                            assetDetails={assetDetails}
                            isExpanded={isAssetDetailsExpanded}
                            onToggle={() => setIsAssetDetailsExpanded(!isAssetDetailsExpanded)}
                        />
                        <MaintenanceDetailsSection maintenance={maintenance} />

                        {/* Parts Section */}
                        <View style={styles.section}>
                            <Text style={styles.partsTitle}>Installed and Removed Parts</Text>

                            {maintenanceDetail?.parts?.map((part, index) => {
                                const statusText = part.installation ? "Installed" : "Removed";
                                const statusColor = part.installation ? "#4CAF50" : "#F44336"; // green/red
                                return (
                                    <View key={index} style={styles.partRow}>
                                        <View style={styles.partLeft}>
                                            <Text style={styles.partName} numberOfLines={2} ellipsizeMode="tail">
                                                {part.part_no}
                                            </Text>
                                            <View style={styles.qtyBadge}>
                                                <Text style={styles.qtyText}>{part.quantity}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.partStatus, { color: statusColor }]}>
                                            {statusText}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Attachments Section */}
                        {(maintenanceDetail?.photos && maintenanceDetail.photos.length > 0) && (
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.commentsHeader}
                                    onPress={() => setShowAttachments(!showAttachments)}
                                >
                                    <Text style={styles.commentsTitle}>
                                        Attachments ({maintenanceDetail.photos.length})
                                    </Text>
                                    <Icon
                                        name={showAttachments ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#333"
                                    />
                                </TouchableOpacity>

                                {showAttachments && (
                                    <View style={styles.attachmentsContainer}>
                                        {maintenanceDetail.photos.map((photo: any, index: number) => (
                                            <TouchableOpacity
                                                key={photo.id || index}
                                                style={styles.attachmentItem}
                                                onPress={() => handleImageTap(photo)}
                                            >
                                                <Image
                                                    source={{ uri: `https://${photo.image_uri}` }}
                                                    style={styles.attachmentImage}
                                                    resizeMode="cover"
                                                />
                                                <Text style={styles.attachmentText}>
                                                    {photo.image_uri?.split('/').pop() || `Attachment ${index + 1}`}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Comments Section */}
                        {maintenanceDetail?.comments && maintenanceDetail.comments.length > 0 && (
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.commentsHeader}
                                    onPress={() => setShowComments(!showComments)}
                                >
                                    <Text style={styles.commentsTitle}>
                                        Comments ({maintenanceDetail.comments.length})
                                    </Text>
                                    <Icon
                                        name={showComments ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#333"
                                    />
                                </TouchableOpacity>

                                {showComments && (
                                    <View style={styles.commentsContainer}>
                                        {maintenanceDetail.comments.map((commentItem: any, index: number) => (
                                            <View key={commentItem.id || index} style={styles.commentItem}>
                                                {/* Comment Header with Avatar */}
                                                <View style={styles.commentHeader}>
                                                    <View style={styles.commentUserInfo}>
                                                        <View style={styles.avatar}>
                                                            <Text style={styles.avatarText}>
                                                                {commentItem.comment_by_name ? commentItem.comment_by_name.charAt(0).toUpperCase() : "U"}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.commentUserDetails}>
                                                            <Text style={styles.commentAuthor}>
                                                                {commentItem.comment_by_name || "Unknown User"}
                                                            </Text>
                                                            <Text style={styles.commentTime}>
                                                                {formatDateTime(commentItem.time)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>

                                                {/* Comment Text */}
                                                <Text style={styles.commentText}>
                                                    {commentItem.comment}
                                                </Text>

                                                {/* Visit Date if available */}
                                                {commentItem.visit_date && (
                                                    <View style={styles.visitDateContainer}>
                                                        <Icon name="calendar-clock" size={16} color="#666" />
                                                        <Text style={styles.visitDate}>
                                                            Visit Date: {formatDate(commentItem.visit_date)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Reject Comments Section */}
                        {maintenanceDetail?.reject_comments && maintenanceDetail.reject_comments.length > 0 && (
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.commentsHeader}
                                    onPress={() => setShowRejectComments(!showRejectComments)}
                                >
                                    <Text style={styles.commentsTitle}>
                                        Approval Status ({maintenanceDetail.reject_comments.length})
                                    </Text>
                                    <Icon
                                        name={showRejectComments ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#333"
                                    />
                                </TouchableOpacity>

                                {showRejectComments && (
                                    <View style={styles.commentsContainer}>
                                        {maintenanceDetail.reject_comments.map((rejectComment: any, index: number) => {
                                           const statusInfo = getStatusInfo(rejectComment.is_accepted);
                                            return (
                                                <View key={index} style={styles.rejectCommentItem}>
                                                    {/* Reject Comment Header */}
                                                    <View style={styles.commentHeader}>
                                                        <View style={styles.commentUserInfo}>
                                                            <View style={styles.avatar}>
                                                                <Text style={styles.avatarText}>
                                                                    {rejectComment.name ? rejectComment.name.charAt(0).toUpperCase() : "U"}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.commentUserDetails}>
                                                                <Text style={styles.commentAuthor}>
                                                                    {rejectComment.name || "Unknown User"}
                                                                </Text>
                                                                <View style={styles.statusContainer}>
                                                                    <Icon
                                                                        name={statusInfo.icon}
                                                                        size={16}
                                                                        color={statusInfo.color}
                                                                    />
                                                                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                                                                        {statusInfo.text}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    {/* Reject Comment Text if available */}
                                                    {rejectComment.comment_for_reject && (
                                                        <Text style={styles.commentText}>
                                                            {rejectComment.comment_for_reject}
                                                        </Text>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Engineer Wallet Section */}
                        <View style={styles.section}>
                            {/* Display service persons from API */}
                            {maintenanceDetail?.serviceSalePersons?.length > 0 ? (
                                maintenanceDetail.serviceSalePersons.map((person, index) => (
                                    <View key={index} style={styles.engineerInfo}>
                                        <Text style={styles.engineerName}>
                                            {person.name}
                                        </Text>
                                        <View style={styles.buttonContainer}>
                                            {/* Wallet Button */}
                                            {showEngineerSection && <TouchableOpacity
                                                style={styles.walletButton}
                                                onPress={() => navigation.navigate("WalletScreen", {
                                                    engineerId: person.id,
                                                    engineerName: person.name,
                                                    walletData: person.wallet
                                                })}
                                            >
                                                <Text style={styles.buttonText}>Wallet</Text>
                                                <Icon name="wallet-outline" size={16} color="#666" />
                                            </TouchableOpacity>}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No service persons assigned</Text>
                                </View>
                            )}
                        </View>

                        {/* Parts Details Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.partsTitle}>Parts Details</Text>

                                {/* Debug: Check how many accepted persons */}
                                {/* {console.log("All service persons:", maintenanceDetail?.serviceSalePersons)}
                                {console.log("Reject comments:", maintenanceDetail?.reject_comments)} */}

                                {/* Display service persons from API */}
                                {maintenanceDetail?.serviceSalePersons
                                    ?.filter((person: any) => {
                                        // Check if this person has accepted in reject_comments
                                        const acceptedComment = maintenanceDetail?.reject_comments?.find(
                                            (comment: any) => comment.name === person.name && comment.is_accepted === true
                                        );
                                        // console.log(acceptedComment)
                                        console.log(`Person: ${person.name}, Accepted: ${acceptedComment !== undefined}`);
                                        return acceptedComment !== undefined;
                                    })
                                    .slice(0, 1) // Take only the first accepted person
                                    .map((person: any, index: number) => {
                                        // console.log("Showing parts button for:", person.name);
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.detailsButton}
                                                onPress={() => navigation.navigate("PartsDetails", {
                                                    serviceSalePersons: [person],
                                                    maintenanceId: maintenanceId,
                                                    engineerName: person.name
                                                })}
                                            >
                                                <View style={styles.buttonContent}>
                                                    <Text style={styles.buttonText}>View</Text>
                                                    <Icon name="chevron-right" size={20} color="#00BFA5" />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                }
                            </View>
                        </View>

                        {/* Engineer Section */}
                        {<EngineerSection
                            showWalletPopup={showWalletPopup}
                            setShowWalletPopup={setShowWalletPopup}
                            navigation={navigation}
                            showEngineerOptions={showEngineerOptions}
                            showPartOptions={showPartOptions}
                            showPriorityOptions={showPriorityOptions}
                            setShowDatePicker={setShowDatePicker}
                            selectedEngineer={selectedEngineer}
                            selectedPart={selectedPart}
                            selectedPriority={selectedPriority}
                            setSelectedPriority={setSelectedPriority}
                            selectedDate={selectedDate}
                            formatDate={(date) => {
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const year = date.getFullYear();
                                return `${day}/${month}/${year}`;
                            }}
                            comment={comment}
                            setComment={setComment}
                            selectedImage={selectedImage}
                            setSelectedImage={setSelectedImage}
                            showImagePickerOptions={showImagePickerOptions}
                            removeImage={removeImage}
                            handleUpdate={handleUpdate}
                            maintenanceId={maintenanceId}
                            maintenanceData={maintenanceDetail}
                            status={maintenanceDetail?.status || ""}
                        />}
                    </ScrollView>

                    {/* Full Screen Image Modal */}
                    <Modal
                        visible={showFullScreenImage}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={closeFullScreenImage}
                    >
                        <View style={styles.fullScreenModal}>
                            <TouchableOpacity 
                                style={styles.fullScreenCloseButton}
                                onPress={closeFullScreenImage}
                            >
                                <Icon name="close" size={30} color="#FFFFFF" />
                            </TouchableOpacity>
                            
                            {selectedFullScreenImage && (
                                <Image
                                    source={{ uri: `https://${selectedFullScreenImage.image_uri}` }}
                                    style={styles.fullScreenImage}
                                    resizeMode="contain"
                                />
                            )}
                            
                            <View style={styles.fullScreenImageInfo}>
                                <Text style={styles.fullScreenImageText}>
                                    {selectedFullScreenImage?.image_uri?.split('/').pop() || "Attachment"}
                                </Text>
                            </View>
                        </View>
                    </Modal>

                    {/* Wallet Modal */}
                    <Modal
                        visible={showWalletPopup}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowWalletPopup(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Engineer Wallet</Text>
                                <Text style={styles.modalText}>
                                    Wallet details for the selected engineer will be shown here.
                                </Text>
                                <TouchableOpacity
                                    style={styles.modalCloseButton}
                                    onPress={() => setShowWalletPopup(false)}
                                >
                                    <Text style={styles.modalCloseText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* First Confirmation Modal */}
                    <Modal
                        visible={showClosureConfirm}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowClosureConfirm(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Request Maintenance Closure</Text>
                                <Text style={styles.modalText}>
                                    Are you sure you want to close this maintenance?
                                </Text>
                                <View style={styles.modalButtonContainer}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setShowClosureConfirm(false)}
                                    >
                                        <Text style={styles.modalButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.confirmButton]}
                                        onPress={() => {
                                            setShowClosureConfirm(false);
                                            setShowFinalConfirm(true);
                                        }}
                                    >
                                        <Text style={styles.modalButtonText}>Yes</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Final Confirmation Modal */}
                    <Modal
                        visible={showFinalConfirm}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowFinalConfirm(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.dangerIconContainer}>
                                    <Icon name="alert-circle" size={40} color="#D32F2F" />
                                </View>
                                <Text style={styles.modalTitle}>Final Confirmation</Text>
                                <Text style={styles.modalText}>
                                    Are you absolutely sure you want to close this maintenance?
                                </Text>
                                <View style={styles.modalButtonContainer}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setShowFinalConfirm(false)}
                                        disabled={isClosing}
                                    >
                                        <Text style={styles.modalButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.dangerButton]}
                                        onPress={handleMaintenanceClosure}
                                        disabled={isClosing}
                                    >
                                        {isClosing ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.modalButtonText}>Yes</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    stickyHeader: {
        padding: 16
    },
    keyboardAvoid: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
        width: "80%",
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#1A1D29",
        textAlign: "center",
    },
    modalText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    detailsButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 6,
        backgroundColor: "#E8F5E8",
        borderRadius: 6,
        marginRight: 8,
    },
    walletButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 6,
        backgroundColor: "#E3F2FD",
        borderRadius: 6,
    },
    buttonText: {
        color: "#2E7D2E",
        fontSize: 12,
        fontWeight: "600",
        marginRight: 4,
    },
    engineerSummary: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        padding: 8,
        backgroundColor: "#F8F9FA",
        borderRadius: 6,
    },
    modalCloseButton: {
        backgroundColor: "#00BFA5",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    modalCloseText: {
        color: "white",
        fontWeight: "600",
    },
    modalButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    modalButton: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 6,
        alignItems: "center",
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: "#E0E0E0",
    },
    confirmButton: {
        backgroundColor: "#00BFA5",
    },
    dangerButton: {
        backgroundColor: "#D32F2F",
    },
    modalButtonText: {
        color: "white",
        fontWeight: "600",
    },
    dangerIconContainer: {
        marginBottom: 10,
    },
    partsDetailsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        padding: 12,
        backgroundColor: "#F8F9FA",
        borderRadius: 8,
        width: "100%",
    },
    partsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1D29",
    },
    engineerInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        padding: 12,
        backgroundColor: "#F8F9FA",
        borderRadius: 8,
        width: "100%",
    },
    engineerName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1D29",
        flex: 1,
    },
    pendingText: {
        color: "#FF9800",
        fontWeight: "500",
    },
    walletLink: {
        padding: 6,
        backgroundColor: "#E8F5E8",
        borderRadius: 6,
        minWidth: 90,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    walletLinkText: {
        color: "#2E7D2E",
        fontSize: 12,
        fontWeight: "600",
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
    },
    partsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1D29",
    },
    detailsButton: {
        backgroundColor: "#F5F7FA",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#00BFA5",
        marginRight: 8,
    },
    partItem: {
        padding: 8,
        backgroundColor: "#F5F7FA",
        borderRadius: 6,
        marginBottom: 8,
    },
    partText: {
        fontSize: 14,
        color: "#1A1D29",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: "#D32F2F",
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: "#00BFA5",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    retryText: {
        color: "white",
        fontWeight: "600",
    },
    // Comments Section Styles
    commentsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    commentsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1D29",
    },
    commentsContainer: {
        marginTop: 10,
    },
    commentItem: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e8e8e8",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 1,
    },
    rejectCommentItem: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e8e8e8",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 1,
    },
    commentHeader: {
        marginBottom: 10,
    },
    commentUserInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#0FA37F",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
    commentUserDetails: {
        flex: 1,
    },
    commentAuthor: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
        marginBottom: 2,
    },
    commentTime: {
        fontSize: 12,
        color: "#666",
    },
    commentText: {
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
        marginBottom: 8,
    },
    visitDateContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    visitDate: {
        fontSize: 12,
        color: "#666",
        marginLeft: 6,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
    },
    // Attachments Section Styles
    attachmentsContainer: {
        marginTop: 10,
    },
    attachmentItem: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e8e8e8",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 1,
        alignItems: "center",
    },
    attachmentImage: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    attachmentText: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
    // Full Screen Image Styles
    fullScreenModal: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullScreenCloseButton: {
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: 10,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 20,
        padding: 5,
    },
    fullScreenImage: {
        width: "100%",
        height: "80%",
    },
    fullScreenImageInfo: {
        position: "absolute",
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: "center",
        padding: 10,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    fullScreenImageText: {
        color: "#FFFFFF",
        fontSize: 14,
        textAlign: "center",
    },

    partRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start", // Changed from "center" to "flex-start"
        backgroundColor: "#F9FAFB",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 8,
    },

    partLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1, // Added to take available space
        marginRight: 8, // Added spacing between part info and status
    },

    partName: {
        fontSize: 15,
        color: "#1A1D29",
        fontWeight: "500",
        flex: 1, // Added to allow text wrapping
        flexWrap: "wrap", // Added to allow text wrapping
    },

    qtyBadge: {
        backgroundColor: "#2196F3",
        borderRadius: 50,
        width: 26,
        height: 26,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0, // Added to prevent badge from shrinking
    },

    qtyText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },

    partStatus: {
        fontSize: 14,
        fontWeight: "600",
        flexShrink: 0, // Added to prevent status from shrinking
        marginLeft: 8, // Added spacing
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafbfc',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#edf2f7',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 22,
    },
});

export default AssetDetailsScreen;