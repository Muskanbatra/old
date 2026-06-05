import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  BottomNav,
  EmptyState,
  GradientSurface,
  NotificationBellIcon,
  SectionCard,
} from '../../components';
import { COLORS, type Task } from '../../domain/model';
import { styles } from '../../theme/styles';
import { DateRangePicker, type DateRange } from './DateRangePicker';
import type { ScreenRendererProps } from '../types';

type DashboardScreenProps = Pick<
  ScreenRendererProps,
  | 'currentUser'
  | 'tasks'
  | 'unreadNotifications'
  | 'pushNotificationStatus'
  | 'pushNotificationToken'
  | 'homeStats'
  | 'setScreen'
  | 'renderDashboardNavItem'
  | 'getUserName'
  | 'notifications'
  | 'openNotification'
> & {
  currentUserName?: string;
};

const DATE_FILTER_DAYS = 7;

function getDateKey(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDefaultDateRange(): DateRange {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (DATE_FILTER_DAYS - 1));

  return {
    startDate: formatDateValue(startDate),
    endDate: formatDateValue(endDate),
  };
}

function buildWeeklyPerformance(tasks: Task[], range: DateRange) {
  const startDate = new Date(range.startDate);
  const days = Array.from({ length: DATE_FILTER_DAYS }, (_, index) => {
    const date = new Date(startDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(startDate.getDate() + index);

    return {
      dateKey: formatDateValue(date),
      label: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      assigned: 0,
      completed: 0,
    };
  });

  const daysByKey = new Map(days.map(day => [day.dateKey, day]));

  tasks.forEach(task => {
    const createdKey = getDateKey(task.createdAt);
    const completedKey = getDateKey(task.completedAt);

    if (createdKey && daysByKey.has(createdKey)) {
      const day = daysByKey.get(createdKey);

      if (day) {
        day.assigned += 1;
      }
    }

    if (completedKey && daysByKey.has(completedKey)) {
      const day = daysByKey.get(completedKey);

      if (day) {
        day.completed += 1;
      }
    }
  });

  return days.map(({ dateKey, label, assigned, completed }) => ({
    dateKey,
    label,
    assigned,
    completed,
  }));
}

function FilterIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6H20M7 12H17M10 18H14"
        stroke="#4F46E5"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function DashboardScreen(props: DashboardScreenProps) {
  const {
    currentUser,
    tasks,
    currentUserName,
    unreadNotifications,
    homeStats,
    setScreen,
    renderDashboardNavItem,
    getUserName,
  } = props;

  const myTasks = tasks.filter(
    task =>
      task.assignedTo === currentUser?.id ||
      task.assignedTo === currentUser?.backendId,
  );
  const assignedByMe = tasks.filter(
    task =>
      task.assignedBy === currentUser?.id ||
      task.assignedBy === currentUser?.backendId,
  );
  const incomingTasks = myTasks.filter(task => task.status === 'pending');
  const reviewTasks = assignedByMe.filter(
    task => task.status === 'under_review' || task.status === 'rejected',
  );
  const completedTasks = myTasks.filter(task => task.status === 'completed');
  const createdTasks = assignedByMe.filter(task => task.status === 'pending');
  const doneTasks = assignedByMe.filter(task => task.status === 'completed');
  const pendingCount =
    homeStats.find(item => item.label.toLowerCase() === 'pending')?.value ??
    incomingTasks.length;
  const reviewCount =
    homeStats.find(item => item.label.toLowerCase() === 'review')?.value ??
    reviewTasks.length;
  const doneCount =
    homeStats.find(item => item.label.toLowerCase() === 'done')?.value ??
    completedTasks.length;
  const overviewCards = [
    {
      label: 'Created',
      value: assignedByMe.length,
      description: 'Tasks you are managing right now.',
      style: styles.overviewCardCreated,
      accent: styles.overviewAccentCreated,
    },
    {
      label: 'Pending',
      value: createdTasks.length,
      description: 'Tasks waiting for assignees to start work.',
      style: styles.overviewCardPending,
      accent: styles.overviewAccentPending,
    },
    {
      label: 'Review',
      value: reviewTasks.length,
      description: 'Tasks returned for review, approval, or edits.',
      style: styles.overviewCardReview,
      accent: styles.overviewAccentReview,
    },
    {
      label: 'Completed',
      value: doneTasks.length,
      description: 'Managed tasks already completed successfully.',
      style: styles.overviewCardCompleted,
      accent: styles.overviewAccentCompleted,
    },
  ];

  const managedRows = assignedByMe.reduce<
    Array<{
      userId: string;
      userName: string;
      pending: number;
      review: number;
      done: number;
      total: number;
    }>
  >((rows, task) => {
    const existing = rows.find(row => row.userId === task.assignedTo);

    if (existing) {
      if (task.status === 'pending') {
        existing.pending += 1;
      } else if (task.status === 'under_review' || task.status === 'rejected') {
        existing.review += 1;
      } else if (task.status === 'completed') {
        existing.done += 1;
      }
      existing.total += 1;
      return rows;
    }

    rows.push({
      userId: task.assignedTo,
      userName: getUserName(task.assignedTo),
      pending: task.status === 'pending' ? 1 : 0,
      review: task.status === 'under_review' || task.status === 'rejected' ? 1 : 0,
      done: task.status === 'completed' ? 1 : 0,
      total: 1,
    });

    return rows;
  }, []);

  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const weeklyData = buildWeeklyPerformance(myTasks, dateRange);
  const [selectedChartKey, setSelectedChartKey] = useState(
    weeklyData[weeklyData.length - 1]?.dateKey ?? '',
  );
  const fallbackChartPoint = {
    dateKey: '',
    label: 'Today',
    assigned: 0,
    completed: 0,
  };
  const selectedChartPoint =
    weeklyData.find(item => item.dateKey === selectedChartKey) ??
    weeklyData[weeklyData.length - 1] ??
    fallbackChartPoint;
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.dashboardScroll}>
        <View style={styles.heroCard}>
          <GradientSurface style={styles.heroGradient} />
          <View style={styles.heroTopRow}>
            <View style={styles.flexOne}>
              <Text style={styles.heroEyebrow}>Welcome Back,</Text>
              <Text style={styles.heroGreeting}>
                {currentUserName ?? currentUser?.name ?? 'Alex Johnson'}
              </Text>
            </View>
            <Pressable onPress={() => setScreen('notifications')}>
              <View style={styles.notificationBubble}>
                <NotificationBellIcon color="#FFFFFF" size={24} />
                {unreadNotifications ? (
                  <View style={styles.notificationDot}>
                    <View style={styles.notificationDotInner} />
                  </View>
                ) : null}
              </View>
            </Pressable>
          </View>

          <View style={styles.statsGrid}>
            {[
              { label: 'Pending', value: pendingCount },
              { label: 'Review', value: reviewCount },
              { label: 'Done', value: doneCount },
            ].map(item => (
              <View key={item.label} style={styles.statCard}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionCard title="">
          <View style={styles.chartHighlightCard}>
            {/* <Text style={styles.chartHighlightEyebrow}>BEST DAY</Text> */}
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 50 }}
            >
              <Text style={styles.chartHighlightValue}>
                {selectedChartPoint.label}: {selectedChartPoint.completed} Tasks
                Completed
              </Text>
              <Pressable
                onPress={() => setShowDateRangePicker(true)}
                style={styles.chartFilterIconButton}
                accessibilityLabel="Filter date range"
              >
                <FilterIcon />
              </Pressable>
            </View>
            <View style={styles.chartMetricChipRow}>
              <View style={styles.legendChip}>
                <View
                  style={[styles.legendDot, { backgroundColor: COLORS.purple }]}
                />
                <Text style={styles.legendText}>
                  Assigned: {selectedChartPoint.assigned}
                </Text>
              </View>
              <View style={styles.legendChip}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: COLORS.success },
                  ]}
                />
                <Text style={styles.legendText}>
                  Completed: {selectedChartPoint.completed}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.analyticsStack}>
            <View style={styles.analyticsCardPrimary}>
              {/* <View style={styles.dashboardPerformanceSummary}>
                <View style={styles.dashboardPerformanceMetric}>
                  <Text style={styles.dashboardPerformanceLabel}>Completed</Text>
                  <Text style={styles.dashboardPerformanceValue}>{weeklyCompleted}</Text>
                </View>
                <View style={styles.dashboardPerformanceMetric}>
                  <Text style={styles.dashboardPerformanceLabel}>Assigned</Text>
                  <Text style={styles.dashboardPerformanceValue}>{weeklyAssigned}</Text>
                </View>
                <View style={styles.dashboardPerformanceMetric}>
                  <Text style={styles.dashboardPerformanceLabel}>Completion</Text>
                  <Text style={styles.dashboardPerformanceValue}>{weeklyCompletionRate}%</Text>
                </View>
              </View> */}

              <View style={styles.chartCard}>
                {weeklyData.map(item => (
                  <Pressable
                    key={item.dateKey}
                    onPress={() => setSelectedChartKey(item.dateKey)}
                    onHoverIn={() => setSelectedChartKey(item.dateKey)}
                    style={styles.chartColumn}
                  >
                    <View style={styles.chartBarTrack}>
                      <View
                        style={[
                          styles.chartBarAssigned,
                          { height: Math.max(18, item.assigned * 10) },
                        ]}
                      />
                      <View
                        style={[
                          styles.chartBarCompleted,
                          { height: Math.max(12, item.completed * 10) },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.chartLabel,
                        selectedChartPoint.dateKey === item.dateKey &&
                          styles.chartLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </SectionCard>

        <DateRangePicker
          visible={showDateRangePicker}
          value={dateRange}
          onClose={() => setShowDateRangePicker(false)}
          onApply={range => {
            setDateRange(range);
            setSelectedChartKey(range.endDate);
          }}
        />

        {/* <View style={styles.analyticsCardSecondary}>
          <Text style={styles.analyticsTitle}>Task Distribution</Text>
          <Text style={styles.chartIntro}>
            How your current workload is spread across stages.
          </Text>
          <View style={styles.distributionWrap}>
            {distributionData.map(item => (
              <View key={item.label} style={styles.distributionRow}>
                <View style={styles.distributionHeader}>
                  <View style={styles.distributionLabelWrap}>
                    <Text style={styles.distributionLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.distributionValue}>{item.value}</Text>
                </View>
                <View style={styles.distributionTrack}>
                  <View
                    style={[
                      styles.distributionFill,
                      {
                        width: `${Math.max(12, (item.value / maxDistribution) * 100)}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View> */}

        {/* <SectionCard
          title="Notifications"
          actionLabel="See all"
          onAction={() => setScreen('notifications')}>
          <View style={styles.dashboardNotificationStatusCard}>
            <View style={styles.flexOne}>
              <Text style={styles.dashboardNotificationStatusTitle}>
                {pushStatusCopy.label}
              </Text>
              <Text style={styles.dashboardNotificationStatusText}>
                {pushStatusCopy.description}
              </Text>
            </View>
            <View style={styles.dashboardNotificationStatusBadge}>
              <Text style={styles.dashboardNotificationStatusBadgeText}>
                {unreadNotifications} unread
              </Text>
            </View>
          </View>

          {pushNotificationToken ? (
            <Text style={styles.dashboardNotificationToken}>
              FCM token ready: {pushNotificationToken.slice(0, 18)}...
            </Text>
          ) : null}

          {recentNotifications.length ? (
            recentNotifications.map(notification => (
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
                    <Text style={styles.notificationTime}>{notification.timestamp}</Text>
                  </View>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                </View>
                {!notification.read ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            ))
          ) : (
            <EmptyState
              title="No notifications yet"
              subtitle="Firebase messages and task updates will appear here."
            />
          )}
        </SectionCard> */}

        <SectionCard title="Created Task Overview">
          <View style={styles.overviewGrid}>
            {overviewCards.map(item => (
              <View key={item.label} style={[styles.overviewCard, item.style]}>
                <Text style={[styles.overviewEyebrow, item.accent]}>
                  {item.label}
                </Text>
                <Text style={styles.overviewValue}>{item.value}</Text>
                <Text style={styles.overviewDescription}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Managed Tasks Overview">
          <Text style={styles.chartIntro}>
            See how your assigned work is moving, who owns it, and where
            follow-up is needed.
          </Text>
          {managedRows.length ? (
            <View style={styles.managedTable}>
              <View style={styles.managedTableHeader}>
                <Text
                  style={[styles.managedHeaderCell, styles.managedUserCell]}
                >
                  Users
                </Text>
                <Text style={styles.managedHeaderCell}>Pending</Text>
                <Text style={styles.managedHeaderCell}>Review</Text>
                <Text style={styles.managedHeaderCell}>Done</Text>
              </View>

              {managedRows.map(row => (
                <View key={row.userId} style={styles.managedTableRow}>
                  <View style={styles.managedUserCell}>
                    <Text style={styles.managedUserName}>{row.userName}</Text>
                    <Text style={styles.managedUserMeta}>
                      {row.total} managed tasks
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.managedCountPill,
                      styles.managedCountPending,
                    ]}
                  >
                    <Text style={styles.managedCountText}>{row.pending}</Text>
                  </View>
                  <View
                    style={[styles.managedCountPill, styles.managedCountReview]}
                  >
                    <Text style={styles.managedCountText}>{row.review}</Text>
                  </View>
                  <View
                    style={[styles.managedCountPill, styles.managedCountDone]}
                  >
                    <Text style={styles.managedCountText}>{row.done}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No managed tasks yet"
              subtitle="Create a task to populate this overview table."
            />
          )}
        </SectionCard>
      </ScrollView>

      <BottomNav activeTab="home" renderItem={renderDashboardNavItem} />
    </SafeAreaView>
  );
}
