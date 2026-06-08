import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { SectionCard } from '../../components';
import { attendanceService } from '../../services/attendance.service';
import { styles } from '../../theme/styles';

type Props = {
  getUserName: (userId: string) => string;
};

export default function TodayAttendanceTable({
  getUserName,
}: Props) {
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const response =
        await attendanceService.getTodayAttendance();

      const rows = response.data.map((item: any) => ({
        userId: item.userId,

        userName: getUserName(item.userId),

        checkIn: item.checkInTime
          ? new Date(item.checkInTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '--',

        checkOut: item.checkOutTime
          ? new Date(item.checkOutTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '--',

        totalHours: item.totalHours
          ? Number(item.totalHours).toFixed(2)
          : '0.00',
      }));

      setAttendanceRows(rows);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SectionCard title="Today's Attendance">
      <View style={styles.managedTable}>
        <View style={styles.managedTableHeader}>
          <Text
            style={[
              styles.managedHeaderCell,
              styles.managedUserCell,
            ]}
          >
            User
          </Text>

          <Text style={styles.managedHeaderCell}>
            In
          </Text>

          <Text style={styles.managedHeaderCell}>
            Out
          </Text>

          <Text style={styles.managedHeaderCell}>
            Hours
          </Text>
        </View>

        {attendanceRows.map(row => (
          <View
            key={row.userId}
            style={styles.managedTableRow}
          >
            <View style={styles.managedUserCell}>
              <Text style={styles.managedUserName}>
                {row.userName}
              </Text>
            </View>

            <Text style={styles.managedHeaderCell}>
              {row.checkIn}
            </Text>

            <Text style={styles.managedHeaderCell}>
              {row.checkOut}
            </Text>

            <Text style={styles.managedHeaderCell}>
              {row.totalHours}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}