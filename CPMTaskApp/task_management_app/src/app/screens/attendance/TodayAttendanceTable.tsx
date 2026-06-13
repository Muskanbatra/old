import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SectionCard } from '../../components';
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

  return (
    <SectionCard title="Today's Attendance">
      <View style={styles.managedTable}>
        <View style={styles.managedTableHeader}>
          <Text style={[styles.managedHeaderCell, styles.managedUserCell]}>
            User
          </Text>

          <Text style={styles.managedHeaderCell}>In</Text>

          <Text style={styles.managedHeaderCell}>Out</Text>

          <Text style={styles.managedHeaderCell}>Hours</Text>

          <Text style={styles.managedHeaderCell}>Completed</Text>

          <Text style={styles.managedHeaderCell}>Active Task</Text>

          <Text style={styles.managedHeaderCell}>Pending</Text>
        </View>

        {attendanceRows.map((row: any) => (
          <View key={row.userId} style={styles.managedTableRow}>
            <View style={styles.managedUserCell}>
              <Text style={styles.managedUserName}>
                {getUserName(row.userId)}
              </Text>
            </View>

            <View style={styles.managedHeaderCell}>
              {(row.attendance || []).map(
                (item: any, index: number) => (
                  <Text key={index}>
                    {item.checkInTime
                      ? new Date(item.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--'}
                  </Text>
                ),
              )}
            </View>

            <View style={styles.managedHeaderCell}>
              {(row.attendance || []).map(
                (item: any, index: number) => (
                  <Text key={index}>
                    {item.checkOutTime
                      ? new Date(item.checkOutTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--'}
                  </Text>
                ),
              )}
            </View>

            <Text style={styles.managedHeaderCell}>
              {Number(row.totalHours || 0).toFixed(2)}
            </Text>

            <Pressable
              style={styles.managedHeaderCell}
              onPress={() => {
                setModalTitle('Completed Tasks');
                setSelectedTasks(row.completedTasks || []);
                setShowTaskModal(true);
              }}
            >
              <Text style={{ fontWeight: '700' }}>
                {(row.completedTasks || []).length}
              </Text>
            </Pressable>

            <View style={styles.managedHeaderCell}>
              {(row.activeTasks || []).length > 0 ? (
                <Text numberOfLines={1}>
                  {row.activeTasks[0]?.title}
                </Text>
              ) : (
                <Text>-</Text>
              )}
            </View>

            <Pressable
              style={styles.managedHeaderCell}
              onPress={() => {
                setModalTitle('Pending Tasks');
                setSelectedTasks(row.pendingTasks || []);
                setShowTaskModal(true);
              }}
            >
              <Text style={{ fontWeight: '700' }}>
                {(row.pendingTasks || []).length}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Modal
        visible={showTaskModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 20,
              maxHeight: '70%',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 15,
              }}
            >
              {modalTitle}
            </Text>

            <ScrollView>
              {selectedTasks.map((task: any) => (
                <View key={task.id} style={{ marginBottom: 10 }}>
                  <Text>• {task.title}</Text>
                </View>
              ))}
            </ScrollView>

            <Pressable onPress={() => setShowTaskModal(false)}>
              <Text
                style={{
                  color: 'blue',
                  marginTop: 15,
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SectionCard>
  );
}