import type { Task } from '../domain/model';

export type BackendUser = {
  _id: string;
  name?: string;
  email: string;
  telephone?: string;
  role?: string;
};

export type BackendTaskUser = BackendUser | string;

export type BackendTask = {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  durationMinutes?: number;
  status: Task['status'];
  assignedTo: BackendTaskUser;
  assignedBy: BackendTaskUser;
  createdAt: string;
  updatedAt?: string;
  accepted?: boolean;
  reviewComment?: string;
  feedback?: string;
  completedAt?: string | null;
  isPaused?: boolean;
  pauseHistory?: string[];
  totalBreakSeconds?: number;
  pauseStartedAt?: string;
  extensionHistory?: string[];
  completionStatusNote?: string;
  actualTimeSpentSeconds?: number;
};
