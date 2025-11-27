// ClosedAssetDetails.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Image,
    Modal,
    Dimensions,
    Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchMaintenanceDetail,
    selectMaintenanceDetail,
    selectMaintenanceDetailLoading,
    selectMaintenanceDetailError,
    clearCurrentDetail,
} from "../Redux/Slices/maintenanceSlice";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Header } from "./Header";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ClosedAssetDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { ticket }: any = route.params || {};

    const maintenanceDetail = useSelector(selectMaintenanceDetail);
    const loading = useSelector(selectMaintenanceDetailLoading);
    const error = useSelector(selectMaintenanceDetailError);

    const [showAsset, setShowAsset] = useState(false);
    const [showComments, setShowComments] = useState(false);

    // Full screen image modal states
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (ticket?.id) {
            dispatch(fetchMaintenanceDetail(ticket.id) as any);
        }

        return () => {
            dispatch(clearCurrentDetail());
        };
    }, [ticket?.id, dispatch]);

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

    // Full Screen Image Handlers
    const handleImagePress = (imageUri: string, index: number) => {
        setSelectedImageUri(`https://${imageUri}`);
        setCurrentImageIndex(index);
        setShowImageModal(true);
    };

    const handleCloseImageModal = () => {
        setShowImageModal(false);
        setSelectedImageUri(null);
    };

    const handleNextImage = () => {
        if (maintenanceDetail?.photos && maintenanceDetail.photos.length > 0) {
            const nextIndex = (currentImageIndex + 1) % maintenanceDetail.photos.length;
            setCurrentImageIndex(nextIndex);
            setSelectedImageUri(`https://${maintenanceDetail.photos[nextIndex].image_uri}`);
        }
    };

    const handlePrevImage = () => {
        if (maintenanceDetail?.photos && maintenanceDetail.photos.length > 0) {
            const prevIndex = (currentImageIndex - 1 + maintenanceDetail.photos.length) % maintenanceDetail.photos.length;
            setCurrentImageIndex(prevIndex);
            setSelectedImageUri(`https://${maintenanceDetail.photos[prevIndex].image_uri}`);
        }
    };

    if (loading) {
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
                        onPress={() => ticket?.id && dispatch(fetchMaintenanceDetail(ticket.id) as any)}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!maintenanceDetail) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>No maintenance details found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const {
        asset,
        complaint,
        compaint_date,
        issue_date,
        priority,
        status,
        ticket_no,
        complaint_type,
        ready_date,
        closer_date,
        clouser_comment,
        action_taken,
        parts,
        comments = [],
        description,
        photos = []
    } = maintenanceDetail;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <Header />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
                {/* Asset Details (collapsible) */}
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.cardHeader}
                        onPress={() => setShowAsset(!showAsset)}
                    >
                        <Text style={styles.cardTitle}>Asset Details</Text>
                        <Icon
                            name={showAsset ? "expand-less" : "expand-more"}
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>
                    {showAsset && (
                        asset ? (
                            <>
                                <Row label="Asset No" value={asset.asset_no || "N/A"} />
                                <Row label="Category" value={asset.category || "N/A"} />
                                <Row label="Make" value={asset.make || "N/A"} />
                                <Row label="Model" value={asset.model || "N/A"} />
                                <Row label="YOM" value={asset.yom || "N/A"} />
                                <Row label="Capacity" value={asset.capacity ? `${asset.capacity}kg` : "N/A"} />
                                <Row label="Height" value={asset.hieght_machine ? `${asset.hieght_machine}ft` : "N/A"} />
                                <Row label="Site Location" value={asset.site_location || "N/A"} />
                            </>
                        ) : (
                            <Text style={{ color: "#999", fontSize: 13 }}>No asset details available</Text>
                        )
                    )}
                </View>

                {/* Maintenance Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Maintenance Details</Text>
                    <Row label="Ticket ID" value={ticket_no || "N/A"} />
                    <Row label="Date of Complaint" value={formatDate(compaint_date)} />
                    <Row label="Breakdown Type" value={complaint_type === "major" ? "Major" : "Minor"} />
                    <Row label="Breakdown Title" value={complaint || "N/A"} />
                    <Row label="Breakdown Date" value={formatDate(issue_date)} />
                    <Row
                        label="Priority"
                        value={
                            <Text style={[styles.priorityBadge,
                            priority === "high" ? styles.badgeHigh :
                                priority === "medium" ? styles.badgeMedium :
                                    styles.badgeLow]}>
                                {priority || "Not Set"}
                            </Text>
                        }
                    />
                    <Row
                        label="Status"
                        value={
                            <Text style={[styles.statusBadge, styles.badgeClosed]}>
                                Closed
                            </Text>
                        }
                    />
                    <Row label="Deadline" value={formatDate(ready_date)} />
                    <Row label="Closure Date" value={formatDate(closer_date)} />

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.label}>Breakdown Description</Text>
                        <Text style={styles.descriptionText}>
                            {description || "No description available"}
                        </Text>
                    </View>
                </View>

                {/* Attachments Section */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Attachments</Text>
                    {photos && photos.length > 0 ? (
                        <View style={styles.attachmentsContainer}>
                            <Text style={styles.attachmentsCount}>
                                {photos.length} photo{photos.length !== 1 ? 's' : ''} attached
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.attachmentsScrollView}
                            >
                                <View style={styles.attachmentsRow}>
                                    {photos.map((photo: any, index: number) => (
                                        <TouchableOpacity
                                            key={photo.id || index}
                                            style={styles.attachmentItem}
                                            onPress={() => handleImagePress(photo.image_uri, index)}
                                            activeOpacity={0.7}
                                        >
                                            <Image
                                                source={{ uri: `https://${photo.image_uri}` }}
                                                style={styles.attachmentImage}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.attachmentOverlay}>
                                                <Icon name="remove-red-eye" size={20} color="#fff" />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    ) : (
                        <Text style={styles.noAttachmentsText}>No attachments available</Text>
                    )}
                </View>

                {/* Closure Details */}
                {(clouser_comment || action_taken) && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Closure Details</Text>
                        {clouser_comment && <Row label="Closure Comment" value={clouser_comment} />}
                        {action_taken && <Row label="Action Taken" value={action_taken} />}
                    </View>
                )}

                {/* Parts Details */}
                <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => {
                        if (maintenanceDetail?.id) {
                            navigation.navigate("SePartsDetailsTwo", {
                                maintenanceId: maintenanceDetail.id,
                                parts: maintenanceDetail.parts || [] // Pass the parts data
                            });
                        } else {
                            Alert.alert("Error", "Maintenance ID not available");
                        }
                    }}
                    accessible={true}
                    accessibilityLabel="View parts details"
                    accessibilityRole="button"
                >
                    <View style={styles.partsHeader}>
                        <Text style={styles.cardTitle}>Parts</Text>
                        <Text style={styles.partsCount}>
                            {parts?.length || 0} part{parts?.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#666" />
                </TouchableOpacity>

                {/* Comment Details */}
                {comments && comments.length > 0 && (
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.cardHeader}
                            onPress={() => setShowComments(!showComments)}
                        >
                            <Text style={styles.cardTitle}>
                                Comments ({comments.length})
                            </Text>
                            <Icon
                                name={showComments ? "expand-less" : "expand-more"}
                                size={24}
                                color="#666"
                            />
                        </TouchableOpacity>

                        {showComments && (
                            <View style={styles.commentsContainer}>
                                {comments.map((commentItem: any, index: number) => (
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
                                                    <View style={styles.nameContainer}>
                                                        <Text style={styles.commentAuthor}>
                                                            {commentItem.comment_by_name || "Unknown User"}
                                                        </Text>
                                                        {commentItem.by_me && (
                                                            <View style={styles.youBadge}>
                                                                <Text style={styles.youBadgeText}>You</Text>
                                                            </View>
                                                        )}
                                                    </View>
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
                                                <Icon name="calendar-today" size={16} color="#666" />
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
            </ScrollView>

            {/* Full Screen Image Modal */}
            <Modal
                visible={showImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseImageModal}
                statusBarTranslucent={true}
            >
                <View style={styles.fullScreenModal}>
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={handleCloseImageModal}
                    >
                        <Icon name="close" size={30} color="#fff" />
                    </TouchableOpacity>

                    {/* Navigation Arrows for multiple images */}
                    {photos.length > 1 && (
                        <>
                            <TouchableOpacity
                                style={[styles.navButton, styles.prevButton]}
                                onPress={handlePrevImage}
                            >
                                <Icon name="chevron-left" size={30} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.navButton, styles.nextButton]}
                                onPress={handleNextImage}
                            >
                                <Icon name="chevron-right" size={30} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Image */}
                    {selectedImageUri && (
                        <Image
                            source={{ uri: selectedImageUri }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    )}

                    {/* Image Counter */}
                    {photos.length > 1 && (
                        <View style={styles.imageCounter}>
                            <Text style={styles.imageCounterText}>
                                {currentImageIndex + 1} / {photos.length}
                            </Text>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const Row = ({ label, value }: any) => (
    <View style={styles.rowBetween}>
        <Text style={styles.label}>{label}</Text>
        {typeof value === "string" ? (
            <Text style={styles.value}>{value}</Text>
        ) : (
            value
        )}
    </View>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff"
    },
    stickyHeader: {
        padding: 16
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 20,
    },
    container: { flex: 1, backgroundColor: "#fff" },
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
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
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
    accordionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        margin: 8,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 1,
    },
    accordionTitle: {
        fontWeight: "600",
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    card: {
        backgroundColor: "#fff",
        margin: 8,
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        fontFamily: 'Inter-SemiBold',
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 5,
    },
    label: {
        fontSize: 14,
        color: "#666",
        fontFamily: 'Inter-Regular',
    },
    value: {
        fontSize: 14,
        fontWeight: "500",
        fontFamily: 'Inter-Medium',
    },
    priorityBadge: {
        color: "#fff",
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
        overflow: "hidden",
        fontSize: 11,
        fontFamily: 'Inter-Regular',
    },
    badgeHigh: {
        backgroundColor: "#dc3545",
    },
    badgeMedium: {
        backgroundColor: "#fca311",
    },
    badgeLow: {
        backgroundColor: "#2a9d8f",
    },
    statusBadge: {
        color: "#fff",
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
        overflow: "hidden",
        fontSize: 11,
        fontFamily: 'Inter-Regular',
    },
    badgeClosed: {
        backgroundColor: "#6c757d",
    },

    // Attachments Section Styles
    attachmentsContainer: {
        marginTop: 10,
    },
    attachmentsCount: {
        fontSize: 14,
        color: "#666",
        marginBottom: 10,
        fontFamily: 'Inter-Regular',
    },
    attachmentsScrollView: {
        flexGrow: 0,
    },
    attachmentsRow: {
        flexDirection: "row",
        gap: 12,
    },
    attachmentItem: {
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
    },
    attachmentImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    attachmentOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noAttachmentsText: {
        textAlign: "center",
        color: "#666",
        fontStyle: "italic",
        marginVertical: 10,
        fontFamily: 'Inter-Regular',
    },

    // Comment Section Styles
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
        fontFamily: 'Inter-SemiBold',
    },
    commentUserDetails: {
        flex: 1,
    },
    nameContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    commentAuthor: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
        marginBottom: 2,
        fontFamily: 'Inter-SemiBold',
    },
    youBadge: {
        backgroundColor: "#0FA37F",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    youBadgeText: {
        color: "#ffffff",
        fontSize: 10,
        fontWeight: "600",
        fontFamily: 'Inter-SemiBold',
    },
    commentTime: {
        fontSize: 12,
        color: "#666",
        fontFamily: 'Inter-Regular',
    },
    commentText: {
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
        marginBottom: 8,
        fontFamily: 'Inter-Regular',
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
        fontFamily: 'Inter-Regular',
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
    descriptionContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    descriptionText: {
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },

    partsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    partsCount: {
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        fontFamily: 'Inter-Regular',
    },

    // Full Screen Image Modal Styles
    fullScreenModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: screenWidth,
        height: screenHeight,
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    prevButton: {
        left: 20,
    },
    nextButton: {
        right: 20,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    imageCounterText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
});

export default ClosedAssetDetails;