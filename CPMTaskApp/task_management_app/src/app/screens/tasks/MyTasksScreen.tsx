import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionButton,
  BottomNav,
  EmptyState,
  GradientSurface,
  ScreenHeader,
  TaskCard,
} from '../../components';
import {
  getTaskRemainingSeconds,
} from '../../domain/model';
import { styles } from '../../theme/styles';
import type { ScreenRendererProps } from '../types';

const TASKS_PER_PAGE = 10;

type MyTasksScreenProps = Pick<
  ScreenRendererProps,
  | 'goBack'
  | 'taskTab'
  | 'setTaskTab'
  | 'currentTaskList'
  | 'renderDashboardNavItem'
  | 'getUserName'
  | 'isTasksLoading'
  | 'taskActionError'
  | 'timers'
  | 'handleAcceptTask'
  | 'handleStartTask'
  | 'handleRejectTask'
  | 'handleCompleteTask'
  | 'handleTogglePause'
  | 'handleAddMoreTime'
  | 'handleSubmitForReview'
>;

export function MyTasksScreen(props: MyTasksScreenProps) {
  const {
    goBack,
    taskTab,
    setTaskTab,
    currentTaskList,
    renderDashboardNavItem,
    getUserName,
    isTasksLoading,
    taskActionError,
    timers,
    handleAcceptTask,
    handleStartTask,
    handleRejectTask,
    handleCompleteTask,
    handleTogglePause,
    handleAddMoreTime,
    handleSubmitForReview,
  } = props;
  const [confirmModal, setConfirmModal] = useState<{
    type: 'done';
    taskId: string;
    title: string;
    message: string;
  } | null>(null);
  const [reasonModal, setReasonModal] = useState<{
    type: 'review' | 'reject';
    taskId: string;
  } | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [timeoutTaskId, setTimeoutTaskId] = useState<string | null>(null);
  const [showMoreTimeInput, setShowMoreTimeInput] = useState(false);
  const [customMoreTime, setCustomMoreTime] = useState('');
  const [moreTimeReason, setMoreTimeReason] = useState('');
  const [moreTimeError, setMoreTimeError] = useState('');
  const [moreTimeUnit, setMoreTimeUnit] = useState<'min' | 'hr'>('min');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskPage, setTaskPage] = useState(1);
  const lastTimedOutTaskIdRef = useRef<string | null>(null);
  const myTaskTabs = [
    { key: 'active' as const, label: 'Active' },
    { key: 'incoming' as const, label: 'Pending' },
    { key: 'review' as const, label: 'Review' },
    { key: 'complete' as const, label: 'Complete' },
  ];
  const visibleTasks = currentTaskList();
  const normalizedSearchQuery = taskSearchQuery.trim().toLowerCase();
  const filteredTasks = normalizedSearchQuery
    ? visibleTasks.filter(task => {
        const searchableText = [
          task.title,
          task.description,
          task.dueDate,
          task.dueTime,
          task.status,
          task.reviewComment,
          task.feedback,
          getUserName(task.assignedBy),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
      })
    : visibleTasks;
  const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const currentTaskPage = Math.min(taskPage, totalTaskPages);
  const paginatedTasks = filteredTasks.slice(
    (currentTaskPage - 1) * TASKS_PER_PAGE,
    currentTaskPage * TASKS_PER_PAGE,
  );
  const timedOutTask = useMemo(
    () =>
      visibleTasks.find(task => {
        if (task.status !== 'in_progress') {
          return false;
        }

        const isPaused = timers[task.id]?.isPaused ?? task.isPaused ?? false;
        const remaining = getTaskRemainingSeconds(task, timers[task.id]);

        return !isPaused && remaining === 0;
      }) ?? null,
    [timers, visibleTasks],
  );

  const closeConfirmModal = () => setConfirmModal(null);
  const closeReasonModal = () => {
    setReasonModal(null);
    setSelectedReason('');
    setCustomReason('');
    setReasonError('');
    setShowReasonPicker(false);
  };

  const reviewReasons = [
    'Need more task details',
    'Deadline needs discussion',
    'Need assignee clarification',
    'Other',
  ];
  const rejectReasons = [
    'Workload conflict',
    'Deadline not possible',
    'Not relevant to my work',
    'Other',
  ];

  useEffect(() => {
    setTaskSearchQuery('');
    setTaskPage(1);
  }, [taskTab]);

  useEffect(() => {
    setTaskPage(1);
  }, [taskSearchQuery]);

  useEffect(() => {
    if (!timedOutTask) {
      lastTimedOutTaskIdRef.current = null;
      return;
    }

    if (lastTimedOutTaskIdRef.current === timedOutTask.id) {
      return;
    }

    lastTimedOutTaskIdRef.current = timedOutTask.id;
    setTimeoutTaskId(timedOutTask.id);
    setShowMoreTimeInput(false);
    setCustomMoreTime('');
    setMoreTimeReason('');
    setMoreTimeError('');
    setMoreTimeUnit('min');
  }, [timedOutTask]);

  const handleConfirmAction = async () => {
    if (!confirmModal) {
      return;
    }

    await handleCompleteTask(confirmModal.taskId);
    closeConfirmModal();
  };

  const submitReasonAction = async () => {
    if (!reasonModal) {
      return;
    }

    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason.trim();

    if (!reason) {
      setReasonError('Please select a reason.');
      return;
    }

    if (reasonModal.type === 'review') {
      await handleSubmitForReview(reasonModal.taskId, reason);
    } else {
      await handleRejectTask(reasonModal.taskId, reason);
    }

    closeReasonModal();
    setTaskTab('review');
  };

  const openReasonModal = (type: 'review' | 'reject', taskId: string) => {
    setReasonModal({ type, taskId });
    setSelectedReason('');
    setCustomReason('');
    setReasonError('');
    setShowReasonPicker(false);
  };

  const handleTimeoutComplete = async () => {
    if (!timeoutTaskId) {
      return;
    }

    await handleCompleteTask(timeoutTaskId);
    setTimeoutTaskId(null);
    setShowMoreTimeInput(false);
    setCustomMoreTime('');
    setMoreTimeReason('');
    setMoreTimeError('');
    setMoreTimeUnit('min');
  };

  const handleTimeoutMoreTime = async () => {
    if (!timeoutTaskId) {
      return;
    }

    const timeValue = Number(customMoreTime);

    if (!Number.isFinite(timeValue) || timeValue <= 0) {
      setMoreTimeError('Enter valid extra time.');
      return;
    }

    if (!moreTimeReason.trim()) {
      setMoreTimeError('Please add a reason for extra time.');
      return;
    }

    const minutes = moreTimeUnit === 'hr' ? Math.floor(timeValue * 60) : Math.floor(timeValue);

    await handleAddMoreTime(timeoutTaskId, minutes, moreTimeReason);
    setTimeoutTaskId(null);
    setShowMoreTimeInput(false);
    setCustomMoreTime('');
    setMoreTimeReason('');
    setMoreTimeError('');
    setMoreTimeUnit('min');
    lastTimedOutTaskIdRef.current = null;
  };

  const openMoreTimeModal = (taskId: string) => {
    setTimeoutTaskId(taskId);
    setShowMoreTimeInput(true);
    setCustomMoreTime('');
    setMoreTimeReason('');
    setMoreTimeError('');
    setMoreTimeUnit('min');
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.formScroll}>
        <ScreenHeader
          title="My Tasks"
          onBack={goBack}
       
        />
        <ScrollView
          horizontal
          style={styles.myTasksTabScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.myTasksTabScrollContent}>
          <View style={styles.myTasksTabRow}>
            {myTaskTabs.map(tab => (
              <Pressable
                key={tab.key}
                onPress={() => setTaskTab(tab.key)}
                style={[
                  styles.myTasksTabButton,
                  taskTab === tab.key && styles.myTasksTabButtonActive,
                ]}>
                {taskTab === tab.key ? (
                  <GradientSurface style={styles.myTasksTabGradient} />
                ) : null}
                <Text
                  style={[
                    styles.myTasksTabText,
                    taskTab === tab.key && styles.myTasksTabTextActive,
                  ]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <TextInput
          value={taskSearchQuery}
          onChangeText={setTaskSearchQuery}
          placeholder="Search tasks"
          placeholderTextColor="#94A3B8"
          style={styles.taskListSearchInput}
          autoCapitalize="none"
        />
    
        {isTasksLoading ? (
          <EmptyState
            title="Loading tasks"
            subtitle="Pulling the latest task data."
          />
        ) : filteredTasks.length ? (
          <>
            {paginatedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                timer={timers[task.id]}
                getUserName={getUserName}
                onOpen={() => {}}
                disableOpen
                onAccept={async taskId => {
                  await handleAcceptTask(taskId);
                }}
                onReject={taskId => openReasonModal('reject', taskId)}
                onTogglePause={handleTogglePause}
                onNeedMoreTime={openMoreTimeModal}
                onReview={async taskId => {
                  if (task.status === 'pending') {
                    openReasonModal('review', taskId);
                    return;
                  }

                  setConfirmModal({
                    type: 'done',
                    taskId,
                    title: 'Task Done',
                    message: 'Is this task done?',
                  });
                }}
                onViewCompleted={() => {}}
                onStart={taskId => {
                  handleStartTask(taskId);
                  setTaskTab('active');
                }}
              />
            ))}
            {filteredTasks.length > TASKS_PER_PAGE ? (
              <View style={styles.paginationRow}>
                <Pressable
                  onPress={() => setTaskPage(prev => Math.max(1, prev - 1))}
                  disabled={currentTaskPage === 1}
                  style={[
                    styles.paginationButton,
                    currentTaskPage === 1 && styles.paginationButtonDisabled,
                  ]}>
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </Pressable>
                <Text style={styles.paginationText}>
                  Page {currentTaskPage} of {totalTaskPages}
                </Text>
                <Pressable
                  onPress={() => setTaskPage(prev => Math.min(totalTaskPages, prev + 1))}
                  disabled={currentTaskPage === totalTaskPages}
                  style={[
                    styles.paginationButton,
                    currentTaskPage === totalTaskPages && styles.paginationButtonDisabled,
                  ]}>
                  <Text style={styles.paginationButtonText}>Next</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : (
          <EmptyState
            title={taskSearchQuery.trim() ? 'No matching tasks' : 'No tasks yet'}
            subtitle={
              taskSearchQuery.trim()
                ? 'Try a different search term.'
                : 'There are no tasks in this tab right now.'
            }
          />
        )}
        {taskActionError ? <Text style={styles.formErrorText}>{taskActionError}</Text> : null}
            <Text style={styles.taskListMetaText}>
          Showing {paginatedTasks.length} of {filteredTasks.length} tasks
        </Text>

      </ScrollView>

      <BottomNav activeTab="tasks" renderItem={renderDashboardNavItem} />

      <Modal
        animationType="fade"
        transparent
        visible={!!confirmModal}
        onRequestClose={closeConfirmModal}>
        <Pressable style={styles.modalOverlayCenter} onPress={closeConfirmModal}>
          <Pressable style={styles.pickerModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{confirmModal?.title}</Text>
            <Text style={styles.modalText}>{confirmModal?.message}</Text>
            <View style={styles.rowGap}>
              <ActionButton
                title="No"
                onPress={closeConfirmModal}
                variant="secondary"
                narrow
              />
              <ActionButton
                title="Yes"
                onPress={handleConfirmAction}
                variant="primary"
                narrow
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={!!reasonModal}
        onRequestClose={closeReasonModal}>
        <Pressable style={styles.modalOverlayCenter} onPress={closeReasonModal}>
          <Pressable style={styles.pickerModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {reasonModal?.type === 'review' ? 'Send For Review' : 'Reject Task'}
            </Text>
            <Text style={styles.modalText}>
              {reasonModal?.type === 'review'
                ? 'Select a reason for review.'
                : 'Select a reason for rejection.'}
            </Text>

            <Pressable
              onPress={() => setShowReasonPicker(prev => !prev)}
              style={styles.selectField}>
              <Text style={styles.selectFieldText}>
                {selectedReason || 'Select reason'}
              </Text>
              <Text style={styles.selectFieldArrow}>⌄</Text>
            </Pressable>

            {showReasonPicker ? (
              <View style={styles.assignDropdownWrap}>
                {(reasonModal?.type === 'review' ? reviewReasons : rejectReasons).map(reason => (
                  <Pressable
                    key={reason}
                    onPress={() => {
                      setSelectedReason(reason);
                      setReasonError('');
                      setShowReasonPicker(false);
                    }}
                    style={[
                      styles.assignDropdownItem,
                      selectedReason === reason && styles.assignDropdownItemActive,
                    ]}>
                    {selectedReason === reason ? (
                      <GradientSurface style={styles.assignDropdownGradient} />
                    ) : null}
                    <View style={styles.flexOne}>
                      <Text
                        style={[
                          styles.assignDropdownName,
                          selectedReason === reason && styles.assignDropdownNameActive,
                        ]}>
                        {reason}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {selectedReason === 'Other' ? (
              <TextInput
                value={customReason}
                onChangeText={value => {
                  setCustomReason(value);
                  setReasonError('');
                }}
                placeholder="Write reason"
                placeholderTextColor="#94A3B8"
                style={[styles.inputNoMargin, styles.textArea]}
                multiline
              />
            ) : null}

            {reasonError ? (
              <Text style={styles.inlineFieldError}>{reasonError}</Text>
            ) : null}

            <View style={styles.rowGap}>
              <ActionButton
                title="Back"
                onPress={closeReasonModal}
                variant="secondary"
                narrow
              />
              <ActionButton
                title={reasonModal?.type === 'review' ? 'Send' : 'Reject'}
                onPress={submitReasonAction}
                variant={reasonModal?.type === 'review' ? 'primary' : 'danger'}
                narrow
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    <Modal
  animationType="fade"
  transparent
  visible={!!timeoutTaskId && showMoreTimeInput}
  onRequestClose={() => setShowMoreTimeInput(false)}
>
  <Pressable
    style={styles.modalOverlayCenter}
    onPress={() => setShowMoreTimeInput(false)}
  >
    <Pressable style={styles.pickerModalCard} onPress={() => {}}>
      <Text style={styles.modalTitle}>Add Extra Time</Text>
      <Text style={styles.modalText}>
        Enter more time and start timer again.
      </Text>

    <View style={styles.rowGap}>
  <View style={styles.flexOne}>
    <TextInput
      value={customMoreTime}
      onChangeText={setCustomMoreTime}
      placeholder="Enter time"
      placeholderTextColor="#94A3B8"
      keyboardType="number-pad"
      style={styles.inputNoMargin}
    />
  </View>

  <View style={styles.durationTabContainer}>
    {(['min', 'hr'] as const).map(unit => {
      const active = moreTimeUnit === unit;

      return (
        <Pressable
          key={unit}
          onPress={() => setMoreTimeUnit(unit)}
          style={[
            styles.durationTab,
            active && styles.durationTabActive,
          ]}
        >
          {active ? (
            <GradientSurface
              style={styles.durationTabGradient}
            />
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

 

      <TextInput
        value={moreTimeReason}
        onChangeText={value => {
          setMoreTimeReason(value);
          setMoreTimeError('');
        }}
        placeholder="Reason for extra time"
        placeholderTextColor="#94A3B8"
        style={[styles.inputNoMargin, styles.textArea]}
        multiline
      />

      {moreTimeError ? (
        <Text style={styles.inlineFieldError}>
          {moreTimeError}
        </Text>
      ) : null}

      <View style={styles.rowGap}>
        <ActionButton
          title="Back"
          onPress={() => setShowMoreTimeInput(false)}
          variant="secondary"
          narrow
        />

        <ActionButton
          title="Start"
          onPress={handleTimeoutMoreTime}
          variant="primary"
          narrow
        />
      </View>
    </Pressable>
  </Pressable>
</Modal>

      <Modal
        animationType="fade"
        transparent
        visible={!!timeoutTaskId && !showMoreTimeInput}
        onRequestClose={() => setTimeoutTaskId(null)}>
        <Pressable style={styles.modalOverlayCenter} onPress={() => setTimeoutTaskId(null)}>
          <Pressable style={styles.pickerModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Time Complete</Text>
            <Text style={styles.modalText}>Is task done?</Text>
            <View style={styles.rowGap}>
              <ActionButton
                title="Yes"
                onPress={handleTimeoutComplete}
                variant="primary"
                narrow
              />
              <ActionButton
                title="More Time"
                onPress={() => {
                  setShowMoreTimeInput(true);
                  setMoreTimeError('');
                }}
                variant="secondary"
                narrow
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
