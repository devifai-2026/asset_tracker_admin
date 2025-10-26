import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

export type Coordinates = { lat: number; lng: number };

const DUMMY_COORDINATES: Coordinates = {
  lat: 22.5738994,
  lng: 88.3065939,
};

export const getLocationManually = async (useDummy: boolean = true): Promise<Coordinates | null> => {
  try {
    if (!useDummy) {
      console.log('Using dummy location');
      // Alert.alert('Dummy Location', `Lat: ${DUMMY_COORDINATES.lat}\nLng: ${DUMMY_COORDINATES.lng}`);
      return DUMMY_COORDINATES;
    }
    
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location for attendance tracking.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return null;
      }
    }

    await promptForEnableLocationIfNeeded({ interval: 10000 });

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };
          // Alert.alert('Location Captured', `Lat: ${latitude}\nLng: ${longitude}`);
          resolve(coords);
        },
        error => {
          console.error('Geolocation error:', error);
          if (error.code === 2) {
  Alert.alert(
    'Location Services Disabled',
    'Please enable location services and try again.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'android') {
            Linking.openURL('android.settings.LOCATION_SOURCE_SETTINGS://');
          } else {
            Linking.openURL('app-settings:');
          }
        },
      },
    ]
  );
} else {
            Alert.alert('Location Error', `Code: ${error.code}\nMessage: ${error.message}`);
          }
          reject(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
        }
      );
    });
  } catch (error) {
    console.warn('GPS prompt failed:', error);
    Alert.alert('Enable Location Services', 'Please turn on your GPS manually.', [
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
      { text: 'Cancel', style: 'cancel' },
    ]);
    return null;
  }
};
