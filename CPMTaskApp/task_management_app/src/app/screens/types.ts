import type React from 'react';
import type {
  AppNotification,
  DashboardTab,
  ManageTab,
  Screen,
  Task,
  TaskTab,
  TimerState,
  User,
} from '../domain/model';
import type { PushNotificationStatus } from '../services/firebaseMessaging';

export type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  assignedTo: string;
};

export type HomeStat = {
  label: string;
  value: number;
};

export type ProfileStats = {
  total: number;
  completed: number;
  review: number;
  pending: number;
};

export type CreateUserInput = {
  name: string;
  email: string;
  telephone: string;
  role: string;
  password: string;
};

export type UpdateUserInput = {
  name: string;
  email: string;
  telephone: string;
  role: string;
};

export type ScreenRendererProps = {
  screen: Screen;
  progress: number;
  currentUser: User | null;
  tasks: Task[];
  loginEmail: string;
  loginPassword: string;
  forgotPasswordEmail: string;
  forgotPasswordOtp: string;
  forgotPasswordNewPassword: string;
  forgotPasswordConfirmPassword: string;
  setLoginEmail: (value: string) => void;
  setLoginPassword: (value: string) => void;
  setForgotPasswordEmail: (value: string) => void;
  setForgotPasswordOtp: (value: string) => void;
  setForgotPasswordNewPassword: (value: string) => void;
  setForgotPasswordConfirmPassword: (value: string) => void;
  handleLogin: () => void;
  handleRequestPasswordReset: () => Promise<void>;
  handleVerifyForgotPasswordOtp: () => Promise<void>;
  handleResetPassword: () => Promise<void>;
  openForgotPassword: () => void;
  loginError: string;
  forgotPasswordError: string;
  forgotPasswordMessage: string;
  isLoggingIn: boolean;
  isForgotPasswordSubmitting: boolean;
  unreadNotifications: number;
  pushNotificationStatus: PushNotificationStatus;
  pushNotificationToken: string | null;
  homeStats: HomeStat[];
  taskTab: TaskTab;
  setTaskTab: (tab: TaskTab) => void;
  currentTaskList: () => Task[];
  renderTaskCard: (task: Task, compact?: boolean, disableOpen?: boolean) => React.ReactNode;
  setScreen: (screen: Screen) => void;
  goBack: () => void;
  renderDashboardNavItem: (
    label: string,
    tab: DashboardTab,
    icon: string,
  ) => React.ReactNode;
  manageTab: ManageTab;
  setManageTab: (tab: ManageTab) => void;
  manageTasks: Task[];
  taskForm: TaskForm;
  setTaskForm: React.Dispatch<React.SetStateAction<TaskForm>>;
  getUserName: (userId: string) => string;
  getUserRole: (userId: string) => string;
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isTasksLoading: boolean;
  userActionError: string;
  taskActionError: string;
  isSavingUser: boolean;
  isSavingTask: boolean;
  handleCreateUser: (user: CreateUserInput) => Promise<boolean>;
  handleUpdateUser: (userId: string, user: UpdateUserInput) => Promise<boolean>;
  handleDeleteUser: (userId: string) => Promise<boolean>;
  openUserDetails: (userId: string) => void;
  resetTaskForm: () => void;
  handleCreateTask: () => Promise<void>;
  handleEditSelectedTask: () => Promise<void>;
  handleReassignTask: (taskId: string) => Promise<void>;
  openTaskEditor: (taskId: string) => void;
  selectedTask: Task | null;
  loadEditForm: () => void;
  navigateTo: (screen: Screen, taskId?: string | null) => void;
  setShowRejectModal: (value: boolean) => void;
  handleAcceptTask: (taskId: string) => Promise<void>;
  handleRejectTask: (taskId?: string, reason?: string) => Promise<void>;
  handleStartTask: (taskId: string) => Promise<void>;
  handleCompleteTask: (taskId: string) => Promise<void>;
  timers: Record<string, TimerState>;
  handleTogglePause: (taskId: string) => Promise<void>;
  handleAddMoreTime: (taskId: string, minutes: number, reason?: string) => Promise<void>;
  progressNotes: string;
  setProgressNotes: (value: string) => void;
  reviewComment: string;
  setReviewComment: (value: string) => void;
  handleReturnForChanges: (taskId: string, comment: string) => Promise<void>;
  handleApproveTask: (taskId: string) => Promise<void>;
  handleSubmitForReview: (taskId: string, comment?: string) => Promise<void>;
  notifications: AppNotification[];
  markAllNotificationsRead: () => void;
  openNotification: (notification: AppNotification) => void;
  myTasks: Task[];
  profileStats: ProfileStats;
  handleLogout: () => void;
};
