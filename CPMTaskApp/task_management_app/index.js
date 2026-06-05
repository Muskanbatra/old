/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

try {
  const { getApp } = require('@react-native-firebase/app');
  const firebaseMessaging = require('@react-native-firebase/messaging');
  const messaging = firebaseMessaging.getMessaging(getApp());

  firebaseMessaging.setBackgroundMessageHandler(messaging, async () => {
    // Keep the JS runtime available for background FCM delivery work.
  });
} catch {
  // Allow the app to boot before the native Firebase build is installed.
}

AppRegistry.registerComponent(appName, () => App);
