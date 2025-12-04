import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { maintenanceApi } from "../../../api/maintenanceApi";
import DateTimePicker from "@react-native-community/datetimepicker";

interface EngineerSectionProps {
  showWalletPopup: boolean;
  setShowWalletPopup: (show: boolean) => void;
  navigation: any;
  showPartOptions: () => void;
  showPriorityOptions: () => void;
  setShowDatePicker: (show: boolean) => void;
  selectedPart: string;
  selectedPriority: string;
  setSelectedPriority: (priority: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  formatDate: (date: Date) => string;
  comment: string;
  setComment: (comment: string) => void;
  selectedImage: any;
  setSelectedImage: (image: any) => void;
  handleUpdate: () => void;
  maintenanceId: string;
  maintenanceData: any;
  status: string;
}

const EngineerSection = ({
  selectedPriority,
  setSelectedPriority,
  selectedDate: propSelectedDate,
  setSelectedDate,
  formatDate,
  comment,
  setComment,
  selectedImage,
  setSelectedImage,
  handleUpdate,
  maintenanceId,
  maintenanceData,
  status,
}: EngineerSectionProps) => {
  const [servicePersons, setServicePersons] = useState<any[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState<string>("");
  const [selectedEngineerId, setSelectedEngineerId] = useState<number | null>(
    null
  );
  const [showEngineerModal, setShowEngineerModal] = useState<boolean>(false);
  const [showServiceCategoryModal, setShowServiceCategoryModal] =
    useState<boolean>(false);
  const [showBreakdownTypeModal, setShowBreakdownTypeModal] =
    useState<boolean>(false);
  const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [breakdownTitle, setBreakdownTitle] = useState<string>("");
  const [serviceCategory, setServiceCategory] = useState<string>("");
  const [breakdownType, setBreakdownType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState<boolean>(false);
  // Local state for selected date
  const [localSelectedDate, setLocalSelectedDate] = useState<Date>(new Date());

  // Update localSelectedDate when propSelectedDate changes
  useEffect(() => {
    if (propSelectedDate) {
      setLocalSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  useEffect(() => {
    fetchServicePersons();
  }, []);

  const fetchServicePersons = async () => {
    try {
      const response = await maintenanceApi.getServicePersons();
      setServicePersons(response.data || response);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch service persons");
      console.error("Fetch service persons error:", error);
    }
  };

  const filteredEngineers = servicePersons.filter(
    (person) =>
      person.name &&
      person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEngineer = (person: any) => {
    setSelectedEngineer(person.name);
    setSelectedEngineerId(person.id);
    setShowEngineerModal(false);
    setSearchQuery("");
  };

  const handleDeadlinePress = () => {
    setShowDateTimePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDateTimePicker(false);
    if (selectedDate) {
      // Update both local and parent state
      setLocalSelectedDate(selectedDate);
      setSelectedDate(selectedDate);
    }
  };

  const assignEngineer = async () => {
    if (!selectedEngineerId) {
      return;
    }

    try {
      const payload = {
        maintenance_id: maintenanceId,
        service_person: [{ id: selectedEngineerId }],
      };

      const response = await maintenanceApi.assignServicePerson(payload);

      if (response.msg === "successful") {
        console.log("Engineer assigned successfully");
      } else {
        Alert.alert("Error", response.msg || "Failed to assign engineer");
        throw new Error(response.msg || "Failed to assign engineer");
      }
    } catch (error) {
      console.error("Assign engineer error:", error);
      throw error;
    }
  };

  const addComment = async () => {
    if (!comment.trim()) {
      return;
    }

    try {
      const payload = {
        maintenance_id: maintenanceId,
        comment: comment.trim(),
      };

      const response = await maintenanceApi.addComment(payload);

      if (response && response.msg) {
        console.log("Comment added successfully");
        setComment("");
      } else {
        Alert.alert("Error", response.msg || "Failed to add comment");
        throw new Error(response.msg || "Failed to add comment");
      }
    } catch (error) {
      console.error("Add comment error:", error);
      throw error;
    }
  };

  const uploadPhoto = async () => {
    if (!selectedImage) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("maintenance_id", maintenanceId);
      formData.append("types", "maintenance");
      formData.append("photo", {
        uri: selectedImage.uri,
        type: selectedImage.type || "image/jpeg",
        name: selectedImage.fileName || "photo.jpg",
      });

      const response = await maintenanceApi.uploadMaintenancePhoto(formData);

      if (response && (response.mgs || response.msg)) {
        console.log("Photo uploaded successfully:", response.mgs || response.msg);
        Alert.alert("Success", response.mgs || response.msg);
        setSelectedImage(null);
      } else {
        Alert.alert("Error", response?.msg || "Failed to upload photo");
        throw new Error(response?.msg || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Upload photo error:", error);
      throw error;
    }
  };

  const updateMaintenance = async () => {
    try {
      const payload = {
        id: maintenanceId,
        complaint: breakdownTitle,
        complaint_type: breakdownType,
        description: description,
        types: serviceCategory,
        priority: selectedPriority,
        status: status,
        ready_date: localSelectedDate ? formatDate(localSelectedDate) : null, // Use localSelectedDate
      };

      const response = await maintenanceApi.updateMaintenance(payload);

      if (response && response.id) {
        console.log("Maintenance updated successfully");
        Alert.alert("Success", "Maintenance updated successfully");
        setBreakdownTitle("");
        setServiceCategory("");
        setBreakdownType("");
        setDescription("");
        setSelectedEngineer("");
        setSelectedEngineerId(null);
        setComment("");
        setSelectedImage(null);
      } else {
        Alert.alert("Error", response?.msg || "Failed to update maintenance");
        throw new Error(response?.msg || "Failed to update maintenance");
      }
    } catch (error) {
      console.error("Update maintenance error:", error);
      throw error;
    }
  };

  const handleUpdateWithAPICalls = async () => {
    setLoading(true);
    try {
      await assignEngineer();
      await updateMaintenance();
      await addComment();
      await uploadPhoto();

      Alert.alert("Success", "Maintenance updated successfully");

      if (handleUpdate) {
        handleUpdate();
      }
    } catch (error) {
      console.error("Update maintenance error:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs access to your camera to take photos",
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
    return true;
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS === "android") {
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
        mediaType: "photo",
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
      Alert.alert(
        "Permission denied",
        "Storage/Photos access is required to select images"
      );
      return;
    }

    launchImageLibrary(
      {
        mediaType: "photo",
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

  const renderEngineerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.engineerItem}
      onPress={() => handleSelectEngineer(item)}
    >
      <Text style={styles.engineerItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const serviceCategoryOptions = [
    { label: "Warranty", value: "warranty" },
    { label: "Safety Notice", value: "safety_notice" },
    { label: "Non-Warranty", value: "non_warranty" },
    { label: "Preventive Maintenance", value: "preventive_maintenance" },
  ];

  const breakdownTypeOptions = [
    { label: "Major", value: "major" },
    { label: "Minor", value: "minor" },
    { label: "Others", value: "others" },
  ];

  const priorityOptions = [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
    { label: "Critical", value: "critical" },
  ];

  const SelectionModal = ({
    visible,
    onClose,
    title,
    options,
    onSelect,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: { label: string; value: string }[];
    onSelect: (value: string) => void;
  }) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.section}>
      <Modal
        visible={showEngineerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEngineerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Engineer</Text>
              <TouchableOpacity
                onPress={() => setShowEngineerModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Icon
                name="magnify"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search engineers..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>

            <FlatList
              data={filteredEngineers}
              renderItem={renderEngineerItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.engineerList}
              ListEmptyComponent={
                <Text style={styles.noResultsText}>
                  {searchQuery ? "No engineers found" : "No engineers available"}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      <SelectionModal
        visible={showServiceCategoryModal}
        onClose={() => setShowServiceCategoryModal(false)}
        title="Select Service Category"
        options={serviceCategoryOptions}
        onSelect={(value) => setServiceCategory(value)}
      />

      <SelectionModal
        visible={showBreakdownTypeModal}
        onClose={() => setShowBreakdownTypeModal(false)}
        title="Select Breakdown Type"
        options={breakdownTypeOptions}
        onSelect={(value) => setBreakdownType(value)}
      />

      <SelectionModal
        visible={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        title="Select Priority"
        options={priorityOptions}
        onSelect={(value) => {
          setSelectedPriority(value);
          setShowPriorityModal(false);
        }}
      />

      {showDateTimePicker && (
        <DateTimePicker
          value={localSelectedDate || new Date()} // Use localSelectedDate
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <View style={styles.formRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>SELECT ENGINEER</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowEngineerModal(true)}
          >
            <Text
              style={
                selectedEngineer
                  ? styles.selectTextSelected
                  : styles.selectText
              }
            >
              {selectedEngineer || "Select engineer"}
            </Text>
            <Icon name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>BREAKDOWN TITLE</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter breakdown title"
            placeholderTextColor="#999"
            value={breakdownTitle}
            onChangeText={setBreakdownTitle}
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>SERVICE CATEGORY</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowServiceCategoryModal(true)}
          >
            <Text
              style={
                serviceCategory
                  ? styles.selectTextSelected
                  : styles.selectText
              }
            >
              {serviceCategoryOptions.find((opt) => opt.value === serviceCategory)
                ?.label || "Select category"}
            </Text>
            <Icon name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>BREAKDOWN TYPE</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowBreakdownTypeModal(true)}
          >
            <Text
              style={
                breakdownType
                  ? styles.selectTextSelected
                  : styles.selectText
              }
            >
              {breakdownTypeOptions.find((opt) => opt.value === breakdownType)
                ?.label || "Select type"}
            </Text>
            <Icon name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>PRIORITY</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowPriorityModal(true)}
          >
            <Text
              style={
                selectedPriority
                  ? styles.selectTextSelected
                  : styles.selectText
              }
            >
              {selectedPriority || "Select priority"}
            </Text>
            <Icon name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>DEADLINE</Text>
          <TouchableOpacity style={styles.selectInput} onPress={handleDeadlinePress}>
            <Text
              style={
                localSelectedDate ? styles.selectTextSelected : styles.selectText // Use localSelectedDate
              }
            >
              {localSelectedDate ? formatDate(localSelectedDate) : "Select date"} {/* Use localSelectedDate */}
            </Text>
            <Icon name="calendar" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.commentContainer}>
        <Text style={styles.inputLabel}>DESCRIPTION</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Add description here..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.commentContainer}>
        <Text style={styles.inputLabel}>COMMENT</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Add your comment here..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />
      </View>

      <View style={styles.imageContainer}>
        {selectedImage ? (
          <View style={styles.selectedImageContainer}>
            <Text style={styles.inputLabel}>SELECTED IMAGE</Text>
            <View style={styles.imagePreview}>
              <Text style={styles.imageName} numberOfLines={1}>
                {selectedImage.fileName || "Selected image"}
              </Text>
              <TouchableOpacity onPress={removeImage}>
                <Icon name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={showImagePickerOptions}
          >
            <Icon name="plus" size={20} color="#00BFA5" />
            <Text style={styles.addImageText}>Add Image</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.updateButton, loading && styles.updateButtonDisabled]}
        onPress={handleUpdateWithAPICalls}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.updateButtonText}>Update</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  selectText: {
    color: "#999",
    fontSize: 14,
  },
  selectTextSelected: {
    color: "#333",
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    textAlignVertical: "top",
    minHeight: 100,
  },
  imageContainer: {
    marginBottom: 16,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#00BFA5",
    borderStyle: "dashed",
    borderRadius: 4,
    padding: 16,
  },
  addImageText: {
    color: "#00BFA5",
    fontSize: 14,
    marginLeft: 8,
  },
  selectedImageContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
  },
  imagePreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  imageName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  updateButton: {
    backgroundColor: "#00BFA5",
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  updateButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  engineerList: {
    maxHeight: 300,
  },
  engineerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  engineerItemText: {
    fontSize: 14,
    color: "#333",
  },
  noResultsText: {
    textAlign: "center",
    padding: 16,
    color: "#999",
    fontSize: 14,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
});

export default EngineerSection;