import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMaintenanceDetail,
  selectMaintenanceDetail,
  selectMaintenanceDetailLoading,
  selectMaintenanceDetailError,
  clearCurrentDetail,
} from "../Redux/Slices/maintenanceSlice";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import ClosureRequestModal from "./ClosureRequestModal";
import { Header } from "./Header";
import { authClient } from "../services/api.clients";
import { APIEndpoints } from "../services/api.endpoints";
import ExpandableText from "../Components/ExpandableText";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AcceptAssetDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { ticket }: any = route.params || {};

  const maintenanceDetail = useSelector(selectMaintenanceDetail);
  const loading = useSelector(selectMaintenanceDetailLoading);
  const error = useSelector(selectMaintenanceDetailError);

  const [showAsset, setShowAsset] = useState(false);
  const [comment, setComment] = useState("");
  const [visited, setVisited] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Full screen image modal states
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(() => {
    if (ticket?.id) {
      dispatch(fetchMaintenanceDetail(ticket.id) as any);
    }
  }, [ticket?.id, dispatch]);


  console.log("maindetails", maintenanceDetail)

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();

      // Cleanup function
      return () => {
        // Optional: cleanup if needed
      };
    }, [fetchData])
  );

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

  useEffect(() => {
    fetchData();

    return () => {
      dispatch(clearCurrentDetail());
    };
  }, [fetchData, dispatch]);

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

  // Format datetime for comments
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
  const handleRequestClosure = () => {
    setShowClosureModal(true);
  };

  const handleClosureSubmit = (temporary: boolean) => {
    setShowClosureModal(false);
    if (maintenanceDetail?.id) {
      navigation.navigate("MaintenanceRating", {
        maintenanceId: maintenanceDetail.id,
        temporary,
        types: maintenanceDetail.types
      });
    } else {
      Alert.alert("Error", "Maintenance ID not found");
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

  // Camera and Gallery Permissions
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

  // Upload Photo API Call
  const handleUploadImage = async () => {
    if (!selectedImage) {
      return { success: true }; // No image to upload is not an error
    }

    if (!maintenanceDetail?.id) {
      Alert.alert("Error", "Maintenance ID not found");
      return { success: false };
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('types', 'maintenance');
      formData.append('maintenance_id', maintenanceDetail.id);
      formData.append('photo', {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: selectedImage.fileName || `photo_${Date.now()}.jpg`,
      });

      const response = await authClient.post(APIEndpoints.uploadPhoto, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success || response.data.mgs) {
        setSelectedImage(null);
        return { success: true, message: response.data.mgs || response.data.message };
      } else {
        throw new Error(response.data.message || "Failed to upload image");
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to upload image"
      };
    } finally {
      setUploading(false);
    }
  };

  // Add Comment API Call (now includes image upload)
  const handleAddComment = async () => {
    if (!comment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    if (!maintenanceDetail?.id) {
      Alert.alert("Error", "Maintenance ID not found");
      return;
    }

    setAddingComment(true);
    try {
      // First upload image if selected
      let uploadResult = { success: true };
      if (selectedImage) {
        uploadResult = await handleUploadImage();
        if (!uploadResult.success) {
          Alert.alert("Image Upload Failed", uploadResult.message || "Failed to upload image");
          return;
        }
      }

      // Then add comment
      const payload = {
        comment: comment.trim(),
        visit_date: visited ? visitDate.toISOString().split('T')[0] : null,
        maintenance_id: maintenanceDetail.id
      };

      const response = await authClient.post(APIEndpoints.addCommentSale, payload);

      console.log("Add comment response::::::::::", response.data);

      if (response.data.success || response.data.msg) {
        Alert.alert("Success", response.data.msg || "Comment added successfully");
        setComment("");
        setVisited(false);
        // Refresh maintenance details to show new comment
        dispatch(fetchMaintenanceDetail(maintenanceDetail.id) as any);
      } else {
        throw new Error(response.data.message || "Failed to add comment");
      }

    } catch (error: any) {
      console.error("Add comment error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to add comment");
    } finally {
      setAddingComment(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setVisitDate(selectedDate);
    }
  };

  // Get maximum date (today) for visit date picker
  const getMaxDate = () => {
    return new Date();
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
    parts,
    comments = [],
    description,
    is_ready_for_closer,
    photos = [],
    lease_customer,
    lease_end_date,
    lease_sale_person
  } = maintenanceDetail;


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <Header />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0FA37F"]} // Android - 
              tintColor="#0FA37F" // iOS - 
              title="Refreshing..." // iOS
              titleColor="#666" // iOS
            />
          }
        >
          {/* Request Closure */}
          {is_ready_for_closer ? (
            <View style={styles.closureRequestedContainer}>
              <Icon name="check-circle" size={20} color="#0FA37F" style={styles.closureIcon} />
              <Text style={styles.closureRequestedText}>Closure Requested</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.requestClosureButton}
              onPress={handleRequestClosure}
            >
              <Text style={styles.requestClosureButtonText}>Request Closure</Text>
            </TouchableOpacity>
          )}

          <ClosureRequestModal
            visible={showClosureModal}
            onClose={() => setShowClosureModal(false)}
            onSubmit={handleClosureSubmit}
          />

          {/* Asset Details */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setShowAsset(!showAsset)}
            >
              <Text style={styles.cardTitle}>Asset Details</Text>
              <Icon name={showAsset ? "chevron-up" : "chevron-down"} size={20} color="#333" />
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
                  <ExpandableText
                    label="Customer"
                    value={lease_customer || "N/A"}
                    maxLength={30} 
                  />
                  <Row label="Rental End Date" value={formatDate(lease_end_date) || "N/A"} />
                  <Row label="Sale Person" value={formatDate(lease_sale_person) || "N/A"} />
                  {/* <Row label="Operator" value={maintenanceDetail?.lease_operator[0] || "N/A"} /> not getting data */}

                </>
              ) : (
                <Text style={{ color: "#999", fontSize: 13 }}>
                  No asset details available
                </Text>
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
                <Text style={[
                  styles.statusBadge,
                  status === "open" && styles.statusOpen,
                  status === "in_progress" && styles.statusInProgress,
                  status === "closed" && styles.statusClosed,
                  is_ready_for_closer && styles.closureRequestedBadge
                ]}>
                  {is_ready_for_closer ? "Closure Requested" :
                    status === "open" ? "Open" :
                      status === "in_progress" ? "In Progress" :
                        status === "closed" ? "Closed" : status}
                </Text>
              }
            />
            <Row label="Deadline" value={formatDate(ready_date)} />

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
                          <Icon name="eye" size={20} color="#fff" />
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

          {/* Parts Details */}
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => {
              if (maintenanceDetail?.id) {
                navigation.navigate("SePartsDetails", {
                  maintenanceId: maintenanceDetail.id
                });
              } else {
                Alert.alert("Error", "Maintenance ID not available");
              }
            }}
            accessible={true}
            accessibilityLabel="View parts details"
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle}>Parts Details</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>

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
              <Text style={styles.cardTitle}>Installed and Removed Parts Details</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>

          {/* Comment Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comment Details</Text>

            {comments && comments.length > 0 ? (
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
                        <Icon name="calendar-clock" size={16} color="#666" />
                        <Text style={styles.visitDate}>
                          Visit Date: {formatDate(commentItem.visit_date)}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noCommentsText}>No comments yet</Text>
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="Add your detailed comments here..."
              multiline
              value={comment}
              onChangeText={setComment}
              placeholderTextColor="#999"
            />

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                onPress={() => setVisited(!visited)}
                style={[
                  styles.checkbox,
                  visited && { backgroundColor: "#0FA37F", borderColor: "#0FA37F" },
                ]}
              >
                {visited && <Text style={{ color: "#fff" }}>✔</Text>}
              </TouchableOpacity>
              <Text style={{ fontSize: 13 }}>
                Please select if you visited the site
              </Text>
            </View>

            {visited && (
              <View style={styles.datePickerRow}>
                <Text style={styles.dateLabel}>Visit Date:</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{visitDate.toLocaleDateString()}</Text>
                  <Icon name="calendar-today" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* Image Upload Section */}
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
                  <Text style={styles.uploadButtonText}>Select Image</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.saveBtn, (addingComment || uploading) && styles.disabledButton]}
                onPress={handleAddComment}
                disabled={addingComment || uploading || !comment.trim()}
              >
                {(addingComment || uploading) ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Add Comment
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={visitDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={getMaxDate()} // Prevent future dates
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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

const Row = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff"
  },
  container: {
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, backgroundColor: "#fff" },
  logoText: { fontSize: 20, fontWeight: "bold" },
  profilePic: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ddd" },
  requestClosureButton: {
    padding: 10,
    margin: 15,
    borderRadius: 5,
    alignItems: "center",
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#df1616",
  },
  requestClosureButtonText: {
    color: "#e92424",
    fontWeight: "bold",
  },
  closureRequestedContainer: {
    padding: 15,
    marginHorizontal: 16,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  closureIcon: {
    marginRight: 8,
  },
  closureRequestedText: {
    color: "#0FA37F",
    fontSize: 16,
    fontWeight: "bold",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    margin: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  accordionTitle: { fontSize: 16, fontWeight: "bold" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
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
  cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
  label: { color: "#666", fontSize: 14 },
  value: { fontSize: 14, fontWeight: "500" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 12, color: "#fff" },
  badgeHigh: { backgroundColor: "red" },
  badgeMedium: { backgroundColor: "orange" },
  badgeLow: { backgroundColor: "green" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    overflow: 'hidden',
  },
  statusOpen: {
    backgroundColor: '#d4edda',
    color: '#155724',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  statusInProgress: {
    backgroundColor: '#cce7ff',
    color: '#004085',
    borderWidth: 1,
    borderColor: '#b3d7ff',
  },
  statusClosed: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  closureRequestedBadge: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  // Attachments Section Styles
  attachmentsContainer: {
    marginTop: 10,
  },
  attachmentsCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
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
  noCommentsText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginVertical: 10,
  },

  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 3,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dateLabel: {
    marginRight: 10,
    fontSize: 14,
    color: '#666',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    flex: 1,
  },
  uploadSection: {
    marginVertical: 10,
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0FA37F",
    borderRadius: 8,
    padding: 12,
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
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: "#0FA37F",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    justifyContent: 'center',
    minHeight: 44,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", textAlign: "center" },
  retryButton: { marginTop: 10, padding: 10, backgroundColor: "#0FA37F", borderRadius: 5 },
  retryText: { color: "#fff" },
  descriptionContainer: {
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginTop: 5,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
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
  },
});

export default AcceptAssetDetails;