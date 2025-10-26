import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ReportBreakdownModal from '../Modal/ReportBreakdownModal';
import { useAttendance } from '../hooks/useAttendance';
import { useAssets } from '../hooks/useAssets';

const Home = () => {
  const { login, logout, isLoggedIn } = useAttendance();
  const { fetchAssets, assetNoList, nextAssetNoList, loading: assetsLoading } = useAssets();

  const [loadingType, setLoadingType] = useState<null | 'login' | 'logout'>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAssetCode, setSelectedAssetCode] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  useEffect(() => {
    fetchAssets();
  }, []);

  const handleLogin = async () => {
    setLoadingType('login');
    await login();
    setLoadingType(null);
  };

  const handleLogout = async () => {
    setLoadingType('logout');
    await logout();
    setLoadingType(null);
  };

  const handleOpenModal = (assetCode: string, assetId?: string) => {
    setSelectedAssetCode(assetCode);
    setSelectedAssetId(assetId || null);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: 35 }}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Asset Tracker</Text>

        <View style={styles.notificationIcon}>
          <Icon name="notifications-none" size={26} color="#000" />
        </View>

        {/* Login / Logout */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.loginBtn,
              { backgroundColor: isLoggedIn ? '#b6d1f5ff' : '#1271EE' },
            ]}
            onPress={handleLogin}
            disabled={isLoggedIn || loadingType !== null}
          >
            {loadingType === 'login' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.loginText}>Log In</Text>
                <View style={styles.loginIconWrapper}>
                  <FeatherIcon name="user-check" size={18} color="#007BFF" />
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.logoutBtn,
              { backgroundColor: isLoggedIn ? '#1271EE' : '#b6d1f5ff' },
            ]}
            onPress={handleLogout}
            disabled={!isLoggedIn || loadingType !== null}
          >
            {loadingType === 'logout' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.logoutText}>Log Out</Text>
                <View style={styles.logoutIconWrapper}>
                  <Icon name="logout" size={18} color="#007BFF" />
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Last Login Info */}
        <Text style={styles.lastLogin}>
          Last:{' '}
          {new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
          })}
          , {new Date().toDateString()}
        </Text>

        {/* Asset Assigned */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Asset Assigned</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        {assetsLoading ? (
          <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
        ) : assetNoList.length > 0 ? (
          assetNoList.map((asset) => (
            <TouchableOpacity
              key={asset.asset_id}
              style={styles.card}
              onPress={() => handleOpenModal(asset.asset_no, asset.asset_id)}
            >
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor:
                      asset.report_maintenance_is_closed === null
                        ? '#06B000'
                        : '#007bff',
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {asset.report_maintenance_is_closed === null ? 'Running' : 'Closed'}
                </Text>
              </View>
              <FontAwesome
                name="gears"
                size={24}
                color="#000"
                style={styles.cardIcon}
              />
              <View style={{ gap: 4 }}>
                <Text style={styles.cardText}>ID: {asset.asset_no}</Text>
                <View style={styles.cardSubRow}>
                  <FeatherIcon name="map-pin" size={12} color="#000" />
                  <Text style={styles.cardSubText}>Location N/A</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyMessage}>No assigned assets</Text>
        )}

        {/* Next Assignment */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next Assignment</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        {!assetsLoading && nextAssetNoList.length > 0 ? (
          nextAssetNoList.map((asset) => (
            <TouchableOpacity
              key={asset.asset_id}
              style={styles.card}
              onPress={() => handleOpenModal(asset.asset_no, asset.asset_id)}
            >
              <FontAwesome
                name="gears"
                size={24}
                color="#000"
                style={styles.cardIcon}
              />
              <View style={{ gap: 4 }}>
                <Text style={styles.cardText}>ID: {asset.asset_no}</Text>
                <View style={styles.cardSubRow}>
                  <FeatherIcon name="map-pin" size={12} color="#000" />
                  <Text style={styles.cardSubText}>Location N/A</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          !assetsLoading && <Text style={styles.emptyMessage}>No next assignments</Text>
        )}

        {/* Breakdown Modal */}
        <ReportBreakdownModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          assetId={selectedAssetId || ''}
          assetCode={selectedAssetCode || ''}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  notificationIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: '#1271EE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  loginText: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    fontSize: 16,
  },
  loginIconWrapper: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#b6d1f5ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    fontSize: 16,
  },
  logoutIconWrapper: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 4,
  },
  lastLogin: {
    color: 'red',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sectionHeader: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  viewAll: {
    color: '#007bff',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 88,
    marginTop: 12,
    shadowColor: '#000',
    elevation: 2,
    gap: 4,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardText: {
    fontWeight: '600',
    fontSize: 15,
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubText: {
    color: '#6c757d',
    fontSize: 13,
    marginLeft: 6,
  },
  statusTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    marginLeft: 'auto',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 14,
  },
  emptyMessage: {
    marginTop: 20,
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
  },
});
