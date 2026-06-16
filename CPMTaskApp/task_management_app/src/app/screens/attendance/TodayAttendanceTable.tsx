import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ActionButton, GradientSurface } from '../../components';
import { attendanceService } from '../../services/attendance.service';
import { styles } from '../../theme/styles';

type Props = {
  getUserName: (userId: string) => string;
};

type TaskModalState = {
  title: string;
  userName: string;
  tasks: any[];
  accent: 'active' | 'pending' | 'done';
};

export default function TodayAttendanceTable({ getUserName }: Props) {
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);
  const [taskModal, setTaskModal] = useState<TaskModalState | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'tasks'>(
    'attendance',
  );

  const attendanceTabs: Array<{
    key: 'attendance' | 'tasks';
    label: string;
  }> = [
    { key: 'attendance', label: 'Today\'s Attendance' },
    { key: 'tasks', label: 'Today\'s Tasks' },
  ];

  useEffect(() => {
    loadAttendance();

    const interval = setInterval(() => {
      loadAttendance();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadAttendance = async () => {
    try {
      const response = await attendanceService.getTodayReport();
      setAttendanceRows(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const formatTime = (value?: string | null) =>
    value
      ? new Date(value).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--';

  const getRowUserName = (row: any) =>
    row.userName || row.name || getUserName(row.userId);

  const openTaskModal = (
    row: any,
    title: string,
    tasks: any[],
    accent: TaskModalState['accent'],
  ) => {
    setTaskModal({
      title,
      userName: getRowUserName(row),
      tasks,
      accent,
    });
  };

  const renderTaskCount = (
    row: any,
    title: string,
    tasks: any[] = [],
    accent: TaskModalState['accent'],
  ) => {
    const pillStyle =
      accent === 'active'
        ? styles.attendanceCountActive
        : accent === 'done'
        ? styles.managedCountDone
        : styles.managedCountPending;

    return (
      <Pressable
        style={styles.attendanceCountCell}
        onPress={() => openTaskModal(row, title, tasks, accent)}
      >
        {tasks.length ? (
          <View style={[styles.attendanceCountPill, pillStyle]}>
            <Text style={styles.managedCountText}>{tasks.length}</Text>
          </View>
        ) : (
          <Text style={styles.attendanceCellText}>-</Text>
        )}
      </Pressable>
    );
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.myTasksTabScrollContent}
      >
        <View style={styles.myTasksTabRow}>
          {attendanceTabs.map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.myTasksTabButton,
                activeTab === tab.key && styles.myTasksTabButtonActive,
              ]}
            >
              {activeTab === tab.key ? (
                <GradientSurface style={styles.myTasksTabGradient} />
              ) : null}
              <Text
                style={[
                  styles.myTasksTabText,
                  activeTab === tab.key && styles.myTasksTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.attendanceTableWrap}>
        {activeTab === 'attendance' ? (
          <View style={styles.attendanceTable}>
            <View style={styles.attendanceTableHeader}>
              <View style={[styles.attendanceTableCell, styles.attendanceUserCell]}>
                <Text style={styles.attendanceHeaderCell}>User</Text>
              </View>

              <View style={styles.attendanceTimeCell}>
                <Text style={styles.attendanceHeaderCell}>In</Text>
              </View>

              <View style={styles.attendanceTimeCell}>
                <Text style={styles.attendanceHeaderCell}>Out</Text>
              </View>

              <View style={styles.attendanceHoursCell}>
                <Text style={styles.attendanceHeaderCell}>Hours</Text>
              </View>
            </View>

            {attendanceRows.map((row: any) => (
              <View key={row.userId} style={styles.attendanceTableRow}>
                <View style={[styles.attendanceTableCell, styles.attendanceUserCell]}>
                  <Text style={styles.managedUserName} numberOfLines={1}>
                    {getRowUserName(row)}
                  </Text>
                </View>

                <View style={styles.attendanceTimeCell}>
                  {(row.attendance || []).length ? (
                    (row.attendance || []).map((item: any, index: number) => (
                      <Text key={index} style={styles.attendanceCellText}>
                        {formatTime(item.checkInTime)}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.attendanceCellText}>--</Text>
                  )}
                </View>

                <View style={styles.attendanceTimeCell}>
                  {(row.attendance || []).length ? (
                    (row.attendance || []).map((item: any, index: number) => (
                      <Text key={index} style={styles.attendanceCellText}>
                        {formatTime(item.checkOutTime)}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.attendanceCellText}>--</Text>
                  )}
                </View>

                <View style={styles.attendanceHoursCell}>
                  <Text style={styles.attendanceCellStrong}>
                    {Number(row.totalHours || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.attendanceTable}>
            <View style={styles.attendanceTableHeader}>
              <View style={[styles.attendanceTableCell, styles.attendanceUserCell]}>
                <Text style={styles.attendanceHeaderCell}>User</Text>
              </View>

              <View style={styles.attendanceCountCell}>
                <Text style={styles.attendanceHeaderCell}>Active</Text>
              </View>

              <View style={styles.attendanceCountCell}>
                <Text style={styles.attendanceHeaderCell}>Pending</Text>
              </View>

              <View style={styles.attendanceCountCell}>
                <Text style={styles.attendanceHeaderCell}>Done</Text>
              </View>
            </View>

            {attendanceRows.map((row: any) => {
              const activeTasks = row.activeTasks || [];
              const pendingTasks = row.pendingTasks || [];
              const completedTasks = row.completedTasks || [];

              return (
                <View key={row.userId} style={styles.attendanceTableRow}>
                  <View style={[styles.attendanceTableCell, styles.attendanceUserCell]}>
                    <Text style={styles.managedUserName} numberOfLines={1}>
                      {getRowUserName(row)}
                    </Text>
                  </View>

                  {renderTaskCount(row, 'Active Tasks', activeTasks, 'active')}
                  {renderTaskCount(row, 'Pending Tasks', pendingTasks, 'pending')}
                  {renderTaskCount(row, 'Done Today', completedTasks, 'done')}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Modal
        visible={Boolean(taskModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setTaskModal(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.attendanceTaskModalCard}>
            <View style={styles.attendanceTaskModalHeader}>
              <View
                style={[
                  styles.attendanceTaskModalAccent,
                  taskModal?.accent === 'active'
                    ? styles.attendanceTaskModalAccentActive
                    : taskModal?.accent === 'done'
                    ? styles.attendanceTaskModalAccentDone
                    : styles.attendanceTaskModalAccentPending,
                ]}
              />
              <View style={styles.flexOne}>
                <Text style={styles.attendanceTaskModalTitle}>
                  {taskModal?.title}
                </Text>
                <Text style={styles.attendanceTaskModalSubtitle} numberOfLines={1}>
                  {taskModal?.userName}
                </Text>
              </View>
              <View style={styles.attendanceTaskModalCount}>
                <Text style={styles.attendanceTaskModalCountText}>
                  {taskModal?.tasks.length || 0}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.attendanceTaskModalList}>
              {taskModal?.tasks.length ? (
                taskModal.tasks.map((task: any, index: number) => (
                  <View key={task.id || index} style={styles.attendanceTaskModalItem}>
                    <View style={styles.attendanceTaskModalIndex}>
                      <Text style={styles.attendanceTaskModalIndexText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.attendanceTaskModalText}>
                      {task.title}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.attendanceTaskModalEmpty}>
                  <Text style={styles.managedCellText}>No tasks found</Text>
                </View>
              )}
            </ScrollView>

            <ActionButton
              title="Close"
              onPress={() => setTaskModal(null)}
              variant="primary"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
