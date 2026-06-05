import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ScreenHeader, SectionCard } from '../../components';
import { getNotificationIcon } from '../../domain/model';
import { styles } from '../../theme/styles';
import type { ScreenRendererProps } from '../types';

type NotificationsScreenProps = Pick<
  ScreenRendererProps,
  | 'goBack'
  | 'unreadNotifications'
  | 'markAllNotificationsRead'
  | 'notifications'
  | 'openNotification'
>;

export function NotificationsScreen(props: NotificationsScreenProps) {
  const {
    goBack,
    unreadNotifications,
    markAllNotificationsRead,
    notifications,
    openNotification,
  } = props;

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.formScroll}>
        <ScreenHeader title="Notifications" onBack={goBack} />
        <SectionCard
          title={notifications.length ? `${unreadNotifications} unread` : 'Notifications'}
          actionLabel="Mark all read"
          onAction={markAllNotificationsRead}>
          {notifications.length ? (
            notifications.map(notification => (
              <Pressable
                key={notification.id}
                onPress={() => openNotification(notification)}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                ]}>
                <View style={styles.notificationIconWrap}>
                  <Text style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                </View>
                <View style={styles.flexOne}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationTime}>
                      {notification.timestamp}
                    </Text>
                  </View>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                </View>
                {!notification.read ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            ))
          ) : (
            <EmptyState
              title="No notifications"
              subtitle="Only updates related to your tasks will show here."
            />
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
