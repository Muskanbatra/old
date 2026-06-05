import type { AppNotification, Screen } from '../domain/model';

export function upsertNotification(
  existingNotifications: AppNotification[],
  nextNotification: AppNotification,
) {
  const existingIndex = existingNotifications.findIndex(
    notification => notification.id === nextNotification.id,
  );

  if (existingIndex === -1) {
    return [nextNotification, ...existingNotifications];
  }

  return existingNotifications.map(notification =>
    notification.id === nextNotification.id
      ? { ...notification, ...nextNotification }
      : notification,
  );
}

export function createInAppNotification(
  type: AppNotification['type'],
  title: string,
  message: string,
  taskId: string,
  options?: {
    recipientUserId?: string;
    recipientBackendUserId?: string;
    targetScreen?: Screen;
  },
): AppNotification {
  return {
    id: `${type}-${taskId}-${Date.now()}`,
    type,
    title,
    message,
    taskId,
    targetScreen: options?.targetScreen,
    recipientUserId: options?.recipientUserId,
    recipientBackendUserId: options?.recipientBackendUserId,
    timestamp: 'Just now',
    read: false,
  };
}

export function formatNotificationTimestamp(value?: string) {
  if (!value) {
    return 'Just now';
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
