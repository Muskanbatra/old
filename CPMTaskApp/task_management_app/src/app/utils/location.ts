import Geolocation from 'react-native-geolocation-service';

import { PermissionsAndroid, Platform } from 'react-native';

function formatLocationError(error: any) {
  if (error?.message) {
    return error.message;
  }

  if (error?.code === 2) {
    return 'Location provider is unavailable. Please turn on device GPS and try again.';
  }

  if (error?.code === 3) {
    return 'Location request timed out. Please try again near an open area.';
  }

  return 'Unable to get current location. Please turn on GPS and allow location permission.';
}

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
    throw new Error('Location permission not granted.');
  }

  return new Promise<any>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,

          longitude: position.coords.longitude,
        });
      },

      error => reject(new Error(formatLocationError(error))),

      {
        enableHighAccuracy: true,

        timeout: 15000,

        forceRequestLocation: true,

        showLocationDialog: true,
      },
    );
  });
}
