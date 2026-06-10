import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  COLORS,
  formatTaskDueDateTime,
  DashboardTab,
  getTaskRemainingSeconds,
  getTaskElapsedSeconds,
  getTaskDurationLabel,
  Task,
  TaskStatus,
  TimerState,
  formatTime,
} from '../domain/model';
import { styles } from '../theme/styles';
import { formatBreakDuration, getBreakSeconds } from '../utils/timers';

const hasNativeLinearGradient =
  typeof UIManager.getViewManagerConfig === 'function' &&
  !!UIManager.getViewManagerConfig('BVLinearGradient');

type GradientProps = React.ComponentProps<typeof LinearGradient>;

export function AppLinearGradient({
  fallback,
  children,
  ...props
}: GradientProps & { fallback?: React.ReactNode }) {
  if (!hasNativeLinearGradient) {
    return <>{fallback ?? null}</>;
  }

  return <LinearGradient {...props}>{children}</LinearGradient>;
}

export function SplashBackdrop() {
  return <GradientSurface style={styles.splashGradient} />;
}

export function GradientSurface({
  style,
  opacity = 1,
}: {
  style?: object | object[];
  opacity?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.gradientSurface, style, { opacity }]}
    >
      <AppLinearGradient
        colors={['#A855F7', '#7C3AED', '#4F46E5']}
        locations={[0, 0.62, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientLinear}
      />
      <AppLinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientHighlight}
      />
      <AppLinearGradient
        colors={['rgba(30,41,59,0)', 'rgba(30,41,59,0.24)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientShade}
      />
    </View>
  );
}

export function ActionButton({
  title,
  onPress,
  variant,
  narrow,
}: {
  title: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'ghost' | 'danger';
  narrow?: boolean;
}) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.buttonBase,
        narrow && styles.buttonHalf,
        getButtonStyle(variant),
      ]}
    >
      {isPrimary ? <GradientSurface style={styles.buttonGradient} /> : null}
      <Text style={[styles.buttonText, getButtonTextStyle(variant)]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  onBack,
  actionLabel,
  onAction,
}: {
  title: string;
  onBack: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.headerIconButton}>
        <Text style={styles.headerIconText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} style={styles.headerActionButton}>
          <Text style={styles.headerActionText}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

export function SectionCard({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        {actionLabel ? (
          <Pressable onPress={onAction}>
            <Text style={styles.linkText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function FormCard({
  children,
  half,
}: {
  children: React.ReactNode;
  half?: boolean;
}) {
  return (
    <View style={[styles.formCard, half && styles.halfWidth]}>{children}</View>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>◌</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

export function FeedbackCard({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.feedbackCard}>
      <Text style={styles.feedbackTitle}>{title}</Text>
      <Text style={styles.feedbackText}>{text}</Text>
    </View>
  );
}

export function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choiceChip, active && styles.choiceChipActive]}
    >
      <Text
        style={[styles.choiceChipText, active && styles.choiceChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.inputLabel}>{label}</Text>;
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.passwordInputWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSoft}
        secureTextEntry={!isPasswordVisible}
        style={styles.passwordInput}
        autoCapitalize="none"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isPasswordVisible ? 'Hide password' : 'Show password'
        }
        onPress={() => setIsPasswordVisible(prev => !prev)}
        style={styles.passwordEyeButton}
      >
        <PasswordEyeIcon hidden={!isPasswordVisible} />
      </Pressable>
    </View>
  );
}

function PasswordEyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.7 12C5.4 8.6 8.4 6.5 12 6.5C15.6 6.5 18.6 8.6 20.3 12C18.6 15.4 15.6 17.5 12 17.5C8.4 17.5 5.4 15.4 3.7 12Z"
        stroke={COLORS.textSoft}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="12"
        r="2.7"
        stroke={COLORS.textSoft}
        strokeWidth={1.9}
      />
      {hidden ? (
        <Path
          d="M5 5L19 19"
          stroke={COLORS.textSoft}
          strokeWidth={2.1}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

export function MetaPill({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillIcon}>{icon}</Text>
      <Text style={styles.metaPillText}>{text}</Text>
    </View>
  );
}

export function LegendChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendChip}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

export function NotificationBellIcon({
  color,
  size = 22,
}: {
  color: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4.5C9.5 4.5 7.5 6.5 7.5 9V11.2C7.5 12.2 7.1 13.1 6.4 13.8L5.3 14.9C4.7 15.5 5.1 16.5 6 16.5H18C18.9 16.5 19.3 15.5 18.7 14.9L17.6 13.8C16.9 13.1 16.5 12.2 16.5 11.2V9C16.5 6.5 14.5 4.5 12 4.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 19C10.5 19.7 11.2 20 12 20C12.8 20 13.5 19.7 14 19"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function ProfileStatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.profileStatRow}>
      <Text style={styles.profileStatLabel}>{label}</Text>
      <Text style={[styles.profileStatValue, { color }]}>{value}</Text>
    </View>
  );
}

export function TaskCard({
  task,
  compact = false,
  timer,
  getUserName,
  onOpen,
  onAccept,
  onReject,
  onStart,
  onTogglePause,
  onNeedMoreTime,
  onReview,
  onViewCompleted: _onViewCompleted,
  disableOpen = false,
  readOnly: _readOnly = false,
}: {
  task: Task;
  compact?: boolean;
  timer?: TimerState;
  getUserName: (userId: string) => string;
  onOpen: (task: Task) => void;
  onAccept: (taskId: string) => void;
  onReject: (taskId: string) => void;
  onStart: (taskId: string) => void;
  onTogglePause: (taskId: string) => void;
  onNeedMoreTime?: (taskId: string) => void;
  onReview: (taskId: string, comment?: string) => void;
  onViewCompleted: (taskId: string) => void;
  disableOpen?: boolean;
  readOnly?: boolean;
}) {
  const [showPauseHistory, setShowPauseHistory] = useState(false);
  const [selectedPauseHistory, setSelectedPauseHistory] = useState<string[]>(
    [],
  );
  const pauseHistory = timer?.pauseHistory ?? task.pauseHistory ?? [];
  const pauseCount = pauseHistory.filter(entry =>
    entry.startsWith('Paused at'),
  ).length;
  const completionSummary = getCompletionSummary(task);
  const timeRemaining = getTaskRemainingSeconds(task, timer);
  const elapsedTime = getTaskElapsedSeconds(task, timer);
  const isPaused = timer?.isPaused ?? task.isPaused ?? false;
  const totalBreakSeconds = getBreakSeconds(
    timer ?? {
      isPaused,
      totalBreakSeconds: task.totalBreakSeconds ?? 0,
      pauseStartedAt: task.pauseStartedAt,
    },
  );
  const extensionHistory =
    timer?.extensionHistory ?? task.extensionHistory ?? [];
  const isTimeOver =
    task.status === 'in_progress' && !isPaused && timeRemaining === 0;
  console.log('TASK CARD DATA', task);
  console.log('TIME SPENT', task.actualTimeSpentSeconds);
  return (
    <Pressable
      disabled={disableOpen}
      onPress={() => onOpen(task)}
      style={styles.taskCard}
    >
      <View style={styles.taskCardHeader}>
        <View style={styles.taskTitleRow}>
          <Text style={styles.taskCardTitle}>{task.title}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {task.status === 'completed' ? (
              <Text
                style={[
                  styles.manageSummaryTitle,
                  task.completionStatusNote === 'Delay'
                    ? styles.statusDelayedBorder
                    : styles.statusOnTimeBorder,
                ]}
              >
                {task.completionStatusNote || 'Done'}
              </Text>
            ) : null}

            {task.status !== 'completed' ? (
              <Text style={[styles.badge, getStatusBadgeStyle(task.status)]}>
                {task.status.replace('_', ' ').toUpperCase()}
              </Text>
            ) : null}
          </View>
        </View>
        {task.description && (
          <Text numberOfLines={2} style={styles.taskCardDescription}>
            {task.description}
          </Text>
        )}
      </View>

      <View style={styles.taskMetaRow}>
        <MetaPill icon="◷" text={`Due: ${formatTaskDueDateTime(task)}`} />
        {task.status === 'under_review' || task.status === 'completed' ? (
          <MetaPill
            icon="◴"
            text={`Assigned Time: ${getTaskDurationLabel(task) || '--:--'}`}
          />
        ) : (
          <MetaPill icon="◌" text={`By: ${getUserName(task.assignedBy)}`} />
        )}
      </View>

      {task.status === 'in_progress' && timer ? (
        <View style={styles.inlineTimerCard}>
          <View style={styles.inlineTimerIcon}>
            <Text style={styles.inlineTimerIconText}>◴</Text>
          </View>
          <View style={styles.flexOne}>
          <Text style={styles.inlineTimerLabel}>Time Elapsed</Text>
<Text style={styles.inlineTimerValue}>
  {formatTime(elapsedTime)}
</Text>
          </View>
          <Text style={styles.inlineTimerState}>
            {isPaused ? 'Paused' : 'Running'}
          </Text>
        </View>
      ) : null}

      {task.status === 'in_progress' && pauseHistory.length ? (
        <View style={styles.taskNoteCard}>
          <Text style={styles.taskNoteTitle}>Pause History</Text>
          {pauseHistory.map((entry, index) => (
            <Text key={`${entry}-${index}`} style={styles.taskNoteText}>
              {entry}
            </Text>
          ))}
        </View>
      ) : null}

      {task.status === 'in_progress' && extensionHistory.length ? (
        <View style={styles.taskNoteCard}>
          <Text style={styles.taskNoteTitle}>Extra Time Taken</Text>
          {extensionHistory.map((entry, index) => (
            <Text key={`${entry}-${index}`} style={styles.taskNoteText}>
              {entry}
            </Text>
          ))}
        </View>
      ) : null}

      {task.status === 'under_review' ? (
        <View style={styles.reviewCommentCard}>
          <Text style={styles.reviewCommentLabel}>Review Comment</Text>
          <Text style={styles.reviewCommentText}>
            {task.reviewComment?.trim() || 'No review comment added.'}
          </Text>
        </View>
      ) : null}

      {task.status === 'completed' ? (
        <View style={styles.manageSummaryCard}>
          <Pressable
            onPress={() => {
              setSelectedPauseHistory(pauseHistory || []);
              setShowPauseHistory(true);
            }}
          >
            <MetaPill icon="◷" text={`Pauses History • View`} />
            <Modal
              animationType="fade"
              transparent
              visible={showPauseHistory}
              onRequestClose={() => setShowPauseHistory(false)}
            >
              <Pressable
                style={styles.modalOverlayCenter}
                onPress={() => setShowPauseHistory(false)}
              >
                <Pressable style={styles.pickerModalCard} onPress={() => {}}>
                  <Text style={styles.modalTitle}>Pause History</Text>

                  {selectedPauseHistory.length ? (
                    selectedPauseHistory.map((entry, index) => (
                      <Text
                        key={`${entry}-${index}`}
                        style={styles.doneSummaryText}
                      >
                        {entry}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.doneSummaryText}>No pauses taken</Text>
                  )}

                  <ActionButton
                    title="Close"
                    onPress={() => setShowPauseHistory(false)}
                    variant="secondary"
                  />
                </Pressable>
              </Pressable>
            </Modal>
          </Pressable>

          {extensionHistory?.length
            ? extensionHistory.map((entry, index) => (
                <MetaPill key={`${entry}-${index}`} icon="◴" text={entry} />
              ))
            : null}
          {/* <MetaPill
            icon="◷"
            text={`Total break taken: ${formatBreakDuration(
              totalBreakSeconds,
            )}`}
          /> */}
          <MetaPill
            icon="⏱"
            text={`Time Spent: ${
              task.actualTimeSpentSeconds
                ? formatTime(task.actualTimeSpentSeconds)
                : '00:00'
            }`}
          />

          <MetaPill
            icon="📅"
            text={`Completed At: ${
              task.completedAt
                ? new Date(task.completedAt).toLocaleString()
                : '--'
            }`}
          />
        </View>
      ) : null}

      {!compact ? (
        <View style={styles.taskActionRow}>
          {task.status === 'pending' ? (
            task.accepted ? (
              <ActionButton
                title="Start"
                onPress={() => onStart(task.id)}
                variant="primary"
                narrow
              />
            ) : (
              <>
                <ActionButton
                  title="Accept"
                  onPress={() => onAccept(task.id)}
                  variant="primary"
                  narrow
                />
                <ActionButton
                  title="Review"
                  onPress={() => onReview(task.id)}
                  variant="warning"
                  narrow
                />
                <ActionButton
                  title="Reject"
                  onPress={() => onReject(task.id)}
                  variant="secondary"
                  narrow
                />
              </>
            )
          ) : null}
          {task.status === 'in_progress' ? (
            <>
              {isTimeOver ? (
                <ActionButton
                  title="More Time"
                  onPress={() =>
                    onNeedMoreTime ? onNeedMoreTime(task.id) : onOpen(task)
                  }
                  variant="secondary"
                  narrow
                />
              ) : (
                <ActionButton
                  title={isPaused ? 'Resume' : 'Pause'}
                  onPress={() => onTogglePause(task.id)}
                  variant="secondary"
                  narrow
                />
              )}
              <ActionButton
                title="Done"
                onPress={() => onReview(task.id)}
                variant="primary"
                narrow
              />
            </>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export function BottomNav({
  activeTab: _activeTab,
  renderItem,
}: {
  activeTab: DashboardTab;
  renderItem: (
    label: string,
    tab: DashboardTab,
    icon: string,
  ) => React.ReactNode;
}) {
  return (
    <View style={styles.bottomNav}>
      {renderItem('Home', 'home', 'home-outline')}
      {renderItem('Tasks', 'tasks', 'grid-outline')}
      {renderItem('Add', 'add', 'add-circle-outline')}
      {renderItem('Profile', 'profile', 'person-circle-outline')}
    </View>
  );
}

export function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active
    ? styles.bottomNavIconActive.color
    : styles.bottomNavIcon.color;

  return (
    <View style={styles.bottomNavIconWrap}>
      {name === 'home-outline' ? (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 10.5L12 4L20 10.5V19C20 19.6 19.6 20 19 20H5C4.4 20 4 19.6 4 19V10.5Z"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 20V13H15V20"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}

      {name === 'grid-outline' ? (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect
            x="4"
            y="4"
            width="7"
            height="7"
            rx="1.8"
            stroke={stroke}
            strokeWidth={1.9}
          />
          <Rect
            x="13"
            y="4"
            width="7"
            height="7"
            rx="1.8"
            stroke={stroke}
            strokeWidth={1.9}
          />
          <Rect
            x="4"
            y="13"
            width="7"
            height="7"
            rx="1.8"
            stroke={stroke}
            strokeWidth={1.9}
          />
          <Rect
            x="13"
            y="13"
            width="7"
            height="7"
            rx="1.8"
            stroke={stroke}
            strokeWidth={1.9}
          />
        </Svg>
      ) : null}

      {name === 'add-circle-outline' ? (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.5" stroke={stroke} strokeWidth={1.9} />
          <Path
            d="M12 8V16"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
          />
          <Path
            d="M8 12H16"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
          />
        </Svg>
      ) : null}

      {name === 'person-circle-outline' ? (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.5" stroke={stroke} strokeWidth={1.9} />
          <Circle cx="12" cy="9.2" r="2.6" stroke={stroke} strokeWidth={1.9} />
          <Path
            d="M7.8 16.8C8.9 14.9 10.2 14 12 14C13.8 14 15.1 14.9 16.2 16.8"
            stroke={stroke}
            strokeWidth={1.9}
            strokeLinecap="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}

function getStatusBadgeStyle(status: TaskStatus) {
  switch (status) {
    case 'pending':
      return styles.statusPending;
    case 'in_progress':
      return styles.statusProgress;
    case 'completed':
      return styles.statusCompleted;
    case 'under_review':
      return styles.statusReview;
    case 'rejected':
      return styles.statusDanger;
    default:
      return styles.statusPending;
  }
}

function getCompletionSummary(task: Task) {
  if (!task.completedAt) {
    return 'NOT COMPLETED';
  }

  return task.extensionHistory?.length ? 'DELAY' : 'ON TIME';
}

function getButtonStyle(variant: string) {
  switch (variant) {
    case 'primary':
      return styles.buttonPrimary;
    case 'secondary':
      return styles.buttonSecondary;
    case 'success':
      return styles.buttonSuccess;
    case 'warning':
      return styles.buttonWarning;
    case 'ghost':
      return styles.buttonGhost;
    case 'danger':
      return styles.buttonDanger;
    default:
      return styles.buttonPrimary;
  }
}

function getButtonTextStyle(variant: string) {
  switch (variant) {
    case 'secondary':
      return styles.buttonTextSecondary;
    case 'warning':
      return styles.buttonTextWarning;
    case 'ghost':
      return styles.buttonTextGhost;
    default:
      return styles.buttonTextLight;
  }
}
