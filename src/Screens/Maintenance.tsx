import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMaintenanceList,
  selectMaintenanceList,
  selectMaintenanceLoading,
  selectMaintenanceError,
} from "../Redux/Slices/maintenanceSlice";
import { RootState } from "../Redux/store";
import { logout } from "../Redux/Slices/authSlice";
import { Header } from "./Header";

export const Maintenance = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");

  // Get data from Redux store
  const maintenanceList = useSelector(selectMaintenanceList);
  const loading = useSelector(selectMaintenanceLoading);
  const error = useSelector(selectMaintenanceError);

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = () => {
    dispatch(fetchMaintenanceList() as any);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigation.navigate('Login');
  };

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

  // Map API status to UI status labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "Open";
      case "in_progress": return "In Progress";
      case "closed": return "Closed";
      default: return status;
    }
  };

  // Get tab active color based on tab key
  const getTabActiveColor = (tabKey: string) => {
    switch (tabKey) {
      case "open": return "#0FA37F";
      case "in_progress": return "#1271EE";
      case "closed": return "#ff0202";
      default: return "#0FA37F";
    }
  };

  // Filter tickets based on selected tab and search query
  const filteredTickets = maintenanceList.filter((ticket) => {
    const matchesTab = ticket.status === selectedTab;
    const matchesSearch = searchQuery === "" ||
      ticket.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.title && ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ticket.asset_no.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Count tickets for each status
  const getTicketCount = (status: string) => {
    return maintenanceList.filter(ticket => ticket.status === status).length;
  };

  const truncateText = (text: string, limit: number) => {
    if (!text) return "No Title";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  const renderTicket = ({ item }: any) => {
    const showEngineer = selectedTab === "in_progress";
    const statusLabel = getStatusLabel(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (selectedTab === "open") {
            navigation.navigate("OpenAssetsDetails", { ticket: item });
          } else if (selectedTab === "in_progress") {
            navigation.navigate("AcceptAssetDetails", { ticket: item });
          } else if (selectedTab === "closed") {
            navigation.navigate("ClosedAssetDetails", { ticket: item });
          }
        }}
      >
        {/* Header */}
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.label}>Ticket ID</Text>
            <Text style={styles.ticketId}>{item.ticket_no}</Text>
          </View>
          <View style={styles.row}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>Complain Date</Text>
              <Text style={styles.complainDate}>{formatDate(item.compaint_date)}</Text>
            </View>
          </View>
        </View>

        {/* Breakdown Info */}
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.label}>Breakdown Title</Text>
            <Text style={styles.breakdownTitle}>
              {truncateText(item.title, 20)}
            </Text>
          </View>

          <View>
            <Text style={styles.label}>Asset No</Text>
            <Text style={styles.breakdownSince}>{item.asset_no}</Text>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.label}>Service Type</Text>
            <Text style={styles.serviceCategory}>
              {item.types === "warranty" ? "Warranty" :
                item.types === "non_warranty" ? "Non-Warranty" :
                  item.types === "safety_notice" ? "Safety Notice" :
                    item.types}
            </Text>
          </View>
          <View style={styles.priorityContainer}>
            <Text style={styles.label}>Priority</Text>
            <Text style={[styles.priority, getPriorityStyle(item.priority)]}>
              {item.priority || "Not Set"}
            </Text>
          </View>
        </View>

        
      </TouchableOpacity>
    );
  };

  if (loading && maintenanceList.length === 0) {
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
          <View style={styles.errorButtonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={loadMaintenanceData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      <View style={styles.container}>
        {/* Header */}
        <Header />

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search by ticket, title, or asset"
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Icon name="magnify" size={22} color="#000" />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: "open", label: "Open" },
            { key: "in_progress", label: "In Progress" },
            { key: "closed", label: "Closed" }
          ].map((tab) => {
            const isActive = selectedTab === tab.key;
            const activeColor = getTabActiveColor(tab.key);
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && { 
                    borderBottomColor: activeColor,
                    borderBottomWidth: 2,
                    paddingBottom: 4
                  }
                ]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && { color: activeColor, fontWeight: "600" }
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.counter,
                    tab.key === "open" && styles.counterGreen,
                    tab.key === "in_progress" && styles.counterBlue,
                    tab.key === "closed" && styles.counterRed
                  ]}
                >
                  <Text style={styles.counterText}>
                    {getTicketCount(tab.key)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tickets List */}
        <FlatList
          data={filteredTickets}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadMaintenanceData}
              colors={["#0FA37F"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? "No matching tickets found" : "No tickets found"}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

// Priority Colors
const getPriorityStyle = (priority: string | null) => {
  switch (priority) {
    case "high":
      return { backgroundColor: "#ff0202", fontWeight: "700" as const };
    case "medium":
      return { backgroundColor: "#0FA37F", fontWeight: "700" as const };
    case "low":
      return { backgroundColor: "#1271EE", fontWeight: "700" as const };
    default:
      return { backgroundColor: "#aaa" };
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: 16 
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
    alignItems: "center",
    marginBottom: 12,
  },
  logo: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#000",
    fontFamily: 'Inter-Bold',
  },
  profilePic: { width: 36, height: 36, borderRadius: 18 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    paddingVertical: 6,
    fontFamily: 'Inter-Regular',
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tab: { 
    flexDirection: "row", 
    alignItems: "center",
    paddingBottom: 4,
  },
  tabText: { 
    fontSize: 14, 
    color: "#000",
    fontFamily: 'Inter-Regular',
  },
  counter: {
    marginLeft: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  counterGreen: {
    backgroundColor: "#0FA37F",
  },
  counterBlue: {
    backgroundColor: "#1271EE",
  },
  counterRed: {
    backgroundColor: "#ff0202",
  },
  counterText: { 
    color: "#fff", 
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  ticketId: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#000",
    fontFamily: 'Inter-SemiBold',
  },
  complainDate: { 
    fontSize: 14, 
    color: "#000", 
    textAlign: "right", 
    fontWeight: "500",
    fontFamily: 'Inter-Medium',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    fontFamily: 'Inter-Medium',
  },
  breakdownSince: { 
    fontSize: 14, 
    color: "#333", 
    fontWeight: "500", 
    textAlign: "right",
    fontFamily: 'Inter-Medium',
  },
  serviceCategory: { 
    fontSize: 14, 
    color: "#333", 
    fontWeight: "500",
    fontFamily: 'Inter-Medium',
  },
  priorityContainer: {
    alignItems: 'flex-end',
  },
  priority: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
    textTransform: "capitalize",
    color: "#fff",
    fontWeight: "700" as const,
    fontFamily: 'Inter-Bold',
  },
  status: {
    color: "#1271EE",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: 'Inter-Medium',
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
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutButton: {
    backgroundColor: "#ff0202",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: 'Inter-SemiBold',
  },
});