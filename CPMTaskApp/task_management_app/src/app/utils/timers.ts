import {
  getTaskDurationMinutes,
  getTimerRemainingSeconds,
  type Task,
  type TimerState,
} from '../domain/model';

export function getTimestampLabel(date = new Date()) {
  return `Paused at ${date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function getResumeTimestampLabel(date = new Date()) {
  return `Resumed at ${date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function getIsoNow() {
  return new Date().toISOString();
}

export function getBreakSeconds(
  timer?: Pick<TimerState, 'totalBreakSeconds' | 'isPaused' | 'pauseStartedAt'>,
  now = Date.now(),
) {
  if (!timer) {
    return 0;
  }

  const storedBreakSeconds = Math.max(0, timer.totalBreakSeconds ?? 0);

  if (!timer.isPaused || !timer.pauseStartedAt) {
    return storedBreakSeconds;
  }

  const pauseStartedAt = new Date(timer.pauseStartedAt).getTime();

  if (Number.isNaN(pauseStartedAt)) {
    return storedBreakSeconds;
  }

  return storedBreakSeconds + Math.max(0, Math.floor((now - pauseStartedAt) / 1000));
}

export function formatBreakDuration(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }

  return `${seconds} sec`;
}

export function createTimerState(
  durationMinutes: number,
  overrides?: Partial<TimerState>,
): TimerState {
  const totalSeconds = Math.max(60, durationMinutes * 60);

  return {
    total: totalSeconds,
    remaining: totalSeconds,
    isPaused: true,
    pauseHistory: [],
    totalBreakSeconds: 0,
    extensionHistory: [],
    ...overrides,
  };
}

export function getCompletionStatusFromTimer(timer?: TimerState) {
  if (!timer) {
    return 'Done';
  }

  const remainingSeconds = getTimerRemainingSeconds(timer);

  if (remainingSeconds > 0) {
    return 'Before time done';
  }

  return timer.extensionHistory.length ? 'Delay' : 'Done';
}

export function getActualTimeSpentSeconds(
  task: Partial<Task>,
  timer?: TimerState,
) {
  if (!timer) {
    return 0;
  }

  const totalAssignedSeconds =
    getTaskDurationOrDefault(task) * 60;

  const remainingSeconds =
    getTimerRemainingSeconds(timer);

  return Math.max(
    0,
    totalAssignedSeconds - remainingSeconds,
  );
}

export function getTaskDurationOrDefault(task: Partial<Task>, fallbackMinutes = 60) {
  return getTaskDurationMinutes(task) || fallbackMinutes;
}
