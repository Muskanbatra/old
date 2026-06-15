import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ActionButton, GradientSurface } from '../../components';
import { attendanceService } from '../../services/attendance.service';
import { styles } from '../../theme/styles';

type Props = {
  getUserName: (userId: string) => string;
};

export default function TodayAttendanceTable({ getUserName }: Props) {
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'attendance' | 'tasks'>(
    'attendance',
  );

  const attendanceTabs: Array<{
    key: 'attendance' | 'tasks';
    label: string;
  }> = [
    { key: 'attendance', label: 'Attendance' },
    { key: 'tasks', label: 'Tasks' },
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
                <Text style={styles.attendanceHeaderCell}>Done</Text>
              </View>

              <View style={styles.attendanceActiveTaskCell}>
                <Text style={styles.attendanceHeaderCell}>Active</Text>
              </View>

              <View style={styles.attendanceCountCell}>
                <Text style={styles.attendanceHeaderCell}>Pending</Text>
              </View>
            </View>

            {attendanceRows.map((row: any) => (
              <View key={row.userId} style={styles.attendanceTableRow}>
                <View style={[styles.attendanceTableCell, styles.attendanceUserCell]}>
                  <Text style={styles.managedUserName} numberOfLines={1}>
                    {getRowUserName(row)}
                  </Text>
                </View>

                <Pressable
                  style={styles.attendanceCountCell}
                  onPress={() => {
                    setModalTitle('Completed Tasks');
                    setSelectedTasks(row.completedTasks || []);
                    setShowTaskModal(true);
                  }}
                >
                  <View
                    style={[styles.attendanceCountPill, styles.managedCountDone]}
                  >
                    <Text style={styles.managedCountText}>
                      {(row.completedTasks || []).length}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.attendanceActiveTaskCell}>
                  <Text style={styles.attendanceCellText} numberOfLines={1}>
                    {row.activeTasks?.[0]?.title || '-'}
                  </Text>
                </View>

                <Pressable
                  style={styles.attendanceCountCell}
                  onPress={() => {
                    setModalTitle('Pending Tasks');
                    setSelectedTasks(row.pendingTasks || []);
                    setShowTaskModal(true);
                  }}
                >
                  <View
                    style={[
                      styles.attendanceCountPill,
                      styles.managedCountPending,
                    ]}
                  >
                    <Text style={styles.managedCountText}>
                      {(row.pendingTasks || []).length}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal
        visible={showTaskModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.pickerModalCard}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>

            <ScrollView style={styles.attendanceTaskModalList}>
              {selectedTasks.length ? (
                selectedTasks.map((task: any) => (
                  <View key={task.id} style={styles.attendanceTaskModalItem}>
                    <Text style={styles.attendanceTaskModalText}>
                      {task.title}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.managedCellText}>No tasks found</Text>
              )}
            </ScrollView>

            <ActionButton
              title="Close"
              onPress={() => setShowTaskModal(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
