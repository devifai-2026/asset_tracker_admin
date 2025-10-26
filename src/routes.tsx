// Routes.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './Screens/SplashScreen';
import Login from './Screens/Login';
import { useSelector } from 'react-redux';
import { RootState } from './Redux/store';
import MainTabs from './Components/MainTabs';
import OtpVerificationScreen from './Screens/OtpVerfication';
import OpenAssetsDetails from './Screens/OpenAssetsDetails';
import AcceptAssetDetails from './Screens/AcceptAssetDetails';
import { Profile } from './Screens/Profile';
import HeadMainTabs from './Components/HeadMainTabs';
import { CreateMaintenance } from './Screens/ServiceHead/CreateMaintenance';
import OpenDetails from './Screens/ServiceHead/OpenDetails';
import PartsDetails from './Screens/ServiceHead/PartsDetails';
import ChangePassword from './Screens/ChangePassword';
import AdminMainTabs from './Components/AdminMainTabs';
import SePartsDetails from './Screens/SePartsDetails';
import ClosedAssetDetails from './Screens/ClosedAssetDetails';
import RequestPartsScreen from './Screens/RequestPartsScreen';
import RemovePartsScreen from './Screens/RemovePartsScreen';
import MaintenanceRatingScreen from './Screens/MaintenanceRatingScreen';
import AssetDetailsScreen from './Screens/ServiceHead/Details/AssetDetailsScreen';
import AddPartsScreen from './Screens/ServiceHead/AddPartsScreen';
import WalletScreen from './Screens/ServiceHead/WalletScreen';
import ForgotPassword from './Screens/ForgotPassword';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
  </Stack.Navigator>
);

// Alternative: Common screens কে manually প্রতিটি navigator এ add করুন

const AppNavigator = () => {
  const { isPasswordChanged, permissions, currentRole } = useSelector((state: RootState) => state.auth);

  console.log("Current Role in Routes:", currentRole);
  console.log("Permissions in Routes:", permissions);

  // If password not changed, show ChangePassword screen
  if (!isPasswordChanged) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="OpenAssetsDetails" component={OpenAssetsDetails} />
        <Stack.Screen name="WalletScreen" component={WalletScreen} />
        <Stack.Screen name="AcceptAssetDetails" component={AcceptAssetDetails} />
        <Stack.Screen name="ClosedAssetDetails" component={ClosedAssetDetails} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="CreateMaintenance" component={CreateMaintenance} />
        <Stack.Screen name="OpenDetails" component={OpenDetails} />
        <Stack.Screen name="PartsDetails" component={PartsDetails} />
        <Stack.Screen name="SePartsDetails" component={SePartsDetails} />
        <Stack.Screen name="AssetDetailsScreen" component={AssetDetailsScreen} />
        <Stack.Screen
          name="RequestParts"
          component={RequestPartsScreen}
          options={{ title: 'Request Parts' }}
        />
        <Stack.Screen
          name="RemoveParts"
          component={RemovePartsScreen}
          options={{ title: 'Remove Parts' }}
        />
        <Stack.Screen
          name="MaintenanceRating"
          component={MaintenanceRatingScreen}
          options={{ title: "Rate Maintenance" }}
        />
        <Stack.Screen
          name="AddParts"
          component={AddPartsScreen}
          options={{ title: 'Add Parts' }}
        />
      </Stack.Navigator>
    );
  }

  // Determine which main tabs to show based on currentRole
  const getMainTabsComponent = () => {
    if (currentRole === 'Service Engineer') {
      return MainTabs;
    } else if (currentRole === 'Service Head' || currentRole === 'Admin') {
      return HeadMainTabs;
    }

    if (permissions.includes('SERVICE.ALL')) {
      return MainTabs;
    } else if (permissions.includes('MAINT.ALL') || permissions.includes('ASSETS.VIEW') || permissions.includes('ADMIN.ALL')) {
      return HeadMainTabs;
    }

    return MainTabs;
  };

  const MainTabsComponent = getMainTabsComponent();
  const mainScreenName = currentRole === 'Service Engineer' ? "MainTabs" : "HeadMainTabs";

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={mainScreenName} component={MainTabsComponent} />

      {/* Common screens manually add করুন */}
      <Stack.Screen name="OpenAssetsDetails" component={OpenAssetsDetails} />
      <Stack.Screen name="WalletScreen" component={WalletScreen} />
      <Stack.Screen name="AcceptAssetDetails" component={AcceptAssetDetails} />
      <Stack.Screen name="ClosedAssetDetails" component={ClosedAssetDetails} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="CreateMaintenance" component={CreateMaintenance} />
      <Stack.Screen name="OpenDetails" component={OpenDetails} />
      <Stack.Screen name="PartsDetails" component={PartsDetails} />
      <Stack.Screen name="SePartsDetails" component={SePartsDetails} />
      <Stack.Screen name="AssetDetailsScreen" component={AssetDetailsScreen} />
      <Stack.Screen
        name="RequestParts"
        component={RequestPartsScreen}
        options={{ title: 'Request Parts' }}
      />
      <Stack.Screen
        name="RemoveParts"
        component={RemovePartsScreen}
        options={{ title: 'Remove Parts' }}
      />
      <Stack.Screen
        name="MaintenanceRating"
        component={MaintenanceRatingScreen}
        options={{ title: "Rate Maintenance" }}
      />
      <Stack.Screen
        name="AddParts"
        component={AddPartsScreen}
        options={{ title: 'Add Parts' }}
      />
    </Stack.Navigator>
  );
};

const Routes = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default Routes;