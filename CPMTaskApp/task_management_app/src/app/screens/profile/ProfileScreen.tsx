import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BottomNav,
  GradientSurface,
  NotificationBellIcon,
  ProfileStatRow,
  ScreenHeader,
} from '../../components';
import { COLORS } from '../../domain/model';
import { styles } from '../../theme/styles';
import type { ScreenRendererProps } from '../types';

type ProfileScreenProps = Pick<
  ScreenRendererProps,
  | 'currentUser'
  | 'setScreen'
  | 'goBack'
  | 'profileStats'
  | 'handleLogout'
  | 'renderDashboardNavItem'
>;

export function ProfileScreen(props: ProfileScreenProps) {
  const { currentUser, setScreen, goBack, profileStats, handleLogout, renderDashboardNavItem } =
    props;
  const initials = currentUser?.name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.formScroll}>
        <ScreenHeader title="Profile" onBack={goBack} />

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <GradientSurface style={styles.profileAvatarGradient} />
            <Text style={styles.profileAvatarText}>{initials || 'AJ'}</Text>
          </View>
          <Text style={styles.profileName}>{currentUser?.name ?? 'Alex Johnson'}</Text>
          <Text style={styles.profileEmail}>
            {currentUser?.email ?? 'alex@company.com'}
          </Text>
          <Text style={styles.profilePhone}>
            {currentUser?.telephone?.trim() || 'No phone number'}
          </Text>
        </View>

        <View style={styles.profileStatsCard}>
          <Text style={styles.profileSectionTitle}>Statistics</Text>
          {/* <ProfileStatRow
            label="Total Tasks"
            value={String(profileStats.total)}
            color={COLORS.text}
          /> */}
          <ProfileStatRow
            label="Completed"
            value={String(profileStats.completed)}
            color={COLORS.success}
          />
          <ProfileStatRow
            label="Review"
            value={String(profileStats.review)}
            color={COLORS.purple}
          />
          <ProfileStatRow
            label="Pending"
            value={String(profileStats.pending)}
            color={COLORS.blue}
          />
        </View>

        <Pressable onPress={() => setScreen('notifications')} style={styles.profileActionCard}>
          <View style={styles.profileActionLeft}>
            <NotificationBellIcon color={COLORS.indigo} size={20} />
            <Text style={styles.profileActionText}>Notifications</Text>
          </View>
          <Text style={styles.profileActionArrow}>›</Text>
        </Pressable>

   {currentUser?.role?.toLowerCase() === 'admin' && (
  <Pressable
    onPress={() => setScreen('manageUsers')}
    style={styles.profileActionCard}>
    <View style={styles.profileActionLeft}>
      <Text style={styles.profileActionIcon}>◫</Text>
      <Text style={styles.profileActionText}>Manage Users</Text>
    </View>
    <Text style={styles.profileActionArrow}>›</Text>
  </Pressable>
)}

        <Pressable onPress={handleLogout} style={styles.logoutCard}>
          <Text style={styles.logoutIcon}>⇥</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav activeTab="profile" renderItem={renderDashboardNavItem} />
    </SafeAreaView>
  );
}
