import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMaintenanceDetail,
  selectMaintenanceDetail,
  selectMaintenanceDetailLoading,
  selectMaintenanceDetailError,
  clearCurrentDetail,
  acceptMaintenance,
  fetchMaintenanceList,
} from "../Redux/Slices/maintenanceSlice";
import { Header } from "./Header";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const OpenAssetsDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { ticket }: any = route.params || {};

  const maintenanceDetail = useSelector(selectMaintenanceDetail);
  const loading = useSelector(selectMaintenanceDetailLoading);
  const error = useSelector(selectMaintenanceDetailError);

  const [comment, setComment] = useState("");
  const [showAssetDetails, setShowAssetDetails] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [rejectPressed, setRejectPressed] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (ticket?.id) {
      dispatch(fetchMaintenanceDetail(ticket.id) as any);
    }

    return () => {
      dispatch(clearCurrentDetail());
    };
  }, [ticket?.id, dispatch]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (ticket?.id) {
        await dispatch(fetchMaintenanceDetail(ticket.id) as any);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
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


  const handleRejectClick = () => {
    // Show comment box when reject is clicked
    setShowCommentBox(true);
    setRejectPressed(true);
  };

  const handleAccept = () => {
    if (!maintenanceDetail?.id) return;

    dispatch(acceptMaintenance({
      is_accepted: true,
      comment: "Accepted",
      maintenance_id: maintenanceDetail.id
    }) as any)
      .then(() => {
        Alert.alert("Accepted", "You have accepted this assignment.");

        dispatch(fetchMaintenanceList() as any);

        navigation.goBack();
      })
      .catch(() => {
        Alert.alert("Error", "Failed to accept assignment.");
      });
  };

  const handleRejectConfirm = () => {
    if (!maintenanceDetail?.id) return;

    // Validate comment for rejection
    if (!comment.trim()) {
      setRejectPressed(true);
      Alert.alert(
        "Comment Required",
        "Please provide a comment explaining why you are rejecting this assignment.",
        [{ text: "OK" }]
      );
      return;
    }

    setRejectPressed(false);

    dispatch(acceptMaintenance({
      is_accepted: false,
      comment: comment,
      maintenance_id: maintenanceDetail.id
    }) as any)
      .then(() => {
        Alert.alert("Rejected", "You have rejected this assignment.");

        dispatch(fetchMaintenanceList() as any);

        navigation.goBack();
      })
      .catch(() => {
        Alert.alert("Error", "Failed to reject assignment.");
      });
  };

  const handleCancelReject = () => {
    // Hide comment box and reset states
    setShowCommentBox(false);
    setRejectPressed(false);
    setComment("");
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
    types,
    description,
    ready_date,
    is_accepeted,
    comments = [],
    lease_customer,
    lease_end_date,
    lease_sale_person,
    complaint_type,
  } = maintenanceDetail;



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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0FA37F"]} // Android - 
              tintColor="#0FA37F" // iOS 
              title="Refreshing..." // iOS
              titleColor="#666" // iOS
            />}
        >

          {/* Asset Details */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setShowAssetDetails(!showAssetDetails)}
            >
              <Text style={styles.cardTitle}>Asset Details</Text>
              <Icon
                name={showAssetDetails ? "chevron-up" : "chevron-down"}
                size={20}
                color="#333"
              />
            </TouchableOpacity>

            {showAssetDetails && (
              <>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Asset</Text>
                    <Text style={styles.value}>{asset?.asset_no || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Height Capacity</Text>
                    <Text style={styles.value}>
                      {asset?.capacity && asset?.hieght_machine
                        ? `${asset.capacity}kg - ${asset.hieght_machine}ft`
                        : "N/A"
                      }
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Lease</Text>
                    <View>
                      <Text>{asset.lease_status}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Model No.</Text>
                    <Text style={styles.value}>{asset?.model || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Category</Text>
                    <Text style={styles.value}>{asset?.category || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Customer</Text>
                    <Text style={styles.value}>{lease_customer || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Make</Text>
                    <Text style={styles.value}>{asset?.make || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>YOM</Text>
                    <Text style={styles.value}>{asset?.yom || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Rental End Date</Text>
                    <Text style={styles.value}>{formatDate(lease_end_date)}</Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Operator</Text>
                    <Text style={styles.value}>
                      {Array.isArray(maintenanceDetail?.lease_operator) &&
                        maintenanceDetail.lease_operator.length > 0
                        ? maintenanceDetail.lease_operator[0]
                        : "N/A"}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Sales Person</Text>
                    <Text style={styles.value}>{lease_sale_person || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Site Location</Text>
                    <Text style={styles.value}>{asset?.site_location || "N/A"}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Maintenance Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Maintenance Details</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Ticket ID</Text>
                <Text style={styles.value}>{ticket_no}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Date of Complaint</Text>
                <Text style={styles.value}>{formatDate(compaint_date)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Breakdown Type</Text>
                <Text style={styles.value}>
                  {complaint_type === "major" ? "Major" :
                    complaint_type === "minor" ? "Minor" :
                      complaint_type || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Breakdown Title</Text>
                <Text style={styles.value}>{complaint || "N/A"}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Breakdown Date</Text>
                <Text style={styles.value}>{formatDate(issue_date)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Priority</Text>
                <View style={[
                  styles.badge,
                  priority === "high" ? styles.badgeHigh :
                    priority === "medium" ? styles.badgeMedium :
                      styles.badgeLow
                ]}>
                  <Text style={styles.badgeText}>{priority || "Not Set"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.badgeClosure}>
                  <Text style={styles.badgeClosureText}>
                    {status === "open" ? "Open" :
                      status === "in_progress" ? "In Progress" :
                        status === "closed" ? "Closed" : status}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Deadline</Text>
                <Text style={styles.value}>{formatDate(ready_date)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Service Type</Text>
                <Text style={styles.value}>
                  {types === "warranty" ? "Warranty" :
                    types === "non_warranty" ? "Non-Warranty" :
                      types === "safety_notice" ? "Safety Notice" :
                        types || "N/A"}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.label}>Breakdown Description</Text>
              <Text style={styles.descriptionText}>
                {description || "No description available"}
              </Text>
            </View>
          </View>

          {/* Comments Section */}
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
                  name={showComments ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#333"
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

          {/* Assignment Request - Only show if not accepted */}
          {!is_accepeted && (
            <View style={styles.card}>
              <View style={styles.assignmentHeader}>
                <Text style={styles.cardTitle}>Assignment Request</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.questionText}>
                Do you want to accept this assignment?
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>

                {!showCommentBox ? (
                  <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectClick}>
                    <Text style={styles.btnText}>Reject</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.cancelRejectBtn} onPress={handleCancelReject}>
                    <Text style={styles.cancelRejectText}>Cancel Reject</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Comment Box - Only show when reject is clicked */}
              {showCommentBox && (
                <View style={styles.commentInputContainer}>
                  <Text style={styles.commentLabel}>
                    Comment <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    placeholder="Please provide a comment explaining why you are rejecting this assignment"
                    style={[
                      styles.commentBox,
                      rejectPressed && !comment.trim() && styles.commentBoxError
                    ]}
                    multiline
                    value={comment}
                    onChangeText={(text) => {
                      setComment(text);
                      if (rejectPressed && text.trim()) {
                        setRejectPressed(false);
                      }
                    }}
                    placeholderTextColor={rejectPressed && !comment.trim() ? "#ff6b6b" : "#999"}
                    autoFocus={true}
                  />
                  {rejectPressed && !comment.trim() && (
                    <Text style={styles.errorTextSmall}>
                      Comment is required when rejecting assignment
                    </Text>
                  )}

                  {/* Confirm Reject Button */}
                  <TouchableOpacity
                    style={[
                      styles.confirmRejectBtn,
                      !comment.trim() && styles.confirmRejectBtnDisabled
                    ]}
                    onPress={handleRejectConfirm}
                    disabled={!comment.trim()}
                  >
                    <Text style={styles.confirmRejectText}>
                      Confirm Rejection
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff"
  },
  keyboardAvoid: {
    flex: 1,
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    alignItems: "center",
  },
  logoText: { fontSize: 18, fontWeight: "bold" },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#bbb",
  },
  requestClosureBtn: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#c00",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 12,
  },
  requestClosureText: { color: "#c00", fontWeight: "500" },
  card: {
    backgroundColor: "#fff",
    margin: 12,
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
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailItem: { flex: 1 },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
    fontFamily: 'Inter-Regular',
  },
  value: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111",
    fontFamily: 'Inter-Medium',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeActive: {
    backgroundColor: "#0FA37F",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeHigh: {
    backgroundColor: "#e63946",
  },
  badgeMedium: {
    backgroundColor: "#fca311",
  },
  badgeLow: {
    backgroundColor: "#2a9d8f",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  badgeClosure: {
    backgroundColor: "#f7c59f",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeClosureText: {
    fontSize: 12,
    color: "#c65f00",
    fontFamily: 'Inter-Regular',
  },
  assignmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelText: {
    color: "#007bff",
    fontWeight: "500",
    fontFamily: 'Inter-Medium',
  },
  boldText: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    fontFamily: 'Inter-Bold',
  },
  descText: {
    fontSize: 13,
    color: "#333",
    marginBottom: 10,
    fontFamily: 'Inter-Regular',
  },
  questionText: {
    fontSize: 14,
    marginVertical: 10,
    fontFamily: 'Inter-Medium',
  },
  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  acceptBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  rejectBtn: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  cancelRejectBtn: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  cancelRejectText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: 'Inter-SemiBold',
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: 'Inter-SemiBold',
  },
  commentInputContainer: {
    marginTop: 12,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
    fontFamily: 'Inter-Medium',
  },
  commentBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  commentBoxError: {
    borderColor: "#ff6b6b",
    backgroundColor: "#fff5f5",
  },
  confirmRejectBtn: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  confirmRejectBtnDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.6,
  },
  confirmRejectText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  errorText: {
    color: "#ff0202",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: 'Inter-Regular',
  },
  errorTextSmall: {
    color: "#ff0202",
    fontSize: 12,
    marginTop: 6,
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
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
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
  commentAuthor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
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
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Regular',
  },
  requiredAsterisk: {
    color: "#ff0202",
  },
});

export default OpenAssetsDetails;