import React, { useEffect, useRef, useState } from 'react';
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
  FieldLabel,
  FormCard,
  GradientSurface,
  InfoRow,
  ScreenHeader,
} from '../../components';

import {
  COLORS,
  formatTaskDueDateTime,
  formatTime,
  getTaskDurationLabel,
  getTaskRemainingSeconds,
} from '../../domain/model';
import { formatBreakDuration, getBreakSeconds } from '../../utils/timers';

import { styles } from '../../theme/styles';

import type { ScreenRendererProps } from '../types';

type ActiveTaskScreenProps = Pick<
  ScreenRendererProps,
  | 'selectedTask'
  | 'goBack'
  | 'progressNotes'
  | 'setProgressNotes'
  | 'navigateTo'
  | 'timers'
  | 'handleTogglePause'
  | 'handleCompleteTask'
  | 'handleAddMoreTime'
>;

export function ActiveTaskScreen(props: ActiveTaskScreenProps) {
  const {
    selectedTask,
    goBack,
    progressNotes,
    setProgressNotes,
    navigateTo,
    timers,
    handleTogglePause,
    handleCompleteTask,
    handleAddMoreTime,
  } = props;

  const [clockTick, setClockTick] = useState(() => Date.now());
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showMoreTimeInput, setShowMoreTimeInput] = useState(false);
  const [customMoreTime, setCustomMoreTime] = useState('');
  const [moreTimeReason, setMoreTimeReason] = useState('');
  const [moreTimeError, setMoreTimeError] = useState('');
  const [moreTimeUnit, setMoreTimeUnit] = useState<'min' | 'hr'>('min');
  const [showMoreTimeUnitPicker, setShowMoreTimeUnitPicker] = useState(false);
  const hasAlertedForTimeoutRef = useRef(false);

  const timer = selectedTask ? timers[selectedTask.id] : undefined;
  const timeRemaining = selectedTask
    ? getTaskRemainingSeconds(selectedTask, timer, new Date(clockTick))
    : 0;
  const isPaused = timer?.isPaused ?? selectedTask?.isPaused ?? false;
  const pauseHistory = timer?.pauseHistory ?? selectedTask?.pauseHistory ?? [];
  const pauseCount = pauseHistory.filter(entry => entry.startsWith('Paused at')).length;
  const totalBreakSeconds = getBreakSeconds(
    timer ?? {
      isPaused,
      totalBreakSeconds: selectedTask?.totalBreakSeconds ?? 0,
      pauseStartedAt: selectedTask?.pauseStartedAt,
    },
    clockTick,
  );
  const extensionHistory = timer?.extensionHistory ?? selectedTask?.extensionHistory ?? [];
  const assignedTime = selectedTask ? getTaskDurationLabel(selectedTask) || '--' : '--';
  const selectedTaskId = selectedTask?.id;
  const isTimeComplete =
    selectedTask?.status === 'in_progress' && !isPaused && timeRemaining === 0;
  const timerStateLabel =
    timeRemaining === 0 ? 'Time finished' : isPaused ? 'Paused' : 'Running';

  useEffect(() => {
    const intervalId = setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    setShowTimeUpModal(false);
    setShowMoreTimeInput(false);
    setCustomMoreTime('');
    setMoreTimeReason('');
    setMoreTimeError('');
    setMoreTimeUnit('min');
    setShowMoreTimeUnitPicker(false);
    hasAlertedForTimeoutRef.current = false;
  }, [selectedTask, selectedTaskId]);

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    if (isTimeComplete && !hasAlertedForTimeoutRef.current) {
      hasAlertedForTimeoutRef.current = true;
      setShowTimeUpModal(true);
      return;
    }

    if (!isTimeComplete) {
      hasAlertedForTimeoutRef.current = false;
    }
  }, [isTimeComplete, selectedTask]);

  if (!selectedTask) {
    return null;
  }

  const finishTask = async () => {
    await handleCompleteTask(selectedTask.id);
    setShowTimeUpModal(false);
    navigateTo('myTasks', selectedTask.id);
  };

  const addMoreTime = async (minutes: number, reason: string) => {
    await handleAddMoreTime(selectedTask.id, minutes, reason);
    setShowTimeUpModal(false);
    setShowMoreTimeInput(false);
    setCustomMoreTime('');
    setMoreTimeReason('');
    setMoreTimeError('');
    setMoreTimeUnit('min');
    setShowMoreTimeUnitPicker(false);
    hasAlertedForTimeoutRef.current = false;
  };

  const handleCustomMoreTime = async () => {
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
    setMoreTimeError('');
    await addMoreTime(minutes, moreTimeReason);
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.formScroll}>
        <ScreenHeader title="Active Task" onBack={goBack} />

        <View style={styles.heroTimerCard}>
          <GradientSurface style={styles.heroTimerGradient} />

          <Text style={styles.timerHeroLabel}>Time Remaining</Text>
          <Text style={styles.timerHeroValue}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.timerHeroState}>{timerStateLabel}</Text>
        </View>

        <View style={styles.rowGap}>
          <ActionButton
            title={isPaused ? 'Resume' : 'Pause'}
            onPress={() => handleTogglePause(selectedTask.id)}
            variant="secondary"
            narrow
          />
          <ActionButton title="Done" onPress={finishTask} variant="primary" narrow />
        </View>

        <FormCard>
          <Text style={styles.detailsTitle}>{selectedTask.title}</Text>
          <Text style={styles.detailsDesc}>{selectedTask.description}</Text>

          <InfoRow label="Task Date" value={formatTaskDueDateTime(selectedTask)} />
          <InfoRow label="Assigned Time" value={assignedTime} />
          <InfoRow label="Pause Count" value={String(pauseCount)} />
          <InfoRow label="Total Break Taken" value={formatBreakDuration(totalBreakSeconds)} />
          <InfoRow label="Status" value="In Progress" />
        </FormCard>

        {pauseHistory.length ? (
          <FormCard>
            <FieldLabel label="Pause History" />
            {pauseHistory.map((entry, index) => (
              <Text key={`${entry}-${index}`} style={styles.noteText}>
                {entry}
              </Text>
            ))}
          </FormCard>
        ) : null}

        {extensionHistory.length ? (
          <FormCard>
            <FieldLabel label="Extra Time Taken" />
            {extensionHistory.map((entry, index) => (
              <Text key={`${entry}-${index}`} style={styles.noteText}>
                {entry}
              </Text>
            ))}
          </FormCard>
        ) : null}

        <FormCard>
          <FieldLabel label="Progress Notes" />

          <TextInput
            value={progressNotes}
            onChangeText={setProgressNotes}
            placeholder="Add notes about your progress"
            placeholderTextColor={COLORS.textSoft}
            style={[styles.inputNoMargin, styles.textArea]}
            multiline
          />
        </FormCard>

        <ActionButton
          title="Submit for Review"
          onPress={() => navigateTo('reviewTask', selectedTask.id)}
          variant="ghost"
        />
      </ScrollView>

      {showMoreTimeInput ? (
        <View style={styles.inlineMoreTimeOverlay}>
          <FormCard>
            <Text style={styles.modalTitle}>Add Extra Time</Text>
            <Text style={styles.modalText}>Enter more time and start timer again.</Text>
            <View style={styles.rowGap}>
              <View style={styles.flexOne}>
                <TextInput
                  value={customMoreTime}
                  onChangeText={setCustomMoreTime}
                  placeholder="Enter time"
                  placeholderTextColor={COLORS.textSoft}
                  keyboardType="number-pad"
                  style={styles.inputNoMargin}
                />
              </View>
              <View style={styles.flexOne}>
                <Pressable
                  onPress={() => setShowMoreTimeUnitPicker(prev => !prev)}
                  style={styles.selectField}>
                  <Text style={styles.selectFieldText}>{moreTimeUnit}</Text>
                  <Text style={styles.selectFieldArrow}>⌄</Text>
                </Pressable>
              </View>
            </View>
            {showMoreTimeUnitPicker ? (
              <View style={styles.assignDropdownWrap}>
                {(['min', 'hr'] as const).map(unit => (
                  <Pressable
                    key={unit}
                    onPress={() => {
                      setMoreTimeUnit(unit);
                      setShowMoreTimeUnitPicker(false);
                    }}
                    style={[
                      styles.assignDropdownItem,
                      moreTimeUnit === unit && styles.assignDropdownItemActive,
                    ]}>
                    {moreTimeUnit === unit ? (
                      <GradientSurface style={styles.assignDropdownGradient} />
                    ) : null}
                    <View style={styles.flexOne}>
                      <Text
                        style={[
                          styles.assignDropdownName,
                          moreTimeUnit === unit && styles.assignDropdownNameActive,
                        ]}>
                        {unit}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <TextInput
              value={moreTimeReason}
              onChangeText={value => {
                setMoreTimeReason(value);
                setMoreTimeError('');
              }}
              placeholder="Reason for extra time"
              placeholderTextColor={COLORS.textSoft}
              style={[styles.inputNoMargin, styles.textArea]}
              multiline
            />
            {moreTimeError ? (
              <Text style={styles.inlineFieldError}>{moreTimeError}</Text>
            ) : null}
            <View style={styles.rowGap}>
              <ActionButton
                title="Back"
                onPress={() => {
                  setShowMoreTimeInput(false);
                  setShowTimeUpModal(true);
                }}
                variant="secondary"
                narrow
              />
              <ActionButton
                title="Start"
                onPress={handleCustomMoreTime}
                variant="primary"
                narrow
              />
            </View>
          </FormCard>
        </View>
      ) : null}

      <Modal
        animationType="fade"
        transparent
        visible={showTimeUpModal && isTimeComplete && !showMoreTimeInput}
        onRequestClose={() => setShowTimeUpModal(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.pickerModalCard}>
            <Text style={styles.modalTitle}>Time Complete</Text>
            <Text style={styles.modalText}>Is task done?</Text>
            <View style={styles.rowGap}>
              <ActionButton title="Yes" onPress={finishTask} variant="primary" narrow />
              <ActionButton
                title="More Time"
                onPress={() => {
                  setShowTimeUpModal(false);
                  setShowMoreTimeInput(true);
                  setMoreTimeError('');
                }}
                variant="secondary"
                narrow
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
