import { PermissionsAndroid, Platform } from 'react-native';
import type { AppNotification, Screen } from '../domain/model';

export type PushNotificationStatus = 'pending' | 'enabled' | 'blocked' | 'error';

type PushSetupHandlers = {
  onMessage: (notification: AppNotification) => void;
  onNotificationOpen: (notification: AppNotification) => void;
  onToken: (token: string) => void;
};

type PushSetupResult = {
  cleanup: () => void;
  initialNotification: AppNotification | null;
  status: PushNotificationStatus;
  token: string | null;
};

type RemoteMessage = {
  data?: Record<string, unknown>;
  messageId?: string | null;
  notification?: {
    title?: string | null;
    body?: string | null;
  } | null;
};

type MessagingModule = {
  AuthorizationStatus: {
    AUTHORIZED: number;
    PROVISIONAL: number;
  };
  messaging: object;
  isDeviceRegisteredForRemoteMessages: (messaging: object) => boolean;
  registerDeviceForRemoteMessages: (messaging: object) => Promise<void>;
  requestPermission: (messaging: object) => Promise<number>;
  getToken: (messaging: object) => Promise<string>;
  onMessage: (messaging: object, listener: (message: RemoteMessage) => void) => () => void;
  onNotificationOpenedApp: (
    messaging: object,
    listener: (message: RemoteMessage) => void,
  ) => () => void;
  onTokenRefresh: (messaging: object, listener: (token: string) => void) => () => void;
  getInitialNotification: (messaging: object) => Promise<RemoteMessage | null>;
};

const TASK_NOTIFICATION_TYPES = new Set<AppNotification['type']>([
  'task_assigned',
  'task_approved',
  'task_returned',
  'task_completed',
  'task_rejected',
]);

function readStringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getMessagingModule(): MessagingModule | null {
  try {
    const { getApp } = require('@react-native-firebase/app');
    const firebaseMessaging = require('@react-native-firebase/messaging');

    return {
      AuthorizationStatus: firebaseMessaging.AuthorizationStatus,
      messaging: firebaseMessaging.getMessaging(getApp()),
      isDeviceRegisteredForRemoteMessages:
        firebaseMessaging.isDeviceRegisteredForRemoteMessages,
      registerDeviceForRemoteMessages:
        firebaseMessaging.registerDeviceForRemoteMessages,
      requestPermission: firebaseMessaging.requestPermission,
      getToken: firebaseMessaging.getToken,
      onMessage: firebaseMessaging.onMessage,
      onNotificationOpenedApp: firebaseMessaging.onNotificationOpenedApp,
      onTokenRefresh: firebaseMessaging.onTokenRefresh,
      getInitialNotification: firebaseMessaging.getInitialNotification,
    };
  } catch {
    return null;
  }
}

function getNotificationType(remoteMessage: RemoteMessage): AppNotification['type'] {
  const incomingType = remoteMessage.data?.type;

  if (incomingType && TASK_NOTIFICATION_TYPES.has(incomingType as AppNotification['type'])) {
    return incomingType as AppNotification['type'];
  }

  return 'task_assigned';
}

function getTargetScreen(remoteMessage: RemoteMessage): Screen | undefined {
  const value = remoteMessage.data?.targetScreen;

  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return value as Screen;
}

export function mapRemoteMessageToAppNotification(
  remoteMessage: RemoteMessage,
): AppNotification {
  const title = readStringValue(
    remoteMessage.notification?.title ?? remoteMessage.data?.title,
    'New update',
  );
  const message = readStringValue(
    remoteMessage.notification?.body ??
      remoteMessage.data?.message ??
      remoteMessage.data?.body,
    'You have a new task update.',
  );
  const taskId = readStringValue(
    remoteMessage.data?.taskId ?? remoteMessage.messageId,
    'unknown-task',
  );

  return {
    id: remoteMessage.messageId ?? `${taskId}-${Date.now()}`,
    type: getNotificationType(remoteMessage),
    title,
    message,
    taskId,
    targetScreen: getTargetScreen(remoteMessage),
    recipientUserId: readStringValue(remoteMessage.data?.recipientUserId, ''),
    recipientBackendUserId: readStringValue(
      remoteMessage.data?.recipientBackendUserId,
      '',
    ),
    timestamp: 'Just now',
    read: false,
  };
}

async function requestAndroidNotificationPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function initializeFirebaseMessaging(
  handlers: PushSetupHandlers,
): Promise<PushSetupResult> {
  const messagingModule = getMessagingModule();

  if (!messagingModule) {
    return {
      cleanup: () => {},
      initialNotification: null,
      status: 'blocked',
      token: null,
    };
  }

  const hasAndroidPermission = await requestAndroidNotificationPermission();

  if (!hasAndroidPermission) {
    return {
      cleanup: () => {},
      initialNotification: null,
      status: 'blocked',
      token: null,
    };
  }

  if (!messagingModule.isDeviceRegisteredForRemoteMessages(messagingModule.messaging)) {
    await messagingModule.registerDeviceForRemoteMessages(messagingModule.messaging);
  }

  const authorizationStatus = await messagingModule.requestPermission(
    messagingModule.messaging,
  );
  const isAuthorized =
    authorizationStatus === messagingModule.AuthorizationStatus.AUTHORIZED ||
    authorizationStatus === messagingModule.AuthorizationStatus.PROVISIONAL;

  if (!isAuthorized) {
    return {
      cleanup: () => {},
      initialNotification: null,
      status: 'blocked',
      token: null,
    };
  }

  const token = await messagingModule.getToken(messagingModule.messaging);
  handlers.onToken(token);

  const unsubscribeOnMessage = messagingModule.onMessage(
    messagingModule.messaging,
    remoteMessage => {
      handlers.onMessage(mapRemoteMessageToAppNotification(remoteMessage));
    },
  );

  const unsubscribeOnOpen = messagingModule.onNotificationOpenedApp(
    messagingModule.messaging,
    remoteMessage => {
      handlers.onNotificationOpen(mapRemoteMessageToAppNotification(remoteMessage));
    },
  );

  const unsubscribeOnTokenRefresh = messagingModule.onTokenRefresh(
    messagingModule.messaging,
    handlers.onToken,
  );
  const initialMessage = await messagingModule.getInitialNotification(
    messagingModule.messaging,
  );

  return {
    cleanup: () => {
      unsubscribeOnMessage();
      unsubscribeOnOpen();
      unsubscribeOnTokenRefresh();
    },
    initialNotification: initialMessage
      ? mapRemoteMessageToAppNotification(initialMessage)
      : null,
    status: 'enabled',
    token,
  };
}
