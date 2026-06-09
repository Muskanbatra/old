export type Screen =
  | 'splash'
  | 'login'
  | 'forgotPassword'
  | 'verifyOtp'
  | 'resetPassword'
  | 'dashboard'
  | 'profile'
  | 'manageUsers'
  | 'userDetails'
  | 'createTask'
  | 'taskDetails'
  | 'incomingTask'
  | 'activeTask'
  | 'reviewTask'
  | 'notifications'
  | 'myTasks'
  | 'editTask';

export type DashboardTab = 'home' | 'tasks' | 'add' | 'profile';
export type TaskTab = 'active' | 'incoming' | 'review' | 'complete';
export type ManageTab = 'create' | 'created' | 'done' | 'review';
export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'under_review'
  | 'rejected';

export type User = {
  id: string;
  name: string;
  email: string;
  telephone?: string;
  role: string;
  backendId?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  durationMinutes?: number;
  priority: Priority;
  status: TaskStatus;
  assignedTo: string;
  assignedBy: string;
  createdAt: string;
  accepted?: boolean;
  reviewComment?: string;
  feedback?: string;
  completedAt?: string;
  isPaused?: boolean;
  pauseHistory?: string[];
  totalBreakSeconds?: number;
  pauseStartedAt?: string;
  extensionHistory?: string[];
  completionStatusNote?: string;
  actualTimeSpentSeconds?: number;
};

export type AppNotification = {
  id: string;
  type:
    | 'task_assigned'
    | 'task_approved'
    | 'task_returned'
    | 'task_completed'
    | 'task_rejected';
  title: string;
  message: string;
  taskId: string;
  targetScreen?: Screen;
  recipientUserId?: string;
  recipientBackendUserId?: string;
  timestamp: string;
  read: boolean;
};

export type TimerState = {
  total: number;
  remaining: number;
  isPaused: boolean;
  pauseHistory: string[];
  totalBreakSeconds: number;
  pauseStartedAt?: string;
  extensionHistory: string[];
  lastResumedAt?: string;
};

export const USERS: User[] = [];

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern landing page with an updated hero section.',
    dueDate: '2026-05-12',
    dueTime: '45 min',
    durationMinutes: 45,
    priority: 'high',
    status: 'in_progress',
    accepted: true,
    isPaused: false,
    assignedTo: 'user1',
    assignedBy: 'user2',
    createdAt: '2026-05-08',
  },
  {
    id: '2',
    title: 'Review API documentation',
    description: 'Review and improve API docs for the next release.',
    dueDate: '2026-05-11',
    dueTime: '20 min',
    durationMinutes: 20,
    priority: 'medium',
    status: 'pending',
    accepted: false,
    assignedTo: 'user1',
    assignedBy: 'user3',
    createdAt: '2026-05-08',
  },
  {
    id: '3',
    title: 'Fix mobile responsive issues',
    description: 'Resolve layout issues on smaller device widths.',
    dueDate: '2026-05-13',
    dueTime: '1 hr',
    durationMinutes: 60,
    priority: 'high',
    status: 'under_review',
    assignedTo: 'user2',
    assignedBy: 'user1',
    createdAt: '2026-05-07',
    reviewComment:
      'I need one more day because the edge cases are larger than expected.',
  },
  {
    id: '4',
    title: 'Write unit tests',
    description: 'Add tests for the auth and task modules.',
    dueDate: '2026-05-14',
    dueTime: '2 hr',
    durationMinutes: 120,
    priority: 'medium',
    status: 'pending',
    accepted: false,
    assignedTo: 'user2',
    assignedBy: 'user1',
    createdAt: '2026-05-08',
  },
  {
    id: '5',
    title: 'Optimize image assets',
    description: 'Compress homepage assets and update export sizes.',
    dueDate: '2026-05-10',
    dueTime: '30 min',
    durationMinutes: 30,
    priority: 'low',
    status: 'completed',
    assignedTo: 'user1',
    assignedBy: 'user2',
    createdAt: '2026-05-06',
    completedAt: '2026-05-10T12:40:00',
    isPaused: true,
    pauseHistory: ['Paused at 11:05 AM'],
    totalBreakSeconds: 0,
    extensionHistory: [],
    completionStatusNote: 'Before time done',
  },
  {
    id: '6',
    title: 'Prepare sprint summary',
    description: 'Share the completed sprint summary with the whole team.',
    dueDate: '2026-05-15',
    dueTime: '40 min',
    durationMinutes: 40,
    priority: 'medium',
    status: 'completed',
    assignedTo: 'user4',
    assignedBy: 'user1',
    createdAt: '2026-05-07',
    completedAt: '2026-05-15T11:40:00',
    isPaused: true,
    pauseHistory: ['Paused at 09:20 AM', 'Paused at 10:15 AM'],
    totalBreakSeconds: 0,
    extensionHistory: ['More time added: 15 min'],
    completionStatusNote: 'Delay',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: "Sarah Chen assigned you 'Design new landing page'.",
    taskId: '1',
    timestamp: '1h ago',
    read: false,
  },
  {
    id: 'n2',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: "Mike Davis assigned you 'Review API documentation'.",
    taskId: '2',
    timestamp: '3h ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'task_approved',
    title: 'Task Approved',
    message: "Your task 'Optimize image assets' was approved.",
    taskId: '5',
    timestamp: '1d ago',
    read: true,
  },
];

export const INITIAL_TIMERS: Record<string, TimerState> = {
  '1': {
    total: 45 * 60,
    remaining: 45 * 60,
    isPaused: false,
    pauseHistory: [],
    totalBreakSeconds: 0,
    extensionHistory: [],
    lastResumedAt: new Date().toISOString(),
  },
};

export const WEEKLY_DATA = [
  { day: 'Mon', completed: 4, assigned: 6 },
  { day: 'Tue', completed: 3, assigned: 4 },
  { day: 'Wed', completed: 6, assigned: 7 },
  { day: 'Thu', completed: 5, assigned: 5 },
  { day: 'Fri', completed: 7, assigned: 8 },
  { day: 'Sat', completed: 2, assigned: 3 },
  { day: 'Sun', completed: 1, assigned: 2 },
];

export const IS_TEST_ENV = !!(
  globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env?.JEST_WORKER_ID;

export const COLORS = {
  bg: '#FFFFFF',
  bgSoft: '#F8FAFC',
  bgTint: '#EEF2FF',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textSoft: '#94A3B8',
  border: '#E2E8F0',
  purple: '#7C3AED',
  indigo: '#4F46E5',
  blue: '#3B82F6',
  deepBlue: '#2563EB',
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  infoBg: '#DBEAFE',
} as const;

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hrs.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function normalizeDueTime(value?: string) {
  if (!value?.trim()) {
    return '23:59';
  }

  const trimmedValue = value.trim();
  const twelveHourMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (twelveHourMatch) {
    const rawHour = Number(twelveHourMatch[1]);
    const minute = twelveHourMatch[2];
    const meridiem = twelveHourMatch[3].toUpperCase();
    const hour = meridiem === 'PM' ? (rawHour % 12) + 12 : rawHour % 12;

    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  return trimmedValue;
}

export function parseDurationMinutes(value?: string) {
  if (!value?.trim()) {
    return 0;
  }

  const trimmedValue = value.trim().toLowerCase();
  const durationMatch = trimmedValue.match(
    /^(\d+)\s*(min|mins|minute|minutes|hr|hrs|hour|hours)$/,
  );

  if (!durationMatch) {
    return 0;
  }

  const amount = Number(durationMatch[1]);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  const unit = durationMatch[2];

  return unit.startsWith('hr') || unit.startsWith('hour')
    ? amount * 60
    : amount;
}

export function formatDurationLabel(minutes: number) {
  if (minutes <= 0) {
    return '';
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hr' : 'hr'}`;
  }

  return `${minutes} min`;
}

export function getTaskDurationMinutes(
  task: Pick<Task, 'dueTime' | 'durationMinutes'>,
) {
  if (task.durationMinutes && task.durationMinutes > 0) {
    return task.durationMinutes;
  }

  return parseDurationMinutes(task.dueTime);
}

export function getTaskDurationLabel(
  task: Pick<Task, 'dueTime' | 'durationMinutes'>,
) {
  if (task.dueTime && parseDurationMinutes(task.dueTime)) {
    return task.dueTime;
  }

  return formatDurationLabel(getTaskDurationMinutes(task));
}

export function getTimerRemainingSeconds(
  timer?: Pick<TimerState, 'remaining' | 'isPaused' | 'lastResumedAt'>,
  now = Date.now(),
) {
  if (!timer) {
    return 0;
  }

  if (timer.isPaused || !timer.lastResumedAt) {
    return Math.max(0, timer.remaining);
  }

  const resumedAt = new Date(timer.lastResumedAt).getTime();

  if (Number.isNaN(resumedAt)) {
    return Math.max(0, timer.remaining);
  }

  const elapsedSeconds = Math.floor((now - resumedAt) / 1000);
  return Math.max(0, timer.remaining - elapsedSeconds);
}

export function getTaskDueDateTime(task: Pick<Task, 'dueDate' | 'dueTime'>) {
  if (parseDurationMinutes(task.dueTime)) {
    return null;
  }

  const dueTime = normalizeDueTime(task.dueTime);
  const dueDateTime = new Date(`${task.dueDate}T${dueTime}:00`);

  return Number.isNaN(dueDateTime.getTime()) ? null : dueDateTime;
}

export function getTaskRemainingSeconds(
  task: Pick<Task, 'dueDate' | 'dueTime' | 'durationMinutes'>,
  timer?: Pick<TimerState, 'remaining' | 'isPaused' | 'lastResumedAt'>,
  now = new Date(),
) {
  if (timer) {
    return getTimerRemainingSeconds(timer, now.getTime());
  }

  const durationMinutes = getTaskDurationMinutes(task);

  if (durationMinutes > 0) {
    return durationMinutes * 60;
  }

  const dueDateTime = getTaskDueDateTime(task);

  if (!dueDateTime) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((dueDateTime.getTime() - now.getTime()) / 1000),
  );
}

export function getTaskElapsedSeconds(
  task: Pick<Task, 'dueDate' | 'dueTime' | 'durationMinutes'>,
  timer?: Pick<TimerState, 'remaining' | 'isPaused' | 'lastResumedAt'>,
  now = new Date(),
) {
  const durationMinutes = getTaskDurationMinutes(task);

  if (durationMinutes <= 0) {
    return 0;
  }

  const totalSeconds = durationMinutes * 60;

  const remainingSeconds = getTaskRemainingSeconds(task, timer, now);

  return Math.max(0, totalSeconds - remainingSeconds);
}

export function formatTaskDueDateTime(task: Pick<Task, 'dueDate' | 'dueTime'>) {
  const durationMinutes = parseDurationMinutes(task.dueTime);

  if (durationMinutes) {
    const dueDate = new Date(`${task.dueDate}T00:00:00`);
    const dateLabel = Number.isNaN(dueDate.getTime())
      ? task.dueDate
      : dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        });

    return `${dateLabel} • ${task.dueTime}`;
  }

  const dueDateTime = getTaskDueDateTime(task);

  if (!dueDateTime) {
    return task.dueDate;
  }

  return dueDateTime.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getNotificationIcon(type: AppNotification['type']) {
  switch (type) {
    case 'task_assigned':
      return '+';
    case 'task_approved':
      return '✓';
    case 'task_returned':
      return '!';
    case 'task_rejected':
      return '×';
    case 'task_completed':
      return '◉';
    default:
      return '•';
  }
}
