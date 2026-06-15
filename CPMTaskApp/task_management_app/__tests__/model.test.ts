import {
  formatTaskDueDateTime,
  getTaskElapsedSeconds,
} from '../src/app/domain/model';

describe('formatTaskDueDateTime', () => {
  it('does not show a fallback time when dueTime is not assigned', () => {
    expect(
      formatTaskDueDateTime({
        dueDate: '2026-06-15',
        dueTime: '',
      }),
    ).toBe('2026-06-15');
  });

  it('keeps assigned duration labels visible', () => {
    expect(
      formatTaskDueDateTime({
        dueDate: '2026-06-15',
        dueTime: '30 min',
      }),
    ).toBe('Jun 15, 2026 • 30 min');
  });
});

describe('getTaskElapsedSeconds', () => {
  it('freezes elapsed time while a task without assigned time is paused', () => {
    const task = {
      dueDate: '2026-06-15',
      dueTime: '',
    };
    const timer = {
      remaining: 0,
      isPaused: true,
      pauseHistory: [],
      totalBreakSeconds: 0,
      startedAt: '2026-06-15T10:00:00.000Z',
      pauseStartedAt: '2026-06-15T10:05:00.000Z',
      extensionHistory: [],
    };

    expect(
      getTaskElapsedSeconds(
        task,
        timer,
        new Date('2026-06-15T10:10:00.000Z'),
      ),
    ).toBe(300);
  });

  it('returns active time at completion for a task without assigned time', () => {
    const task = {
      dueDate: '2026-06-15',
      dueTime: '',
    };
    const timer = {
      remaining: 0,
      isPaused: false,
      pauseHistory: [],
      totalBreakSeconds: 120,
      startedAt: '2026-06-15T10:00:00.000Z',
      extensionHistory: [],
    };

    expect(
      getTaskElapsedSeconds(
        task,
        timer,
        new Date('2026-06-15T10:10:00.000Z'),
      ),
    ).toBe(480);
  });
});
