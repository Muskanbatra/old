import Geolocation from 'react-native-geolocation-service';

import { PermissionsAndroid, Platform } from 'react-native';

async function requestPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  return true;
}

export async function getCurrentLocation() {
  const allowed = await requestPermission();

  if (!allowed) {
    throw new Error('Location permission not granted');
  }

  return new Promise<any>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,

          longitude: position.coords.longitude,
        });
      },

      error => reject(error),

      {
        enableHighAccuracy: true,

        timeout: 15000,

        forceRequestLocation: true,

        showLocationDialog: true,
      },
    );
  });
}
