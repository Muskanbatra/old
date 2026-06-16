import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionButton,
  BottomNav,
  GradientSurface,
  MetaPill,
  ScreenHeader,
} from '../../components';
import {
  formatTime,
  ManageTab,
  parseDurationMinutes,
  Task,
} from '../../domain/model';
import { styles } from '../../theme/styles';
import { formatBreakDuration, getBreakSeconds } from '../../utils/timers';
import type { ScreenRendererProps } from '../types';
import { ManageTaskFormSection } from './manage-task/ManageTaskFormSection';
import { ManagedTaskListSection } from './manage-task/ManagedTaskListSection';
import { ManageTaskTabs } from './manage-task/ManageTaskTabs';

const TASKS_PER_PAGE = 10;

type TaskFormErrors = {
  title?: string;
  dueDate?: string;
  dueTime?: string;
  assignedTo?: string;
};

type ManageTaskScreenProps = Pick<
  ScreenRendererProps,
  | 'screen'
  | 'setScreen'
  | 'goBack'
  | 'manageTab'
  | 'setManageTab'
  | 'manageTasks'
  | 'renderTaskCard'
  | 'taskForm'
  | 'setTaskForm'
  | 'getUserName'
  | 'users'
  | 'currentUser'
  | 'isTasksLoading'
  | 'taskActionError'
  | 'isSavingTask'
  | 'handleEditSelectedTask'
  | 'handleReassignTask'
  | 'handleCreateTask'
  | 'openTaskEditor'
  | 'renderDashboardNavItem'
>;

export function ManageTaskScreen(props: ManageTaskScreenProps) {
  const {
    screen,
    setScreen,
    goBack,
    manageTab,
    setManageTab,
    manageTasks,
    renderTaskCard,
    taskForm,
    setTaskForm,
    getUserName,
    users,
    currentUser,
    isTasksLoading,
    taskActionError,
    isSavingTask,
    handleEditSelectedTask,
    handleReassignTask,
    handleCreateTask,
    openTaskEditor,
    renderDashboardNavItem,
  } = props;
  const [showPauseHistory, setShowPauseHistory] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAssignToPicker, setShowAssignToPicker] = useState(false);
  const [customDurationMinutes, setCustomDurationMinutes] = useState('');
  const [selectedDurationUnit, setSelectedDurationUnit] = useState<
    'min' | 'hr'
  >('min');
  const [taskFormErrors, setTaskFormErrors] = useState<TaskFormErrors>({});
  const [selectedPauseHistory, setSelectedPauseHistory] = useState<string[]>(
    [],
  );
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskPage, setTaskPage] = useState(1);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const isEditing = screen === 'editTask';
  const today = new Date();
  const todayAtMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const showingTaskList = !isEditing && manageTab !== 'create';
  const availableUsers = users.filter(user => user.id !== currentUser?.id);
  const normalizedAssignSearchQuery = assignSearchQuery.trim().toLowerCase();
  const filteredAvailableUsers = normalizedAssignSearchQuery
    ? availableUsers.filter(user => {
        const searchableText = [user.name, user.email, user.role]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedAssignSearchQuery);
      })
    : availableUsers;
  const normalizedSearchQuery = taskSearchQuery.trim().toLowerCase();
  const filteredManageTasks = normalizedSearchQuery
    ? manageTasks.filter(task => {
        const searchableText = [
          task.title,
          task.description,
          task.dueDate,
          task.dueTime,
          task.status,
          task.reviewComment,
          task.feedback,
          getUserName(task.assignedTo),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
      })
    : manageTasks;
  const totalTaskPages = Math.max(
    1,
    Math.ceil(filteredManageTasks.length / TASKS_PER_PAGE),
  );
  const currentTaskPage = Math.min(taskPage, totalTaskPages);
  const paginatedManageTasks = filteredManageTasks.slice(
    (currentTaskPage - 1) * TASKS_PER_PAGE,
    currentTaskPage * TASKS_PER_PAGE,
  );

  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const monthOffset = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const calendarDays = Array.from(
    { length: monthOffset + daysInMonth },
    (_, index) => {
      if (index < monthOffset) {
        return null;
      }

      const dayNumber = index - monthOffset + 1;
      return new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        dayNumber,
      );
    },
  );

  const handleManageTabPress = (tab: ManageTab) => {
    setManageTab(tab);
    if (tab === 'create' && screen !== 'createTask') {
      setScreen('createTask');
    }
  };

  useEffect(() => {
    setTaskSearchQuery('');
    setTaskPage(1);
  }, [manageTab]);

  useEffect(() => {
    setTaskPage(1);
  }, [taskSearchQuery]);

  useEffect(() => {
    if (!showAssignToPicker) {
      setAssignSearchQuery('');
    }
  }, [showAssignToPicker]);

  const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const getSelectedDate = () => {
    if (!taskForm.dueDate) {
      return null;
    }

    const parsed = new Date(taskForm.dueDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const openDatePicker = () => {
    const selectedDate = getSelectedDate();
    const monthSource =
      selectedDate && selectedDate >= todayAtMidnight
        ? selectedDate
        : todayAtMidnight;
    setVisibleMonth(
      new Date(monthSource.getFullYear(), monthSource.getMonth(), 1),
    );
    setShowDatePicker(true);
  };

  const handleDateSelect = (date: Date) => {
    if (date < todayAtMidnight) {
      return;
    }

    setTaskForm(prev => ({ ...prev, dueDate: formatDateValue(date) }));
    setTaskFormErrors(prev => ({ ...prev, dueDate: undefined }));
    setShowDatePicker(false);
  };

  const changeVisibleMonth = (offset: number) => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1,
    );

    if (
      nextMonth <
      new Date(todayAtMidnight.getFullYear(), todayAtMidnight.getMonth(), 1)
    ) {
      return;
    }

    setVisibleMonth(nextMonth);
  };

  const handleTimeSelect = (time: string) => {
    setTaskForm(prev => ({ ...prev, dueTime: time }));
    setTaskFormErrors(prev => ({ ...prev, dueTime: undefined }));
    setShowTimePicker(false);
  };

  const validateTaskForm = () => {
    const nextErrors: TaskFormErrors = {};

    if (!taskForm.title.trim()) {
      nextErrors.title = 'Task title is required.';
    }

    if (!taskForm.dueDate.trim()) {
      nextErrors.dueDate = 'Due date is required.';
    }

    // if (!taskForm.dueTime.trim()) {
    //   nextErrors.dueTime = 'Task time is required.';
    // }

    if (!taskForm.assignedTo.trim()) {
      nextErrors.assignedTo = 'Please select a team member.';
    }

    setTaskFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateTaskForm()) {
      return;
    }

    if (isEditing) {
      handleEditSelectedTask();
      return;
    }

    handleCreateTask();

    setTaskForm({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      assignedTo: '',
    });
    setTaskFormErrors({});
  };

  const openTimePicker = () => {
    const selectedMinutes = parseDurationMinutes(taskForm.dueTime);
    const useHours =
      selectedMinutes > 0 &&
      selectedMinutes % 60 === 0 &&
      /\b(hr|hrs|hour|hours)\b/i.test(taskForm.dueTime);

    setSelectedDurationUnit(useHours ? 'hr' : 'min');
    setCustomDurationMinutes(
      Number.isFinite(selectedMinutes) && selectedMinutes > 0
        ? String(useHours ? selectedMinutes / 60 : selectedMinutes)
        : '',
    );
    setShowTimePicker(true);
  };

  const confirmTimeSelection = () => {
    const selectedValue = Number(customDurationMinutes);

    if (!Number.isFinite(selectedValue) || selectedValue <= 0) {
      setTaskFormErrors(prev => ({
        ...prev,
        dueTime: 'Enter valid time for task.',
      }));
      return;
    }

    const normalizedValue =
      selectedDurationUnit === 'hr'
        ? Math.floor(selectedValue)
        : Math.floor(selectedValue);

    handleTimeSelect(
      `${normalizedValue} ${selectedDurationUnit === 'hr' ? 'hr' : 'min'}`,
    );
    setCustomDurationMinutes('');
  };

  const formatDisplayDateTime = (value?: string, fallbackTime?: string) => {
    if (!value) {
      return fallbackTime ? `Time: ${fallbackTime}` : 'Not available';
    }

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    if (fallbackTime) {
      return `${value} • ${fallbackTime}`;
    }

    return value;
  };

  const renderManagedTaskCard = (task: Task) => {
    if (manageTab === 'created') {
      return (
        <View key={task.id} style={styles.taskCard}>
          <View style={styles.taskCardHeader}>
            <View style={styles.taskTitleRow}>
              <Text style={styles.taskCardTitle}>{task.title}</Text>

              <View>
                <Text style={[styles.badge, styles.statusPending]}>
                  PENDING
                </Text>
              </View>
            </View>

            {task.description && (
              <Text style={styles.taskCardDescription}>{task.description}</Text>
            )}
          </View>

          <View style={styles.taskMetaRow}>
            <MetaPill
              icon="◌"
              text={`Assigned to: ${getUserName(task.assignedTo)}`}
            />
            <MetaPill
              icon="◴"
              text={`Due: ${task.dueDate}${
                task.dueTime ? `, ${task.dueTime}` : ''
              }`}
            />
          </View>

          <View style={styles.taskMetaRow}>
            <MetaPill
              icon="◷"
              text={`Created at: ${formatDisplayDateTime(task.createdAt)}`}
            />
          </View>
        </View>
      );
    }

    if (manageTab === 'done') {
      const completionStatus = getCompletionStatus(task);
      const pauseCount = (task.pauseHistory ?? []).filter(entry =>
        entry.startsWith('Paused at'),
      ).length;
      const totalBreakSeconds = getBreakSeconds({
        isPaused: task.isPaused ?? false,
        totalBreakSeconds: task.totalBreakSeconds ?? 0,
        pauseStartedAt: task.pauseStartedAt,
      });

      return (
        <View key={task.id} style={styles.taskCard}>
          <View style={styles.taskCardHeader}>
            <View style={styles.taskTitleRow}>
              <Text style={styles.taskCardTitle}>{task.title}</Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                {/* <View>
                  <Text
                    style={[
                      styles.badge,
                      styles.manageStatusBadgeCompact,
                      styles.statusCompleted,
                    ]}
                  >
                    DONE
                  </Text>
                </View> */}
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
              </View>
            </View>

            {task.description && (
              <Text style={styles.taskCardDescription}>{task.description}</Text>
            )}
          </View>

          <View style={styles.taskMetaRow}>
            <MetaPill
              icon="◌"
              text={`Assigned to: ${getUserName(task.assignedTo)}`}
            />
            <MetaPill icon="◷" text={`Due: ${task.dueDate}, ${task.dueTime}`} />
          </View>

          <View style={styles.manageSummaryCard}>
            <View style={styles.rowGap}>
              <Pressable
                onPress={() => {
                  setSelectedPauseHistory(task.pauseHistory || []);
                  setShowPauseHistory(true);
                }}
              >
                <MetaPill
                  icon="◷"
                  text={`Pauses taken: ${pauseCount} • View`}
                />
              </Pressable>
              <MetaPill
                icon="⏱"
                text={`Time Spent: ${
                  task.actualTimeSpentSeconds
                    ? formatTime(task.actualTimeSpentSeconds)
                    : '00:00:00'
                }`}
              />
            </View>

            {/* <MetaPill
              icon="◷"
              text={`Total break taken: ${formatBreakDuration(
                totalBreakSeconds,
              )}`}
            /> */}

            {task.extensionHistory?.length
              ? task.extensionHistory.map((entry, index) => (
                  <MetaPill key={`${entry}-${index}`} icon="◴" text={entry} />
                ))
              : null}
          </View>
        </View>
      );
    }

    if (manageTab === 'review') {
      return (
        <View key={task.id} style={styles.taskCard}>
          <View style={styles.taskCardHeader}>
            <View style={styles.taskTitleRow}>
              <Text style={styles.taskCardTitle}>{task.title}</Text>

              <Text
                style={[
                  styles.badge,
                  styles.manageStatusBadgeCompact,
                  task.status === 'rejected'
                    ? styles.statusDanger
                    : styles.statusReview,
                ]}
              >
                {task.status === 'rejected' ? 'REJECTED' : 'IN REVIEW'}
              </Text>
            </View>

            {task.description && (
              <Text style={styles.taskCardDescription}>{task.description}</Text>
            )}
          </View>

          <View style={styles.taskMetaRow}>
            <MetaPill
              icon="◌"
              text={`Assigned to: ${getUserName(task.assignedTo)}`}
            />
            <MetaPill
              icon="◷"
              text={`Due: ${task.dueDate}${
                task.dueTime ? ` , ${task.dueTime}` : ''
              }`}
            />
          </View>

          <View style={styles.reviewCommentCard}>
            <Text style={styles.reviewCommentLabel}>
              {task.status === 'rejected' ? 'Reject Reason' : 'Review Comment'}
            </Text>
            <Text style={styles.reviewCommentText}>
              {task.reviewComment?.trim() || 'No reason added yet.'}
            </Text>
          </View>

          <View style={styles.taskActionRow}>
            <ActionButton
              title="Edit"
              onPress={() => openTaskEditor(task.id)}
              variant="secondary"
              narrow
            />
            <ActionButton
              title="Assign"
              onPress={() => handleReassignTask(task.id)}
              variant="primary"
              narrow
            />
          </View>
        </View>
      );
    }

    return renderTaskCard(task);
  };

  return (
    <SafeAreaView style={[styles.page, styles.manageTaskPage]}>
      <ScrollView
        style={[styles.flexOne, styles.manageTaskPage]}
        contentContainerStyle={
          showingTaskList ? styles.manageTaskScrollContent : styles.formScroll
        }
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={isEditing ? 'Edit Task' : 'Manage Tasks'}
          onBack={goBack}
        />

        {!isEditing ? (
          <ManageTaskTabs
            activeTab={manageTab}
            onPress={handleManageTabPress}
          />
        ) : null}

        {showingTaskList ? (
          <>
            <TextInput
              value={taskSearchQuery}
              onChangeText={setTaskSearchQuery}
              placeholder="Search tasks"
              placeholderTextColor="#94A3B8"
              style={styles.taskListSearchInput}
              autoCapitalize="none"
            />

            <ManagedTaskListSection
              isTasksLoading={isTasksLoading}
              taskCount={filteredManageTasks.length}
              emptyTitle={
                taskSearchQuery.trim() ? 'No matching tasks' : 'No tasks here'
              }
              emptySubtitle={
                taskSearchQuery.trim()
                  ? 'Try a different search term.'
                  : 'This manage tab does not have any tasks yet.'
              }
            >
              {paginatedManageTasks.map(task => renderManagedTaskCard(task))}
            </ManagedTaskListSection>
            <Text style={styles.taskListMetaText}>
              Showing {paginatedManageTasks.length} of{' '}
              {filteredManageTasks.length} tasks
            </Text>

            {filteredManageTasks.length > TASKS_PER_PAGE ? (
              <View style={styles.paginationRow}>
                <Pressable
                  onPress={() => setTaskPage(prev => Math.max(1, prev - 1))}
                  disabled={currentTaskPage === 1}
                  style={[
                    styles.paginationButton,
                    currentTaskPage === 1 && styles.paginationButtonDisabled,
                  ]}
                >
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </Pressable>
                <Text style={styles.paginationText}>
                  Page {currentTaskPage} of {totalTaskPages}
                </Text>
                <Pressable
                  onPress={() =>
                    setTaskPage(prev => Math.min(totalTaskPages, prev + 1))
                  }
                  disabled={currentTaskPage === totalTaskPages}
                  style={[
                    styles.paginationButton,
                    currentTaskPage === totalTaskPages &&
                      styles.paginationButtonDisabled,
                  ]}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : (
          <ManageTaskFormSection
            isEditing={isEditing}
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            taskFormErrors={taskFormErrors}
            onTitleChange={value => {
              setTaskForm(prev => ({ ...prev, title: value }));
              setTaskFormErrors(prev => ({ ...prev, title: undefined }));
            }}
            getUserName={getUserName}
            onOpenDatePicker={openDatePicker}
            onOpenTimePicker={openTimePicker}
            onOpenAssignPicker={() => setShowAssignToPicker(true)}
            onSubmit={handleSubmit}
            isSavingTask={isSavingTask}
            taskActionError={taskActionError}
          />
        )}
      </ScrollView>

      {!isEditing ? (
        <BottomNav activeTab="add" renderItem={renderDashboardNavItem} />
      ) : null}

      <Modal
        animationType="slide"
        transparent
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          style={styles.modalOverlayCenter}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.pickerModalCard} onPress={() => {}}>
            <View style={styles.calendarHeader}>
              <Pressable
                onPress={() => changeVisibleMonth(-1)}
                style={styles.calendarNavButton}
              >
                <Text style={styles.calendarNavButtonText}>‹</Text>
              </Pressable>
              <Text style={styles.calendarMonthText}>{monthLabel}</Text>
              <Pressable
                onPress={() => changeVisibleMonth(1)}
                style={styles.calendarNavButton}
              >
                <Text style={styles.calendarNavButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.calendarWeekRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.calendarWeekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={styles.calendarDayPlaceholder}
                    />
                  );
                }

                const dateValue = formatDateValue(date);
                const isSelected = taskForm.dueDate === dateValue;
                const isPast = date < todayAtMidnight;

                return (
                  <Pressable
                    key={dateValue}
                    onPress={() => handleDateSelect(date)}
                    disabled={isPast}
                    style={[
                      styles.calendarDayButton,
                      isSelected && styles.calendarDayButtonActive,
                      isPast && styles.calendarDayButtonDisabled,
                    ]}
                  >
                    {isSelected ? (
                      <GradientSurface style={styles.calendarDayGradient} />
                    ) : null}
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextActive,
                        isPast && styles.calendarDayTextDisabled,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable
          style={styles.modalOverlayCenter}
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable style={styles.pickerModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Set Task Time</Text>
            <Text style={styles.modalText}>
              Enter the task time and choose whether it is in minutes or hours.
            </Text>
            <View style={styles.rowGap}>
              <View style={styles.flexOne}>
                <TextInput
                  value={customDurationMinutes}
                  onChangeText={setCustomDurationMinutes}
                  placeholder="Enter time"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  style={styles.inputNoMargin}
                />
              </View>

              <View style={styles.durationTabContainer}>
                {(['min', 'hr'] as const).map(unit => {
                  const active = selectedDurationUnit === unit;

                  return (
                    <Pressable
                      key={unit}
                      onPress={() => setSelectedDurationUnit(unit)}
                      style={[
                        styles.durationTab,
                        active && styles.durationTabActive,
                      ]}
                    >
                      {active ? (
                        <GradientSurface style={styles.durationTabGradient} />
                      ) : null}

                      <Text
                        style={[
                          styles.durationTabText,
                          active && styles.durationTabTextActive,
                        ]}
                      >
                        {unit.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ActionButton
              title="Confirm Time"
              onPress={confirmTimeSelection}
              variant="primary"
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={showAssignToPicker}
        onRequestClose={() => setShowAssignToPicker(false)}
      >
        <Pressable
          style={styles.modalOverlayCenter}
          onPress={() => setShowAssignToPicker(false)}
        >
          <Pressable style={styles.pickerModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Assign Task To</Text>
            <TextInput
              value={assignSearchQuery}
              onChangeText={setAssignSearchQuery}
              placeholder="Search team member"
              placeholderTextColor="#94A3B8"
              style={styles.inputNoMargin}
              autoCapitalize="none"
            />
            <ScrollView
              style={styles.assignDropdownList}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.assignDropdownWrap}>
                {filteredAvailableUsers.length ? (
                  filteredAvailableUsers.map(user => (
                    <Pressable
                      key={user.id}
                      onPress={() => {
                        setTaskForm(prev => ({
                          ...prev,
                          assignedTo: user.id,
                        }));
                        setTaskFormErrors(prev => ({
                          ...prev,
                          assignedTo: undefined,
                        }));
                        setShowAssignToPicker(false);
                      }}
                      style={[
                        styles.assignDropdownItem,
                        taskForm.assignedTo === user.id &&
                          styles.assignDropdownItemActive,
                      ]}
                    >
                      {taskForm.assignedTo === user.id ? (
                        <GradientSurface
                          style={styles.assignDropdownGradient}
                        />
                      ) : null}
                      <View style={styles.flexOne}>
                        <Text
                          style={[
                            styles.assignDropdownName,
                            taskForm.assignedTo === user.id &&
                              styles.assignDropdownNameActive,
                          ]}
                        >
                          {user.name}
                        </Text>
                        <Text
                          style={[
                            styles.assignDropdownRole,
                            taskForm.assignedTo === user.id &&
                              styles.assignDropdownRoleActive,
                          ]}
                        >
                          {user.role}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.modalText}>No team members found.</Text>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={showPauseHistory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPauseHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pause History</Text>

            {selectedPauseHistory.length ? (
              selectedPauseHistory.map((item, index) => (
                <Text key={`${item}-${index}`} style={styles.taskNoteText}>
                  • {item}
                </Text>
              ))
            ) : (
              <Text style={styles.taskNoteText}>No pause history</Text>
            )}

            <Pressable
              style={styles.modalButton}
              onPress={() => setShowPauseHistory(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getCompletionStatus(task: Task) {
  if (task.completionStatusNote?.trim()) {
    return task.completionStatusNote;
  }

  if (!task.completedAt) {
    return 'Done';
  }

  return 'ON TIME';
}
