import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { TaskCard } from '../components';
import { DashboardNavItem } from '../components/navigation/DashboardNavItem';
import {
  AppNotification,
  DashboardTab,
  formatDurationLabel,
  getTaskDurationMinutes,
  getTaskElapsedSeconds,
  getTimerRemainingSeconds,
  INITIAL_TASKS,
  INITIAL_TIMERS,
  IS_TEST_ENV,
  ManageTab,
  Screen,
  Task,
  TaskTab,
  TimerState,
  USERS,
  User,
} from '../domain/model';
import type {
  CreateUserInput,
  ManageUsersTab,
  UpdateUserInput,
} from '../screens/types';
import {
  initializeFirebaseMessaging,
  type PushNotificationStatus,
} from '../services/firebaseMessaging';
import { apiRequest, getErrorMessage } from '../api/client';
import type { BackendTask, BackendTaskUser, BackendUser } from '../api/types';
import {
  createInAppNotification,
  formatNotificationTimestamp,
  upsertNotification,
} from '../utils/notifications';
import {
  createTimerState,
  getBreakSeconds,
  getCompletionStatusFromTimer,
  getIsoNow,
  getResumeTimestampLabel,
  getTimestampLabel,
} from '../utils/timers';
import { getUserIdentityKey } from '../utils/users';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useTaskManagementApp() {
  const initialAssigneeId = USERS[1]?.id ?? USERS[0]?.id ?? '';
  const [screen, setScreen] = useState<Screen>('login');
  const [_screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [hasFinishedSplash, setHasFinishedSplash] = useState(IS_TEST_ENV);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('home');
  const [taskTab, setTaskTab] = useState<TaskTab>('active');
  const [manageTab, setManageTab] = useState<ManageTab>('create');
  const [manageUsersInitialTab, setManageUsersInitialTab] =
    useState<ManageUsersTab>('add');
  const [progress, setProgress] = useState(0);
  const [_clockTick, setClockTick] = useState(() => Date.now());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>('1');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [liveNotifications, setLiveNotifications] = useState<AppNotification[]>(
    [],
  );
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [pushNotificationStatus, setPushNotificationStatus] =
    useState<PushNotificationStatus>('pending');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [timers, setTimers] =
    useState<Record<string, TimerState>>(INITIAL_TIMERS);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] =
    useState('');
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] =
    useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [taskActionError, setTaskActionError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] =
    useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const taskRefreshInFlightRef = useRef(false);
  const lastTaskRefreshAtRef = useRef(0);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    assignedTo: initialAssigneeId,
  });

  useEffect(() => {
    const loadTimers = async () => {
      const savedTimers = await AsyncStorage.getItem('task_timers');

      if (savedTimers) {
        setTimers(JSON.parse(savedTimers));
      }
    };

    loadTimers();
  }, []);
  useEffect(() => {
    AsyncStorage.setItem('task_timers', JSON.stringify(timers));
  }, [timers]);
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        if (!token) {
          return;
        }

        setAuthToken(token);

        const response = await apiRequest('/auth/valid_user', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const backendUser = response?.data;

        if (!backendUser?._id) {
          return;
        }

        const normalizedUser = normalizeBackendUser(backendUser, users);

        setCurrentUser(normalizedUser);
        setLoginEmail(backendUser.email);
        setScreen('dashboard');
      } catch (error) {
        await AsyncStorage.removeItem('authToken');
      }
    };

    restoreSession();
  }, []);
  useEffect(() => {
    setTimers(previousTimers => {
      let didCreateTimer = false;
      const nextTimers = { ...previousTimers };

      tasks.forEach(task => {
        if (task.status !== 'in_progress' || nextTimers[task.id]) {
          return;
        }

        nextTimers[task.id] = createTimerState(getTaskDurationMinutes(task), {
          isPaused: task.isPaused ?? true,
          pauseHistory: task.pauseHistory ?? [],
          totalBreakSeconds: task.totalBreakSeconds ?? 0,
          pauseStartedAt: task.pauseStartedAt,
          extensionHistory: task.extensionHistory ?? [],
          lastResumedAt: task.isPaused ? undefined : getIsoNow(),
        });
        didCreateTimer = true;
      });

      return didCreateTimer ? nextTimers : previousTimers;
    });
  }, [tasks]);

  const normalizeBackendUser = (
    backendUser: BackendUser,
    sourceUsers: User[],
  ) => {
    const matchedUser = sourceUsers.find(
      user =>
        user.backendId === backendUser._id ||
        user.email.toLowerCase() === backendUser.email.toLowerCase(),
    );

    return {
      id: matchedUser?.id ?? backendUser._id,
      name: backendUser.name?.trim() || matchedUser?.name || backendUser.email,
      email: backendUser.email,
      telephone: backendUser.telephone?.trim() || matchedUser?.telephone || '',
      role: backendUser.role?.trim() || matchedUser?.role || 'Team Member',
      backendId: backendUser._id,
    };
  };

  const mergeUsersWithBackend = (
    sourceUsers: User[],
    backendUsers: BackendUser[],
  ) => {
    const normalizedUsers = backendUsers.reduce<User[]>(
      (collection, backendUser) => {
        const normalizedUser = normalizeBackendUser(backendUser, sourceUsers);
        const identityKey = getUserIdentityKey(normalizedUser);

        if (
          !collection.some(user => getUserIdentityKey(user) === identityKey)
        ) {
          collection.push(normalizedUser);
        }

        return collection;
      },
      [],
    );
    const syncedEmails = new Set(
      normalizedUsers.map(user => user.email.toLowerCase()),
    );
    const syncedBackendIds = new Set(
      normalizedUsers
        .map(user => user.backendId)
        .filter((backendId): backendId is string => Boolean(backendId)),
    );

    const localOnlyUsers = sourceUsers.filter(
      user =>
        !syncedEmails.has(user.email.toLowerCase()) &&
        !(user.backendId && syncedBackendIds.has(user.backendId)),
    );

    return [...normalizedUsers, ...localOnlyUsers];
  };

  const syncUsersFromBackend = (
    backendUsers: BackendUser[],
    options?: { focusUser?: BackendUser | null; replace?: boolean },
  ) => {
    const baseUsers = options?.replace ? [] : users;
    const nextUsers = mergeUsersWithBackend(baseUsers, backendUsers);

    setUsers(nextUsers);

    if (options?.focusUser) {
      const focusedUser =
        nextUsers.find(
          user =>
            user.backendId === options.focusUser?._id ||
            user.email.toLowerCase() === options.focusUser?.email.toLowerCase(),
        ) ?? normalizeBackendUser(options.focusUser, nextUsers);

      setCurrentUser(focusedUser);
      return nextUsers;
    }

    if (currentUser) {
      setCurrentUser(
        nextUsers.find(
          user =>
            user.id === currentUser.id ||
            user.backendId === currentUser.backendId ||
            user.email.toLowerCase() === currentUser.email.toLowerCase(),
        ) ?? currentUser,
      );
    }

    return nextUsers;
  };

  const getBackendUserId = useCallback(
    (userId: string) =>
      users.find(user => user.id === userId)?.backendId ?? userId,
    [users],
  );

  const extractBackendUser = (value: BackendTaskUser) =>
    typeof value === 'string' ? null : value;

  const normalizeBackendTask = (
    backendTask: BackendTask,
    sourceUsers: User[],
    existingTask?: Task,
  ): Task => {
    const assignedToUser = extractBackendUser(backendTask.assignedTo);
    const assignedByUser = extractBackendUser(backendTask.assignedBy);

    const assignedToId =
      assignedToUser?._id ??
      sourceUsers.find(user => user.id === backendTask.assignedTo)?.id ??
      String(backendTask.assignedTo);
    const assignedById =
      assignedByUser?._id ??
      sourceUsers.find(user => user.id === backendTask.assignedBy)?.id ??
      String(backendTask.assignedBy);

    return {
      id: backendTask._id,
      title: backendTask.title,
      description: backendTask.description,
      dueDate: backendTask.dueDate,
      dueTime: backendTask.dueTime ?? '',
      durationMinutes:
        backendTask.durationMinutes ??
        existingTask?.durationMinutes ??
        getTaskDurationMinutes({ dueTime: backendTask.dueTime }),
      priority: existingTask?.priority ?? 'medium',
      status: backendTask.status,
      assignedTo: assignedToId,
      assignedBy: assignedById,
      createdAt: backendTask.createdAt,
      updatedAt: backendTask.updatedAt,
      accepted: backendTask.accepted,
      reviewComment: backendTask.reviewComment,
      feedback: backendTask.feedback,
      completedAt: backendTask.completedAt ?? undefined,
      isPaused: backendTask.isPaused ?? false,
      pauseHistory: backendTask.pauseHistory ?? [],
      totalBreakSeconds:
        backendTask.totalBreakSeconds ?? existingTask?.totalBreakSeconds ?? 0,
      pauseStartedAt:
        backendTask.pauseStartedAt || existingTask?.pauseStartedAt,
      extensionHistory:
        backendTask.extensionHistory ?? existingTask?.extensionHistory ?? [],
      actualTimeSpentSeconds:
        backendTask.actualTimeSpentSeconds ??
        existingTask?.actualTimeSpentSeconds ??
        0,
      completionStatusNote:
        backendTask.completionStatusNote ?? existingTask?.completionStatusNote,
    };
  };

  const fetchAllUsers = async (
    token: string,
    options?: {
      silent?: boolean;
      focusUser?: BackendUser | null;
      replace?: boolean;
    },
  ) => {
    if (!options?.silent) {
      setIsUsersLoading(true);
    }

    try {
      const limit = 100;
      let page = 1;
      let totalPages = 1;
      const backendUsers: BackendUser[] = [];

      do {
        const response = await apiRequest(
          `/auth/get_all_users?limit=${limit}&page=${page}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (Array.isArray(response?.results)) {
          backendUsers.push(...(response.results as BackendUser[]));
        }

        totalPages = Number(response?.totalPages) || 1;
        page += 1;
      } while (page <= totalPages);

      return syncUsersFromBackend(backendUsers, {
        focusUser: options?.focusUser,
        replace: options?.replace,
      });
    } finally {
      if (!options?.silent) {
        setIsUsersLoading(false);
      }
    }
  };

  const fetchRelatedTasks = async (
    token: string,
    options?: { silent?: boolean; sourceUsers?: User[] },
  ) => {
    if (!options?.silent) {
      setIsTasksLoading(true);
    }

    try {
      const response = await apiRequest('/tasks', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const backendTasks = Array.isArray(response?.results)
        ? (response.results as BackendTask[])
        : [];
      const taskUsers = backendTasks.flatMap(task => {
        const assignedToUser = extractBackendUser(task.assignedTo);
        const assignedByUser = extractBackendUser(task.assignedBy);

        return [assignedToUser, assignedByUser].filter(
          (user): user is BackendUser => Boolean(user?._id),
        );
      });

      const nextUsers = taskUsers.length
        ? mergeUsersWithBackend(options?.sourceUsers ?? users, taskUsers)
        : options?.sourceUsers ?? users;
      if (taskUsers.length) {
        setUsers(nextUsers);
      }

      setTasks(previousTasks =>
        backendTasks.map(task =>
          normalizeBackendTask(
            task,
            nextUsers,
            previousTasks.find(previousTask => previousTask.id === task._id),
          ),
        ),
      );
    } finally {
      if (!options?.silent) {
        setIsTasksLoading(false);
      }
    }
  };

  const refreshRelatedTasks = useEffectEvent(
    async (options?: { force?: boolean; silent?: boolean }) => {
      if (!authToken || taskRefreshInFlightRef.current) {
        return;
      }

      const now = Date.now();

      if (!options?.force && now - lastTaskRefreshAtRef.current < 1500) {
        return;
      }

      taskRefreshInFlightRef.current = true;

      try {
        await fetchRelatedTasks(authToken, {
          silent: options?.silent ?? true,
        });
        lastTaskRefreshAtRef.current = Date.now();
      } catch (error) {
        setTaskActionError(getErrorMessage(error));
      } finally {
        taskRefreshInFlightRef.current = false;
      }
    },
  );

  const resetForgotPasswordState = (options?: { keepEmail?: boolean }) => {
    if (!options?.keepEmail) {
      setForgotPasswordEmail('');
    }
    setForgotPasswordOtp('');
    setForgotPasswordNewPassword('');
    setForgotPasswordConfirmPassword('');
    setForgotPasswordError('');
    setForgotPasswordMessage('');
    setIsForgotPasswordSubmitting(false);
  };

  const openForgotPassword = () => {
    resetForgotPasswordState();
    setForgotPasswordEmail(loginEmail.trim());
    changeScreen('forgotPassword');
  };

  const selectedTask = useMemo(
    () => tasks.find(task => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const myTasks = useMemo(
    () =>
      tasks.filter(
        task =>
          task.assignedTo === currentUser?.id ||
          task.assignedTo === currentUser?.backendId,
      ),
    [currentUser?.backendId, currentUser?.id, tasks],
  );

  const assignedByMe = useMemo(
    () =>
      tasks.filter(
        task =>
          task.assignedBy === currentUser?.id ||
          task.assignedBy === currentUser?.backendId,
      ),
    [currentUser?.backendId, currentUser?.id, tasks],
  );

  const manageTasks = useMemo(() => {
    switch (manageTab) {
      case 'create':
        return [];
      case 'created':
        return assignedByMe.filter(task => task.status === 'pending');
      case 'done':
        return assignedByMe.filter(task => task.status === 'completed');
      case 'review':
        return assignedByMe.filter(
          task => task.status === 'under_review' || task.status === 'rejected',
        );
      default:
        return [];
    }
  }, [assignedByMe, manageTab]);

  useEffect(() => {
    if (IS_TEST_ENV) {
      setProgress(100);
      return;
    }

    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 4));
    }, 100);

    const splashTimer = setTimeout(() => {
      setHasFinishedSplash(true);
    }, 2800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(splashTimer);
    };
  }, []);

  useEffect(() => {
    if (IS_TEST_ENV) {
      return;
    }

    const interval = setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (IS_TEST_ENV) {
      return;
    }

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        setClockTick(Date.now());
        refreshRelatedTasks({ force: true });
      }
    });

    return () => subscription.remove();
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !currentUser) {
      return;
    }

    refreshRelatedTasks({ force: true });

    const refreshInterval = setInterval(() => {
      refreshRelatedTasks();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [authToken, currentUser]);

  useEffect(() => {
    if (
      !authToken ||
      !currentUser ||
      !['myTasks', 'createTask', 'notifications'].includes(screen)
    ) {
      return;
    }

    refreshRelatedTasks({ force: true });
  }, [authToken, currentUser?.backendId, currentUser?.id, screen]);

  useEffect(() => {
    if (!authToken || !currentUser || screen !== 'manageUsers') {
      return;
    }

    const refreshManageUsersData = async () => {
      try {
        const syncedUsers = await fetchAllUsers(authToken, {
          replace: true,
        });

        await fetchRelatedTasks(authToken, {
          silent: true,
          sourceUsers: syncedUsers,
        });
      } catch (error) {
        setUserActionError(getErrorMessage(error));
      }
    };

    refreshManageUsersData();
  }, [authToken, currentUser?.backendId, currentUser?.id, screen]);

  const syncDashboardTabForScreen = (targetScreen: Screen) => {
    if (targetScreen === 'dashboard') {
      setDashboardTab('home');
      return;
    }

    if (targetScreen === 'myTasks') {
      setDashboardTab('tasks');
      return;
    }

    if (targetScreen === 'createTask') {
      setDashboardTab('add');
      return;
    }

    if (
      targetScreen === 'profile' ||
      targetScreen === 'manageUsers' ||
      targetScreen === 'userDetails'
    ) {
      setDashboardTab('profile');
    }
  };

  const changeScreen = (
    nextScreen: Screen,
    options?: { replace?: boolean; skipHistory?: boolean },
  ) => {
    if (nextScreen === screen) {
      syncDashboardTabForScreen(nextScreen);
      return;
    }

    if (nextScreen !== 'manageUsers') {
      setManageUsersInitialTab('add');
    }

    if (!options?.skipHistory) {
      setScreenHistory(prev =>
        options?.replace ? [...prev.slice(0, -1), screen] : [...prev, screen],
      );
    }

    syncDashboardTabForScreen(nextScreen);
    setScreen(nextScreen);
  };

  const goBack = () => {
    setScreenHistory(prev => {
      const previousScreen = prev[prev.length - 1];

      if (previousScreen) {
        syncDashboardTabForScreen(previousScreen);
        setScreen(previousScreen);
        return prev.slice(0, -1);
      }

      const fallbackScreen: Screen = currentUser ? 'dashboard' : 'login';
      syncDashboardTabForScreen(fallbackScreen);
      setScreen(fallbackScreen);
      return prev;
    });
  };

  const navigateTo = (nextScreen: Screen, taskId?: string | null) => {
    if (taskId !== undefined) {
      setSelectedTaskId(taskId);
    }

    changeScreen(nextScreen);
  };

  const openUserDetails = (userId: string) => {
    setSelectedUserId(userId);
    changeScreen('userDetails');
  };

  const openManageUsersAssignments = () => {
    setManageUsersInitialTab('assignments');
    changeScreen('manageUsers');
  };

  const getDefaultAssigneeId = (excludeUserId?: string) =>
    users.find(user => user.id !== excludeUserId)?.id ?? users[0]?.id ?? '';

  const getUserName = useCallback(
    (userId: string) =>
      users.find(user => user.id === userId || user.backendId === userId)
        ?.name ?? userId,
    [users],
  );

  const getUserRole = (userId: string) =>
    users.find(user => user.id === userId || user.backendId === userId)?.role ??
    'Team Member';

  const isNotificationForCurrentUser = useCallback(
    (notification: AppNotification) => {
      if (!currentUser) {
        return false;
      }

      const recipientKeys = [
        notification.recipientUserId,
        notification.recipientBackendUserId,
      ].filter((value): value is string => Boolean(value?.trim()));
      const currentUserKeys = [currentUser.id, currentUser.backendId].filter(
        (value): value is string => Boolean(value?.trim()),
      );

      if (recipientKeys.length === 0) {
        const relatedTask = tasks.find(task => task.id === notification.taskId);

        if (!relatedTask) {
          return false;
        }

        const isAssignee =
          relatedTask.assignedTo === currentUser.id ||
          relatedTask.assignedTo === currentUser.backendId;
        const isAssigner =
          relatedTask.assignedBy === currentUser.id ||
          relatedTask.assignedBy === currentUser.backendId;

        if (
          notification.targetScreen === 'reviewTask' ||
          notification.type === 'task_completed'
        ) {
          return isAssigner;
        }

        return isAssignee;
      }

      return recipientKeys.some(recipientKey =>
        currentUserKeys.includes(recipientKey),
      );
    },
    [currentUser, tasks],
  );

  const selectedUser =
    users.find(
      user =>
        user.id === selectedUserId ||
        user.backendId === selectedUserId ||
        user.email.toLowerCase() === selectedUserId?.toLowerCase(),
    ) ?? null;

  const addTaskNotification = (
    type: AppNotification['type'],
    title: string,
    message: string,
    taskId: string,
    options?: {
      recipientUserId?: string;
      recipientBackendUserId?: string;
      targetScreen?: Screen;
    },
  ) => {
    const nextNotification = createInAppNotification(
      type,
      title,
      message,
      taskId,
      options,
    );

    setLiveNotifications(prev => upsertNotification(prev, nextNotification));
  };

  const getNotificationIdentityKey = (notification: AppNotification) =>
    [
      notification.type,
      notification.taskId,
      notification.title.trim().toLowerCase(),
      notification.message.trim().toLowerCase(),
    ].join('|');

  const visibleNotifications = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const currentUserKeys = new Set(
      [currentUser.id, currentUser.backendId].filter((value): value is string =>
        Boolean(value?.trim()),
      ),
    );
    const readIdSet = new Set(readNotificationIds);
    const taskNotifications: AppNotification[] = [];

    tasks.forEach(task => {
      const isAssignee =
        currentUserKeys.has(task.assignedTo) ||
        currentUserKeys.has(getBackendUserId(task.assignedTo));
      const isAssigner =
        currentUserKeys.has(task.assignedBy) ||
        currentUserKeys.has(getBackendUserId(task.assignedBy));

      if (isAssignee) {
        taskNotifications.push({
          id: `task-assigned-${task.id}`,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `${getUserName(task.assignedBy)} assigned '${
            task.title
          }' to you.`,
          taskId: task.id,
          timestamp: formatNotificationTimestamp(task.createdAt),
          read: readIdSet.has(`task-assigned-${task.id}`),
        });

        if (task.feedback?.trim()) {
          taskNotifications.push({
            id: `task-returned-${task.id}-${task.feedback.trim()}`,
            type: 'task_returned',
            title: 'Task Returned',
            message: `${getUserName(task.assignedBy)} returned '${
              task.title
            }' for changes.`,
            taskId: task.id,
            targetScreen: 'activeTask',
            timestamp: formatNotificationTimestamp(task.createdAt),
            read: readIdSet.has(
              `task-returned-${task.id}-${task.feedback.trim()}`,
            ),
          });
        }
      }

      if (isAssigner && task.status === 'under_review') {
        taskNotifications.push({
          id: `task-review-${task.id}-${task.reviewComment ?? ''}`,
          type: 'task_returned',
          title: 'Task Sent For Review',
          message: `${getUserName(task.assignedTo)} sent '${
            task.title
          }' for your review.`,
          taskId: task.id,
          targetScreen: 'reviewTask',
          timestamp: formatNotificationTimestamp(task.createdAt),
          read: readIdSet.has(
            `task-review-${task.id}-${task.reviewComment ?? ''}`,
          ),
        });
      }

      if (isAssigner && task.status === 'rejected') {
        taskNotifications.push({
          id: `task-rejected-${task.id}-${task.reviewComment ?? ''}`,
          type: 'task_rejected',
          title: 'Task Rejected',
          message: `${getUserName(task.assignedTo)} rejected '${task.title}'.`,
          taskId: task.id,
          targetScreen: 'reviewTask',
          timestamp: formatNotificationTimestamp(task.createdAt),
          read: readIdSet.has(
            `task-rejected-${task.id}-${task.reviewComment ?? ''}`,
          ),
        });
      }

      if (isAssigner && task.status === 'completed') {
        taskNotifications.push({
          id: `task-completed-${task.id}-${task.completedAt ?? ''}`,
          type: 'task_completed',
          title: 'Task Completed',
          message: `${getUserName(task.assignedTo)} completed '${task.title}'.`,
          taskId: task.id,
          targetScreen: 'taskDetails',
          timestamp: formatNotificationTimestamp(
            task.completedAt ?? task.createdAt,
          ),
          read: readIdSet.has(
            `task-completed-${task.id}-${task.completedAt ?? ''}`,
          ),
        });
      }
    });

    const seenNotificationKeys = new Set<string>();
    const mergedNotifications = [...liveNotifications, ...taskNotifications]
      .filter(isNotificationForCurrentUser)
      .reduce<AppNotification[]>((collection, notification) => {
        const notificationKey = getNotificationIdentityKey(notification);

        if (
          collection.some(item => item.id === notification.id) ||
          seenNotificationKeys.has(notificationKey)
        ) {
          return collection;
        }

        seenNotificationKeys.add(notificationKey);
        collection.push({
          ...notification,
          read: readIdSet.has(notification.id) || notification.read,
        });
        return collection;
      }, []);

    return mergedNotifications.sort((left, right) => {
      const leftTask =
        tasks.find(task => task.id === left.taskId)?.completedAt ||
        tasks.find(task => task.id === left.taskId)?.createdAt ||
        '';
      const rightTask =
        tasks.find(task => task.id === right.taskId)?.completedAt ||
        tasks.find(task => task.id === right.taskId)?.createdAt ||
        '';

      return new Date(rightTask).getTime() - new Date(leftTask).getTime();
    });
  }, [
    currentUser,
    getBackendUserId,
    getUserName,
    isNotificationForCurrentUser,
    liveNotifications,
    readNotificationIds,
    tasks,
  ]);

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      assignedTo: getDefaultAssigneeId(currentUser?.id),
    });
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Enter both email and password to continue.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');
    setUserActionError('');
    setTaskActionError('');

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const token = response?.jwt?.token;
      const backendUser = response?.data as BackendUser | undefined;

      if (!token || !backendUser?._id) {
        throw new Error('Login succeeded but user details were incomplete.');
      }

      await AsyncStorage.setItem('authToken', token);
      setAuthToken(token);

      const nextUsers = syncUsersFromBackend([backendUser], {
        focusUser: backendUser,
      });

      setCurrentUser(
        nextUsers.find(
          user =>
            user.backendId === backendUser._id ||
            user.email.toLowerCase() === backendUser.email.toLowerCase(),
        ) ?? normalizeBackendUser(backendUser, nextUsers),
      );
      setLoginEmail(backendUser.email);
      setLoginPassword('');
      setDashboardTab('home');
      setTaskTab('active');
      setManageTab('create');
      setScreenHistory([]);
      setScreen('dashboard');

      let syncedUsers = nextUsers;

      try {
        syncedUsers =
          (await fetchAllUsers(token, {
            silent: true,
            focusUser: backendUser,
          })) ?? nextUsers;
      } catch (error) {
        setUserActionError(getErrorMessage(error));
      }

      try {
        await fetchRelatedTasks(token, {
          silent: true,
          sourceUsers: syncedUsers,
        });
      } catch (error) {
        setTaskActionError(getErrorMessage(error));
      }
    } catch (error) {
      setLoginError(getErrorMessage(error));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Enter your email to receive the OTP.');
      setForgotPasswordMessage('');
      return;
    }

    setIsForgotPasswordSubmitting(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      const response = await apiRequest('/auth/forgot_password', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotPasswordEmail.trim(),
        }),
      });

      setForgotPasswordEmail(forgotPasswordEmail.trim());
      setForgotPasswordMessage(response?.message ?? 'OTP sent successfully.');
      changeScreen('verifyOtp');
    } catch (error) {
      setForgotPasswordError(getErrorMessage(error));
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  const handleVerifyForgotPasswordOtp = async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Enter your email first.');
      setForgotPasswordMessage('');
      changeScreen('forgotPassword');
      return;
    }

    if (!forgotPasswordOtp.trim()) {
      setForgotPasswordError('Enter the OTP sent to your email.');
      setForgotPasswordMessage('');
      return;
    }

    setIsForgotPasswordSubmitting(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      const response = await apiRequest('/auth/verify_otp', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotPasswordEmail.trim(),
          otp: forgotPasswordOtp.trim(),
        }),
      });

      setForgotPasswordMessage(
        response?.message ?? 'OTP verified successfully.',
      );
      changeScreen('resetPassword');
    } catch (error) {
      setForgotPasswordError(getErrorMessage(error));
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Enter your email first.');
      setForgotPasswordMessage('');
      changeScreen('forgotPassword');
      return;
    }

    if (!forgotPasswordNewPassword || !forgotPasswordConfirmPassword) {
      setForgotPasswordError('Enter and confirm your new password.');
      setForgotPasswordMessage('');
      return;
    }

    if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      setForgotPasswordError('Passwords do not match.');
      setForgotPasswordMessage('');
      return;
    }

    setIsForgotPasswordSubmitting(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      await apiRequest('/auth/reset_password', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotPasswordEmail.trim(),
          newPassword: forgotPasswordNewPassword,
        }),
      });

      setLoginEmail(forgotPasswordEmail.trim());
      setLoginPassword('');
      resetForgotPasswordState();
      showTimedSuccess('Password updated successfully.', 'login');
    } catch (error) {
      setForgotPasswordError(getErrorMessage(error));
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');

    setAuthToken(null);
    setCurrentUser(null);
    setSelectedUserId(null);
    setLoginError('');
    resetForgotPasswordState();
    setUserActionError('');
    setTaskActionError('');
    setDashboardTab('home');
    setTaskTab('active');
    setManageTab('create');
    setScreenHistory([]);
    setScreen('login');
  };

  const showTimedSuccess = (message: string, nextScreen?: Screen) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);

    setTimeout(() => {
      setShowSuccessModal(false);

      if (nextScreen) {
        changeScreen(nextScreen);
      }
    }, 1600);
  };

  const handleCreateUser = async (user: CreateUserInput) => {
    if (!authToken) {
      setUserActionError('Sign in again before managing users.');
      return false;
    }

    setIsSavingUser(true);
    setUserActionError('');

    try {
      await apiRequest('/auth/create_account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: user.name.trim(),
          email: user.email.trim(),
          telephone: user.telephone.trim(),
          role: user.role.trim(),
          password: user.password,
        }),
      });

      await fetchAllUsers(authToken, { replace: true });
      showTimedSuccess('User added successfully.', 'manageUsers');
      return true;
    } catch (error) {
      setUserActionError(getErrorMessage(error));
      return false;
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateUser = async (userId: string, user: UpdateUserInput) => {
    if (!authToken) {
      setUserActionError('Sign in again before managing users.');
      return false;
    }

    setIsSavingUser(true);
    setUserActionError('');

    try {
      await apiRequest(`/auth/update_profile/${getBackendUserId(userId)}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: user.name.trim(),
          email: user.email.trim(),
          telephone: user.telephone.trim(),
          role: user.role.trim(),
        }),
      });

      await fetchAllUsers(authToken, { replace: true });
      showTimedSuccess('User updated successfully.', 'manageUsers');
      return true;
    } catch (error) {
      setUserActionError(getErrorMessage(error));
      return false;
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      showTimedSuccess('You cannot delete the logged in user.', 'manageUsers');
      return false;
    }

    if (!authToken) {
      setUserActionError('Sign in again before managing users.');
      return false;
    }

    setIsSavingUser(true);
    setUserActionError('');

    try {
      const userToDelete = users.find(user => user.id === userId) ?? null;
      const backendUserId = userToDelete?.backendId;

      if (backendUserId) {
        await apiRequest(`/auth/delete_account/${backendUserId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        await fetchAllUsers(authToken, { replace: true });
      } else {
        setUsers(prev => prev.filter(user => user.id !== userId));
      }

      if (
        selectedUserId === userId ||
        userToDelete?.backendId === selectedUserId
      ) {
        setSelectedUserId(null);
      }

      const remainingUsers = users.filter(user => user.id !== userId);
      const replacementUserId =
        remainingUsers.find(user => user.id === currentUser?.id)?.id ??
        remainingUsers[0]?.id ??
        '';

      setTasks(prev =>
        prev.map(task => ({
          ...task,
          assignedTo:
            task.assignedTo === userId ? replacementUserId : task.assignedTo,
          assignedBy:
            task.assignedBy === userId ? replacementUserId : task.assignedBy,
        })),
      );

      setTaskForm(prev => {
        if (prev.assignedTo !== userId) {
          return prev;
        }

        return {
          ...prev,
          assignedTo:
            remainingUsers.find(user => user.id !== currentUser?.id)?.id ??
            remainingUsers[0]?.id ??
            '',
        };
      });
      showTimedSuccess('User deleted successfully.', 'manageUsers');
      return true;
    } catch (error) {
      setUserActionError(getErrorMessage(error));
      return false;
    } finally {
      setIsSavingUser(false);
    }
  };

  const handlePersistTask = async (mode: 'create' | 'edit') => {
    if (!authToken || !currentUser) {
      setTaskActionError('Sign in again before managing tasks.');
      return;
    }

    if (
      !taskForm.title.trim() ||
      !taskForm.dueDate.trim() ||
      // !taskForm.dueTime.trim() ||
      !taskForm.assignedTo.trim()
    ) {
      setTaskActionError('Fill in the task title, due date and assignee.');
      return;
    }

    if (mode === 'edit' && !selectedTask) {
      setTaskActionError('Select a task to edit.');
      return;
    }

    setIsSavingTask(true);
    setTaskActionError('');

    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || '',
        dueDate: taskForm.dueDate.trim(),
        dueTime: taskForm.dueTime?.trim() || '',
        assignedTo: getBackendUserId(taskForm.assignedTo),
      };
      let createdTaskId = selectedTask?.id ?? '';
      const assignmentPayload =
        mode === 'edit'
          ? {
              ...payload,
              status: 'pending',
              accepted: false,
              reviewComment: '',
              feedback: '',
              completedAt: '',
              isPaused: true,
              pauseHistory: [],
              totalBreakSeconds: 0,
              pauseStartedAt: '',
              extensionHistory: [],
              completionStatusNote: '',
            }
          : payload;

      if (mode === 'create') {
        const response = await apiRequest('/tasks', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        });
        createdTaskId =
          response?.data?._id ??
          response?.result?._id ??
          response?.results?._id ??
          '';
      } else {
        await apiRequest(`/tasks/${selectedTask?.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(assignmentPayload),
        });
      }

      await fetchRelatedTasks(authToken);

      if (mode === 'edit' && selectedTask) {
        setTimers(prev => ({
          ...prev,
          [selectedTask.id]: createTimerState(getTaskDurationMinutes(payload)),
        }));
      }

      if (mode === 'create' || mode === 'edit') {
        addTaskNotification(
          'task_assigned',
          'New Task Assigned',
          `${currentUser?.name ?? 'Someone'} assigned '${
            payload.title
          }' to you.`,
          createdTaskId || 'unknown-task',
          {
            recipientUserId: taskForm.assignedTo,
            recipientBackendUserId: getBackendUserId(taskForm.assignedTo),
            targetScreen: 'incomingTask',
          },
        );
      }

      resetTaskForm();
      if (mode === 'edit') {
        setManageTab('review');
      }
      showTimedSuccess(
        mode === 'create'
          ? 'Task created successfully.'
          : 'Task assigned successfully.',
        mode === 'edit' ? 'createTask' : undefined,
      );
    } catch (error) {
      setTaskActionError(getErrorMessage(error));
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleCreateTask = () => {
    return handlePersistTask('create');
  };

  const handleReassignTask = async (taskId: string) => {
    const task = tasks.find(item => item.id === taskId);

    if (!task) {
      setTaskActionError('Task not found.');
      return;
    }

    setTimers(prev => ({
      ...prev,
      [taskId]: createTimerState(getTaskDurationMinutes(task)),
    }));

    const didAssign = await persistTaskMutation(
      taskId,
      {
        status: 'pending',
        accepted: false,
        reviewComment: '',
        feedback: '',
        completedAt: '',
        isPaused: true,
        pauseHistory: [],
        totalBreakSeconds: 0,
        pauseStartedAt: '',
        extensionHistory: [],
        completionStatusNote: '',
      },
      { successMessage: 'Task assigned successfully.', refreshTasks: true },
    );

    if (!didAssign) {
      return;
    }

    addTaskNotification(
      'task_assigned',
      'New Task Assigned',
      `${currentUser?.name ?? 'Someone'} assigned '${task.title}' to you.`,
      taskId,
      {
        recipientUserId: task.assignedTo,
        recipientBackendUserId: getBackendUserId(task.assignedTo),
        targetScreen: 'incomingTask',
      },
    );
  };

  const persistTaskMutation = async (
    taskId: string,
    changes: Partial<Task>,
    options?: {
      successMessage?: string;
      nextScreen?: Screen;
      refreshTasks?: boolean;
    },
  ) => {
    if (!authToken) {
      setTaskActionError('Sign in again before updating tasks.');
      return false;
    }

    const existingTask = tasks.find(task => task.id === taskId);

    if (!existingTask) {
      setTaskActionError('Task not found.');
      return false;
    }

    setIsSavingTask(true);
    setTaskActionError('');

    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: changes.title ?? existingTask.title,
          description: changes.description ?? existingTask.description,
          dueDate: changes.dueDate ?? existingTask.dueDate,
          dueTime: changes.dueTime ?? existingTask.dueTime ?? '',
          actualTimeSpentSeconds:
            changes.actualTimeSpentSeconds ??
            existingTask.actualTimeSpentSeconds ??
            0,

          assignedTo: getBackendUserId(
            changes.assignedTo ?? existingTask.assignedTo,
          ),
          status: changes.status ?? existingTask.status,
          accepted: changes.accepted ?? existingTask.accepted ?? false,
          reviewComment:
            changes.reviewComment ?? existingTask.reviewComment ?? '',
          feedback: changes.feedback ?? existingTask.feedback ?? '',
          completedAt: changes.completedAt ?? existingTask.completedAt ?? '',
          isPaused: changes.isPaused ?? existingTask.isPaused ?? false,
          pauseHistory: changes.pauseHistory ?? existingTask.pauseHistory ?? [],
          totalBreakSeconds:
            changes.totalBreakSeconds ?? existingTask.totalBreakSeconds ?? 0,
          pauseStartedAt:
            changes.pauseStartedAt ?? existingTask.pauseStartedAt ?? '',
          extensionHistory:
            changes.extensionHistory ?? existingTask.extensionHistory ?? [],
          completionStatusNote:
            changes.completionStatusNote ??
            existingTask.completionStatusNote ??
            '',
        }),
      });

      await fetchRelatedTasks(authToken, { silent: !options?.refreshTasks });

      if (options?.successMessage) {
        showTimedSuccess(
          options.successMessage,
          options.nextScreen ?? 'dashboard',
        );
      }

      return true;
    } catch (error) {
      setTaskActionError(getErrorMessage(error));
      return false;
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    await persistTaskMutation(taskId, { accepted: true });
  };

  const handleStartTask = async (taskId: string) => {
    const currentTask = tasks.find(task => task.id === taskId);
    const durationMinutes = getTaskDurationMinutes(currentTask ?? {});
    const previousActiveTaskIds = tasks
      .filter(
        task =>
          task.id !== taskId &&
          task.assignedTo === currentUser?.id &&
          task.status === 'in_progress',
      )
      .map(task => task.id);

    setTimers(prev => ({
      ...prev,
      ...Object.fromEntries(
        previousActiveTaskIds.map(id => {
          const previousTask = tasks.find(task => task.id === id);
          const timer =
            prev[id] ??
            createTimerState(getTaskDurationMinutes(previousTask ?? {}), {
              isPaused: false,
            });
          const remaining = getTimerRemainingSeconds(timer);
          const pausedAt = getIsoNow();
          const nextPauseHistory = [
            ...timer.pauseHistory,
            getTimestampLabel(new Date(pausedAt)),
          ];

          return [
            id,
            {
              ...timer,
              remaining,
              isPaused: true,
              lastResumedAt: undefined,
              pauseStartedAt: pausedAt,
              pauseHistory: nextPauseHistory,
            },
          ];
        }),
      ),
      [taskId]: {
        ...(prev[taskId] ??
          createTimerState(durationMinutes, {
            startedAt: getIsoNow(),

            // allow unlimited timer
            remaining:
              durationMinutes != null && durationMinutes > 0
                ? durationMinutes * 60
                : undefined,
          })),

        isPaused: false,

        startedAt: prev[taskId]?.startedAt ?? getIsoNow(),

        lastResumedAt: getIsoNow(),

        pauseStartedAt: undefined,
      },
    }));
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status: 'in_progress',
            accepted: true,
            isPaused: false,
            durationMinutes: durationMinutes || task.durationMinutes,
            completionStatusNote: undefined,
          };
        }

        if (previousActiveTaskIds.includes(task.id)) {
          const timer = timers[task.id];
          const pausedAt = getIsoNow();
          const nextPauseHistory = [
            ...(timer?.pauseHistory ?? task.pauseHistory ?? []),
            getTimestampLabel(new Date(pausedAt)),
          ];

          return {
            ...task,
            isPaused: true,
            pauseHistory: nextPauseHistory,
            pauseStartedAt: pausedAt,
          };
        }

        return task;
      }),
    );

    await Promise.all([
      persistTaskMutation(taskId, {
        status: 'in_progress',
        accepted: true,
        isPaused: false,
        durationMinutes: durationMinutes || undefined,
        completionStatusNote: '',
      }),
      ...previousActiveTaskIds.map(id =>
        persistTaskMutation(id, {
          status: 'in_progress',
          accepted: true,
          isPaused: true,
          pauseHistory: [
            ...(timers[id]?.pauseHistory ?? []),
            getTimestampLabel(),
          ],
          pauseStartedAt: getIsoNow(),
        }),
      ),
    ]);
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(item => item.id === taskId);
    const completionTime = Date.now();
    const completionIso = new Date(completionTime).toISOString();
    const currentTimer =
      timers[taskId] ??
      createTimerState(getTaskDurationMinutes(task ?? {}), {
        isPaused: task?.isPaused ?? false,
        pauseHistory: task?.pauseHistory ?? [],
        totalBreakSeconds: task?.totalBreakSeconds ?? 0,
        pauseStartedAt: task?.pauseStartedAt,
        extensionHistory: task?.extensionHistory ?? [],
      });
    const completionStatusNote = getCompletionStatusFromTimer(currentTimer);
    const totalBreakSeconds = getBreakSeconds(currentTimer, completionTime);
    const dueSeconds = currentTimer.total;
    const remainingSeconds = getTimerRemainingSeconds(currentTimer);

    const durationMinutes = getTaskDurationMinutes(task ?? {});

    let actualTimeSpentSeconds = 0;

    if (durationMinutes <= 0 && task) {
      actualTimeSpentSeconds = getTaskElapsedSeconds(
        task,
        currentTimer,
        new Date(completionTime),
      );
    } else {
      if (dueSeconds > remainingSeconds) {
        actualTimeSpentSeconds = dueSeconds - remainingSeconds;
      } else {
        actualTimeSpentSeconds = dueSeconds;
      }
    }

    console.log('Due:', dueSeconds);
    console.log('Remaining:', remainingSeconds);
    console.log('Spent:', actualTimeSpentSeconds);
    setTimers(prev => {
      const activeTimer =
        prev[taskId] ??
        createTimerState(getTaskDurationMinutes(task ?? {}), {
          isPaused: false,
        });
      const remaining = getTimerRemainingSeconds(activeTimer);

      return {
        ...prev,
        [taskId]: {
          ...activeTimer,
          remaining,
          isPaused: true,
          lastResumedAt: undefined,
          totalBreakSeconds,
          pauseStartedAt: undefined,
        },
      };
    });
    setTasks(prev =>
      prev.map(existingTask =>
        existingTask.id === taskId
          ? {
              ...existingTask,
              status: 'completed',
              accepted: true,
              completedAt: completionIso,
              actualTimeSpentSeconds,
              isPaused: true,
              pauseHistory:
                currentTimer.pauseHistory ?? existingTask.pauseHistory ?? [],
              totalBreakSeconds,
              pauseStartedAt: undefined,
              extensionHistory:
                currentTimer.extensionHistory ??
                existingTask.extensionHistory ??
                [],
              completionStatusNote,
            }
          : existingTask,
      ),
    );
    await persistTaskMutation(taskId, {
      status: 'completed',
      accepted: true,
      completedAt: completionIso,
      actualTimeSpentSeconds,
      isPaused: true,
      pauseHistory: currentTimer.pauseHistory ?? [],
      totalBreakSeconds,
      pauseStartedAt: '',
      extensionHistory: currentTimer.extensionHistory ?? [],
      completionStatusNote,
    });

    if (task) {
      addTaskNotification(
        'task_completed',
        'Task Completed',
        `${getUserName(task.assignedTo)} completed '${task.title}'.`,
        taskId,
        {
          recipientUserId: task.assignedBy,
          recipientBackendUserId: getBackendUserId(task.assignedBy),
          targetScreen: 'taskDetails',
        },
      );
    }
  };

  const handleRejectTask = async (
    taskId = selectedTaskId ?? '',
    reason = '',
  ) => {
    if (!taskId) {
      return;
    }

    const task = tasks.find(item => item.id === taskId);
    const reviewReason = reason.trim() || rejectReason.trim();

    await persistTaskMutation(taskId, {
      status: 'rejected',
      accepted: false,
      reviewComment: reviewReason,
      isPaused: true,
    });
    setShowRejectModal(false);
    setRejectReason('');

    if (task) {
      addTaskNotification(
        'task_rejected',
        'Task Rejected',
        `${getUserName(task.assignedTo)} rejected '${task.title}'.`,
        taskId,
        {
          recipientUserId: task.assignedBy,
          recipientBackendUserId: getBackendUserId(task.assignedBy),
          targetScreen: 'reviewTask',
        },
      );
    }
  };

  const handleSubmitForReview = async (
    taskId: string,
    comment = '',
    options?: { nextScreen?: Screen },
  ) => {
    const task = tasks.find(item => item.id === taskId);
    const submittedAt = Date.now();
    const currentTimer =
      timers[taskId] ??
      createTimerState(getTaskDurationMinutes(task ?? {}), {
        isPaused: task?.isPaused ?? true,
        pauseHistory: task?.pauseHistory ?? [],
        totalBreakSeconds: task?.totalBreakSeconds ?? 0,
        pauseStartedAt: task?.pauseStartedAt,
        extensionHistory: task?.extensionHistory ?? [],
      });
    const totalBreakSeconds = getBreakSeconds(currentTimer, submittedAt);

    setTimers(prev => ({
      ...prev,
      [taskId]: {
        ...currentTimer,
        isPaused: true,
        lastResumedAt: undefined,
        totalBreakSeconds,
        pauseStartedAt: undefined,
      },
    }));
    setReviewComment('');
    setProgressNotes('');
    await persistTaskMutation(
      taskId,
      {
        status: 'under_review',
        reviewComment: comment?.trim() || '',
        isPaused: true,
        pauseHistory: currentTimer.pauseHistory,
        totalBreakSeconds,
        pauseStartedAt: '',
        extensionHistory: currentTimer.extensionHistory,
      },
      {
        successMessage: 'Task submitted for review.',
        nextScreen: options?.nextScreen,
      },
    );

    if (task) {
      addTaskNotification(
        'task_returned',
        'Task Sent For Review',
        `${getUserName(task.assignedTo)} sent '${task.title}' for your review.`,
        taskId,
        {
          recipientUserId: task.assignedBy,
          recipientBackendUserId: getBackendUserId(task.assignedBy),
          targetScreen: 'reviewTask',
        },
      );
    }
  };

  const handleApproveTask = async (taskId: string) => {
    const task = tasks.find(item => item.id === taskId);
    setReviewComment('');
    const currentTimer =
      timers[taskId] ??
      createTimerState(getTaskDurationMinutes(task ?? {}), {
        isPaused: task?.isPaused ?? true,
        pauseHistory: task?.pauseHistory ?? [],
        totalBreakSeconds: task?.totalBreakSeconds ?? 0,
        pauseStartedAt: task?.pauseStartedAt,
        extensionHistory: task?.extensionHistory ?? [],
      });
    const completionStatusNote = getCompletionStatusFromTimer(currentTimer);
    const totalBreakSeconds = getBreakSeconds(currentTimer);
    await persistTaskMutation(
      taskId,
      {
        status: 'completed',
        completedAt: getIsoNow(),
        isPaused: true,
        pauseHistory: currentTimer.pauseHistory,
        totalBreakSeconds,
        pauseStartedAt: '',
        extensionHistory: currentTimer.extensionHistory,
        completionStatusNote,
      },
      { successMessage: 'Task approved successfully.' },
    );

    if (task) {
      addTaskNotification(
        'task_approved',
        'Task Approved',
        `${currentUser?.name ?? 'Someone'} approved '${task.title}'.`,
        taskId,
        {
          recipientUserId: task.assignedTo,
          recipientBackendUserId: getBackendUserId(task.assignedTo),
          targetScreen: 'taskDetails',
        },
      );
    }
  };

  const handleReturnForChanges = async (taskId: string, comment: string) => {
    const task = tasks.find(item => item.id === taskId);
    setTimers(prev => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] ??
          createTimerState(getTaskDurationMinutes(task ?? {}), {
            isPaused: false,
          })),
        isPaused: false,
        lastResumedAt: getIsoNow(),
      },
    }));
    setReviewComment('');
    await persistTaskMutation(
      taskId,
      {
        status: 'in_progress',
        feedback: comment.trim(),
        isPaused: false,
      },
      { nextScreen: 'dashboard' },
    );

    if (task) {
      addTaskNotification(
        'task_returned',
        'Task Returned',
        `${currentUser?.name ?? 'Someone'} returned '${
          task.title
        }' for changes.`,
        taskId,
        {
          recipientUserId: task.assignedTo,
          recipientBackendUserId: getBackendUserId(task.assignedTo),
          targetScreen: 'activeTask',
        },
      );
    }
  };

  const handleTogglePause = async (taskId: string) => {
    const currentTask = tasks.find(task => task.id === taskId);

    const currentTimer =
      timers[taskId] ??
      createTimerState(getTaskDurationMinutes(currentTask ?? {}), {
        isPaused: currentTask?.isPaused ?? false,
        pauseHistory: currentTask?.pauseHistory ?? [],
        totalBreakSeconds: currentTask?.totalBreakSeconds ?? 0,
        pauseStartedAt: currentTask?.pauseStartedAt,
        extensionHistory: currentTask?.extensionHistory ?? [],
      });

    const toggledAt = new Date();
    const toggledAtIso = toggledAt.toISOString();

    const nextPausedState = !currentTimer.isPaused;

    const currentRemainingSeconds = getTimerRemainingSeconds(
      currentTimer,
      toggledAt.getTime(),
    );

    const nextBreakSeconds = nextPausedState
      ? currentTimer.totalBreakSeconds ?? 0
      : getBreakSeconds(currentTimer, toggledAt.getTime());

    const taskPauseHistory = nextPausedState
      ? [...currentTimer.pauseHistory, getTimestampLabel(toggledAt)]
      : [...currentTimer.pauseHistory, getResumeTimestampLabel(toggledAt)];

    const nextPauseStartedAt = nextPausedState ? toggledAtIso : undefined;

    if (!nextPausedState) {
      const runningTasks = tasks.filter(
        task =>
          task.id !== taskId && task.status === 'in_progress' && !task.isPaused,
      );

      setTimers(prev => {
        const updated = { ...prev };

        runningTasks.forEach(task => {
          const timer =
            prev[task.id] ??
            createTimerState(getTaskDurationMinutes(task), {
              isPaused: task.isPaused ?? false,
              pauseHistory: task.pauseHistory ?? [],
              totalBreakSeconds: task.totalBreakSeconds ?? 0,
              pauseStartedAt: task.pauseStartedAt,
              extensionHistory: task.extensionHistory ?? [],
            });

          updated[task.id] = {
            ...timer,
            remaining: getTimerRemainingSeconds(timer, toggledAt.getTime()),
            isPaused: true,
            pauseStartedAt: toggledAtIso,
            totalBreakSeconds: getBreakSeconds(timer, toggledAt.getTime()),
            pauseHistory: [
              ...(timer.pauseHistory ?? []),
              getTimestampLabel(toggledAt),
            ],
          };
        });

        updated[taskId] = {
          ...currentTimer,
          remaining: currentRemainingSeconds,
          isPaused: nextPausedState,
          lastResumedAt: nextPausedState ? undefined : toggledAtIso,
          pauseHistory: taskPauseHistory,
          totalBreakSeconds: nextBreakSeconds,
          pauseStartedAt: nextPauseStartedAt,
        };

        return updated;
      });

      setTasks(existing =>
        existing.map(task => {
          if (
            task.id !== taskId &&
            task.status === 'in_progress' &&
            !task.isPaused
          ) {
            return {
              ...task,
              isPaused: true,
              pauseStartedAt: toggledAtIso,
              pauseHistory: [
                ...(task.pauseHistory ?? []),
                getTimestampLabel(toggledAt),
              ],
            };
          }

          if (task.id === taskId) {
            return {
              ...task,
              isPaused: nextPausedState,
              pauseHistory: taskPauseHistory,
              totalBreakSeconds: nextBreakSeconds,
              pauseStartedAt: nextPauseStartedAt,
            };
          }

          return task;
        }),
      );

      await Promise.all([
        persistTaskMutation(taskId, {
          isPaused: nextPausedState,
          pauseHistory: taskPauseHistory,
          totalBreakSeconds: nextBreakSeconds,
          pauseStartedAt: nextPauseStartedAt ?? '',
        }),
        ...runningTasks.map(task =>
          persistTaskMutation(task.id, {
            isPaused: true,
            pauseHistory: [
              ...(task.pauseHistory ?? []),
              getTimestampLabel(toggledAt),
            ],
            totalBreakSeconds: task.totalBreakSeconds ?? 0,
            pauseStartedAt: toggledAtIso,
          }),
        ),
      ]);

      return;
    }

    // Normal pause flow
    setTimers(prev => ({
      ...prev,
      [taskId]: {
        ...currentTimer,
        remaining: currentRemainingSeconds,
        isPaused: nextPausedState,
        lastResumedAt: nextPausedState ? undefined : toggledAtIso,
        pauseHistory: taskPauseHistory,
        totalBreakSeconds: nextBreakSeconds,
        pauseStartedAt: nextPauseStartedAt,
      },
    }));

    setTasks(existing =>
      existing.map(task =>
        task.id === taskId
          ? {
              ...task,
              isPaused: nextPausedState,
              pauseHistory: taskPauseHistory,
              totalBreakSeconds: nextBreakSeconds,
              pauseStartedAt: nextPauseStartedAt,
            }
          : task,
      ),
    );

    await persistTaskMutation(taskId, {
      isPaused: nextPausedState,
      pauseHistory: taskPauseHistory,
      totalBreakSeconds: nextBreakSeconds,
      pauseStartedAt: nextPauseStartedAt ?? '',
    });
  };
  // const handleTogglePause = async (taskId: string) => {
  //   const currentTask = tasks.find(task => task.id === taskId);
  //   const currentTimer =
  //     timers[taskId] ??
  //     createTimerState(getTaskDurationMinutes(currentTask ?? {}) || 60, {
  //       isPaused: currentTask?.isPaused ?? false,
  //       pauseHistory: currentTask?.pauseHistory ?? [],
  //       totalBreakSeconds: currentTask?.totalBreakSeconds ?? 0,
  //       pauseStartedAt: currentTask?.pauseStartedAt,
  //       extensionHistory: currentTask?.extensionHistory ?? [],
  //     });
  //   const toggledAt = new Date();
  //   const toggledAtIso = toggledAt.toISOString();
  //   const nextPausedState = !currentTimer.isPaused;
  //   const currentRemainingSeconds = getTimerRemainingSeconds(currentTimer, toggledAt.getTime());
  //   const nextBreakSeconds = nextPausedState
  //     ? currentTimer.totalBreakSeconds ?? 0
  //     : getBreakSeconds(currentTimer, toggledAt.getTime());
  //   const taskPauseHistory = nextPausedState
  //     ? [...currentTimer.pauseHistory, getTimestampLabel(toggledAt)]
  //     : [...currentTimer.pauseHistory, getResumeTimestampLabel(toggledAt)];
  //   const nextPauseStartedAt = nextPausedState ? toggledAtIso : undefined;

  //   setTimers(prev => ({
  //     ...prev,
  //     [taskId]: {
  //       ...currentTimer,
  //       remaining: currentRemainingSeconds,
  //       isPaused: nextPausedState,
  //       lastResumedAt: nextPausedState ? undefined : toggledAtIso,
  //       pauseHistory: taskPauseHistory,
  //       totalBreakSeconds: nextBreakSeconds,
  //       pauseStartedAt: nextPauseStartedAt,
  //     },
  //   }));
  //   setTasks(existing =>
  //     existing.map(task =>
  //       task.id === taskId
  //         ? {
  //             ...task,
  //             isPaused: nextPausedState,
  //             pauseHistory: taskPauseHistory,
  //             totalBreakSeconds: nextBreakSeconds,
  //             pauseStartedAt: nextPauseStartedAt,
  //           }
  //         : task,
  //     ),
  //   );
  //   await persistTaskMutation(taskId, {
  //     isPaused: nextPausedState,
  //     pauseHistory: taskPauseHistory,
  //     totalBreakSeconds: nextBreakSeconds,
  //     pauseStartedAt: nextPauseStartedAt ?? '',
  //   });
  // };

  const handleAddMoreTime = async (
    taskId: string,
    minutes: number,
    reason = '',
  ) => {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    const extraSeconds = minutes * 60;
    const trimmedReason = reason.trim();
    const extensionLabel = trimmedReason
      ? `Extra time taken: ${formatDurationLabel(
          minutes,
        )} • Reason: ${trimmedReason}`
      : `Extra time taken: ${formatDurationLabel(minutes)}`;
    const currentTask = tasks.find(task => task.id === taskId);
    const currentTimer =
      timers[taskId] ??
      createTimerState(getTaskDurationMinutes(currentTask ?? {}), {
        isPaused: true,
        pauseHistory: currentTask?.pauseHistory ?? [],
        totalBreakSeconds: currentTask?.totalBreakSeconds ?? 0,
        pauseStartedAt: currentTask?.pauseStartedAt,
        extensionHistory: currentTask?.extensionHistory ?? [],
      });
    const remaining = getTimerRemainingSeconds(currentTimer);
    const resumedAt = new Date();
    const resumedAtIso = resumedAt.toISOString();
    const nextBreakSeconds = currentTimer.isPaused
      ? getBreakSeconds(currentTimer, resumedAt.getTime())
      : currentTimer.totalBreakSeconds ?? 0;
    const nextPauseHistory = currentTimer.isPaused
      ? [...currentTimer.pauseHistory, getResumeTimestampLabel(resumedAt)]
      : currentTimer.pauseHistory;
    const nextExtensionHistory = [
      ...currentTimer.extensionHistory,
      extensionLabel,
    ];

    setTimers(prev => ({
      ...prev,
      [taskId]: {
        ...currentTimer,
        total: currentTimer.total + extraSeconds,
        remaining: remaining + extraSeconds,
        isPaused: false,
        lastResumedAt: resumedAtIso,
        pauseHistory: nextPauseHistory,
        totalBreakSeconds: nextBreakSeconds,
        pauseStartedAt: undefined,
        extensionHistory: nextExtensionHistory,
      },
    }));

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              isPaused: false,
              pauseHistory: nextPauseHistory,
              totalBreakSeconds: nextBreakSeconds,
              pauseStartedAt: undefined,
              extensionHistory: nextExtensionHistory,
              completionStatusNote: undefined,
            }
          : task,
      ),
    );

    await persistTaskMutation(taskId, {
      isPaused: false,
      pauseHistory: nextPauseHistory,
      totalBreakSeconds: nextBreakSeconds,
      pauseStartedAt: '',
      extensionHistory: nextExtensionHistory,
      completionStatusNote: '',
    });
  };

  const handleEditSelectedTask = () => handlePersistTask('edit');

  const loadEditForm = () => {
    if (!selectedTask) {
      return;
    }

    setTaskForm({
      title: selectedTask.title,
      description: selectedTask.description,
      dueDate: selectedTask.dueDate,
      dueTime: selectedTask.dueTime ?? '',
      assignedTo: selectedTask.assignedTo,
    });
    changeScreen('editTask');
  };

  const openTaskEditor = (taskId: string) => {
    const taskToEdit = tasks.find(task => task.id === taskId);

    if (!taskToEdit) {
      return;
    }

    setSelectedTaskId(taskId);
    setTaskForm({
      title: taskToEdit.title,
      description: taskToEdit.description,
      dueDate: taskToEdit.dueDate,
      dueTime: taskToEdit.dueTime ?? '',
      assignedTo: taskToEdit.assignedTo,
    });
    changeScreen('editTask');
  };

  const navigateFromNotification = (notification: AppNotification) => {
    if (!notification.taskId || notification.taskId === 'unknown-task') {
      changeScreen('notifications');
      return;
    }

    const task = tasks.find(item => item.id === notification.taskId);

    if (!task) {
      changeScreen('myTasks');
      return;
    }

    setSelectedTaskId(task.id);

    const currentUserKeys = new Set(
      [currentUser?.id, currentUser?.backendId]
        .filter((value): value is string => Boolean(value?.trim()))
        .flatMap(value => [value, getBackendUserId(value)]),
    );
    const isMyTask =
      currentUserKeys.has(task.assignedTo) ||
      currentUserKeys.has(getBackendUserId(task.assignedTo));
    const isManagedTask =
      currentUserKeys.has(task.assignedBy) ||
      currentUserKeys.has(getBackendUserId(task.assignedBy));

    if (
      notification.targetScreen === 'reviewTask' ||
      task.status === 'under_review' ||
      task.status === 'rejected'
    ) {
      if (isManagedTask) {
        setManageTab('review');
        changeScreen('createTask');
        return;
      }

      setTaskTab('review');
      changeScreen('myTasks');
      return;
    }

    if (
      notification.type === 'task_assigned' ||
      notification.targetScreen === 'incomingTask'
    ) {
      setTaskTab('incoming');
      changeScreen('myTasks');
      return;
    }

    if (
      notification.type === 'task_returned' ||
      notification.targetScreen === 'activeTask'
    ) {
      setTaskTab('active');
      changeScreen('myTasks');
      return;
    }

    if (notification.type === 'task_completed' || task.status === 'completed') {
      if (isManagedTask) {
        setManageTab('done');
        changeScreen('createTask');
        return;
      }

      setTaskTab('complete');
      changeScreen('myTasks');
      return;
    }

    if (isMyTask) {
      if (task.status === 'pending') {
        setTaskTab('incoming');
      } else if (task.status === 'in_progress') {
        setTaskTab('active');
      } else if (task.status === 'under_review' || task.status === 'rejected') {
        setTaskTab('review');
      } else {
        setTaskTab('complete');
      }
      changeScreen('myTasks');
      return;
    }

    if (isManagedTask) {
      setManageTab('created');
      changeScreen('createTask');
    } else {
      changeScreen('myTasks');
    }
  };

  const handleForegroundPushMessage = useEffectEvent(
    (notification: AppNotification) => {
      if (!isNotificationForCurrentUser(notification)) {
        return;
      }

      setLiveNotifications(prev => upsertNotification(prev, notification));
    },
  );

  const handleOpenedPushMessage = useEffectEvent(
    (notification: AppNotification) => {
      if (!isNotificationForCurrentUser(notification)) {
        return;
      }

      setLiveNotifications(prev =>
        upsertNotification(prev, {
          ...notification,
          read: true,
        }),
      );
      setReadNotificationIds(prev =>
        prev.includes(notification.id) ? prev : [...prev, notification.id],
      );
      navigateFromNotification(notification);
    },
  );

  const handlePushTokenRefresh = useEffectEvent((token: string) => {
    setPushToken(token);
  });

  const markAllNotificationsRead = () => {
    setReadNotificationIds(prev => {
      const nextIds = new Set(prev);

      visibleNotifications.forEach(notification => {
        nextIds.add(notification.id);
      });

      return Array.from(nextIds);
    });
  };

  const openNotification = (notification: AppNotification) => {
    setReadNotificationIds(prev =>
      prev.includes(notification.id) ? prev : [...prev, notification.id],
    );
    navigateFromNotification(notification);
  };

  const openTaskByStatus = (task: Task) => {
    if (task.status === 'pending') {
      navigateTo('incomingTask', task.id);
      return;
    }
    if (task.status === 'in_progress') {
      navigateTo('activeTask', task.id);
      return;
    }
    if (task.status === 'under_review' || task.status === 'rejected') {
      navigateTo('reviewTask', task.id);
      return;
    }
    navigateTo('taskDetails', task.id);
  };

  const currentTaskList = () => {
    switch (taskTab) {
      case 'active':
        return myTasks.filter(task => task.status === 'in_progress');
      case 'incoming':
        return myTasks.filter(task => task.status === 'pending');
      case 'review':
        return myTasks.filter(
          task => task.status === 'under_review' || task.status === 'rejected',
        );
      case 'complete':
        return myTasks.filter(task => task.status === 'completed');
      default:
        return [];
    }
  };

  const homeStats = [
    {
      label: 'Pending',
      value: myTasks.filter(task => task.status === 'pending').length,
    },
    {
      label: 'Review',
      value: myTasks.filter(
        task => task.status === 'under_review' || task.status === 'rejected',
      ).length,
    },
    {
      label: 'Done',
      value: myTasks.filter(task => task.status === 'completed').length,
    },
    { label: 'Total', value: myTasks.length + assignedByMe.length },
  ];

  const unreadNotifications = visibleNotifications.filter(
    item => !item.read,
  ).length;
  const profileStats = {
    total: myTasks.length,
    completed: myTasks.filter(task => task.status === 'completed').length,
    review: myTasks.filter(
      task => task.status === 'under_review' || task.status === 'rejected',
    ).length,
    pending: myTasks.filter(task => task.status === 'pending').length,
  };

  useEffect(() => {
    let isMounted = true;
    let cleanup = () => {};

    const setupMessaging = async () => {
      try {
        setPushNotificationStatus('pending');

        const result = await initializeFirebaseMessaging({
          onMessage: handleForegroundPushMessage,
          onNotificationOpen: handleOpenedPushMessage,
          onToken: handlePushTokenRefresh,
        });

        cleanup = result.cleanup;

        if (!isMounted) {
          cleanup();
          return;
        }

        setPushNotificationStatus(result.status);
        setPushToken(result.token);

        if (result.initialNotification) {
          handleOpenedPushMessage(result.initialNotification);
        }
      } catch (error) {
        if (isMounted) {
          setPushNotificationStatus('error');
          setTaskActionError(getErrorMessage(error));
        }
      }
    };

    setupMessaging();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  const renderTaskCard = (task: Task, compact = false, disableOpen = false) => (
    <TaskCard
      key={task.id}
      task={task}
      compact={compact}
      timer={timers[task.id]}
      getUserName={getUserName}
      onOpen={openTaskByStatus}
      onAccept={handleAcceptTask}
      onReject={handleRejectTask}
      onStart={handleStartTask}
      onTogglePause={handleTogglePause}
      onNeedMoreTime={taskId => navigateTo('activeTask', taskId)}
      onReview={(taskId, comment) => {
        const currentTask = tasks.find(item => item.id === taskId);

        if (currentTask?.status === 'pending') {
          handleSubmitForReview(taskId, comment);
          return;
        }

        navigateTo('reviewTask', taskId);
      }}
      onViewCompleted={taskId => navigateTo('taskDetails', taskId)}
      disableOpen={disableOpen}
    />
  );

  const renderDashboardNavItem = (
    label: string,
    tab: DashboardTab,
    icon: string,
  ) => (
    <DashboardNavItem
      key={tab}
      label={label}
      tab={tab}
      icon={icon}
      activeTab={dashboardTab}
      onPress={() => {
        setDashboardTab(tab);

        if (tab === 'tasks') {
          changeScreen('myTasks');
        } else if (tab === 'add') {
          setManageTab('create');
          resetTaskForm();
          changeScreen('createTask');
        } else if (tab === 'profile') {
          changeScreen('profile');
        } else {
          setTaskTab('active');
          changeScreen('dashboard');
        }
      }}
    />
  );

  const activeScreen: Screen = hasFinishedSplash ? screen : 'splash';

  return {
    activeScreen,
    screenRendererProps: {
      screen: activeScreen,
      progress,
      currentUser,
      tasks,
      loginEmail,
      loginPassword,
      forgotPasswordEmail,
      forgotPasswordOtp,
      forgotPasswordNewPassword,
      forgotPasswordConfirmPassword,
      setLoginEmail,
      setLoginPassword,
      setForgotPasswordEmail,
      setForgotPasswordOtp,
      setForgotPasswordNewPassword,
      setForgotPasswordConfirmPassword,
      handleLogin,
      handleRequestPasswordReset,
      handleVerifyForgotPasswordOtp,
      handleResetPassword,
      openForgotPassword,
      loginError,
      forgotPasswordError,
      forgotPasswordMessage,
      isLoggingIn,
      isForgotPasswordSubmitting,
      unreadNotifications,
      pushNotificationStatus,
      pushNotificationToken: pushToken,
      homeStats,
      taskTab,
      setTaskTab,
      currentTaskList,
      renderTaskCard,
      setScreen: changeScreen,
      goBack,
      renderDashboardNavItem,
      manageTab,
      setManageTab,
      manageTasks,
      taskForm,
      setTaskForm,
      getUserName,
      getUserRole,
      users,
      selectedUser,
      isUsersLoading,
      isTasksLoading,
      userActionError,
      taskActionError,
      isSavingUser,
      isSavingTask,
      handleCreateUser,
      handleUpdateUser,
      handleDeleteUser,
      openUserDetails,
      manageUsersInitialTab,
      openManageUsersAssignments,
      resetTaskForm,
      handleCreateTask,
      handleEditSelectedTask,
      handleReassignTask,
      openTaskEditor,
      selectedTask,
      loadEditForm,
      navigateTo,
      setShowRejectModal,
      handleAcceptTask,
      handleRejectTask,
      handleStartTask,
      handleCompleteTask,
      timers,
      handleTogglePause,
      handleAddMoreTime,
      progressNotes,
      setProgressNotes,
      reviewComment,
      setReviewComment,
      handleReturnForChanges,
      handleApproveTask,
      handleSubmitForReview,
      notifications: visibleNotifications,
      markAllNotificationsRead,
      openNotification,
      myTasks,
      profileStats,
      handleLogout,
    },
    rejectTaskModalProps: {
      visible: showRejectModal,
      reason: rejectReason,
      onChangeReason: setRejectReason,
      onCancel: () => setShowRejectModal(false),
      onConfirm: handleRejectTask,
    },
    successModalProps: {
      visible: showSuccessModal,
      message: successMessage,
      onClose: () => setShowSuccessModal(false),
    },
  };
}
