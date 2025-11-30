// SePartsDetails.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Header } from './Header';

const SePartsDetailsTwo = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { maintenanceId, parts: initialParts } = route.params as any;

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'installed' | 'removed'>('all');

  // console.log(":::::::::::::::::::::::::::::mid", maintenanceId)

  // In a real app, you might fetch parts based on maintenanceId
  const parts = initialParts || [];

  const filteredParts = useMemo(() => {
    let filtered = parts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((part: any) =>
        part.part_no?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (filter === 'installed') {
      filtered = filtered.filter((part: any) => part.installation === true);
    } else if (filter === 'removed') {
      filtered = filtered.filter((part: any) => part.installation === false);
    }

    // Group by part_no and installation status, and sum quantities
    const groupedParts = filtered.reduce((acc: any[], part: any) => {
      const existingPart = acc.find(
        (p: any) =>
          p.part_no === part.part_no &&
          p.installation === part.installation
      );

      if (existingPart) {
        // If part already exists, add the quantity
        existingPart.quantity = (parseInt(existingPart.quantity) || 0) + (parseInt(part.quantity) || 0);
        // You might want to handle price aggregation as well
        // existingPart.price = (parseFloat(existingPart.price) || 0) + (parseFloat(part.price) || 0);
      } else {
        // If part doesn't exist, add it to the array
        acc.push({
          ...part,
          id: `${part.part_no}-${part.installation}`, // Create unique ID for FlatList
          quantity: parseInt(part.quantity) || 0
        });
      }

      return acc;
    }, []);

    return groupedParts;
  }, [parts, searchQuery, filter]);

  const getStatusInfo = (installation: boolean) => {
    return {
      text: installation ? 'Installed' : 'Removed',
      color: installation ? '#0FA37F' : '#e53935',
      bgColor: installation ? '#d4edda' : '#f8d7da',
      icon: installation ? 'check-circle' : 'close-circle',
    };
  };

  const calculateTotal = (type: 'all' | 'installed' | 'removed') => {
    let filtered = parts;
    if (type === 'installed') {
      filtered = parts.filter((part: any) => part.installation === true);
    } else if (type === 'removed') {
      filtered = parts.filter((part: any) => part.installation === false);
    }

    return filtered.reduce((total: number, part: any) => {
      const price = parseFloat(part.price) || 0;
      const quantity = parseInt(part.quantity) || 0;
      return total + price * quantity;
    }, 0);
  };

  const renderPartItem = ({ item }: { item: any }) => {
    const statusInfo = getStatusInfo(item.installation);
    const totalPrice =
      (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);

    return (
      <View style={styles.partCard}>
        <View style={styles.partHeader}>
          <View style={styles.partInfo}>
            <Text style={styles.partNo}>{item.part_no || 'N/A'}</Text>
            {/* <Text style={styles.partName}>{item.name || 'No Name'}</Text> */}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.bgColor },
            ]}
          >
            <Icon
              name={statusInfo.icon}
              size={16}
              color={statusInfo.color}
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.partDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity || '0'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Header />
      </View>

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon
            name="magnify"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by part number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All Parts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'installed' && styles.filterTabActive,
            ]}
            onPress={() => setFilter('installed')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'installed' && styles.filterTabTextActive,
              ]}
            >
              Installed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'removed' && styles.filterTabActive,
            ]}
            onPress={() => setFilter('removed')}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'removed' && styles.filterTabTextActive,
              ]}
            >
              Removed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{filteredParts.length}</Text>
            <Text style={styles.summaryLabel}>Total Parts</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {filteredParts.filter((p: any) => p.installation === true).length}
            </Text>
            <Text style={styles.summaryLabel}>Installed</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {filteredParts.filter((p: any) => p.installation === false).length}
            </Text>
            <Text style={styles.summaryLabel}>Removed</Text>
          </View>
        </View>

        {/* Price Summary */}
        {/* <View style={styles.priceSummary}>
          <Text style={styles.priceSummaryTitle}>Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Value:</Text>
            <Text style={styles.priceValue}>
              ₹{calculateTotal('all').toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Installed Parts:</Text>
            <Text style={styles.priceValue}>
              ₹{calculateTotal('installed').toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Removed Parts:</Text>
            <Text style={styles.priceValue}>
              ₹{calculateTotal('removed').toFixed(2)}
            </Text>
          </View>
        </View> */}

        {/* Parts List */}
        <View style={styles.partsListContainer}>
          <Text style={styles.sectionTitle}>
            Parts ({filteredParts.length})
          </Text>

          {filteredParts.length > 0 ? (
            <FlatList
              data={filteredParts}
              renderItem={renderPartItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="package-variant" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {searchQuery
                  ? 'No parts found matching your search'
                  : 'No parts available'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#0FA37F',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  priceSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  priceSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  partsListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  partCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partInfo: {
    flex: 1,
  },
  partNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  partName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  partDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0FA37F',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default SePartsDetailsTwo;
