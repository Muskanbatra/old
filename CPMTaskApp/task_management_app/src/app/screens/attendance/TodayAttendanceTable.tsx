import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { SectionCard } from '../../components';
import { attendanceService } from '../../services/attendance.service';
import { styles } from '../../theme/styles';

type Props = {
  getUserName: (userId: string) => string;
};

export default function TodayAttendanceTable({ getUserName }: Props) {
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);

 useEffect(() => {
  loadAttendance();

  const interval = setInterval(() => {
    loadAttendance();
  }, 5000); // every 5 sec

  return () => clearInterval(interval);
}, []);

  const loadAttendance = async () => {
    try {
      const response = await attendanceService.getTodayAttendance();

      const grouped: any = {};

      response.data.forEach((item: any) => {
        const userId = item.userId;

        if (!grouped[userId]) {
          grouped[userId] = {
            id: userId,

            userName: getUserName(userId),

            checkIns: [],

            checkOuts: [],

            totalHours: 0,
          };
        }

        grouped[userId].checkIns.push(
          item.checkInTime
            ? new Date(item.checkInTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '--',
        );

        grouped[userId].checkOuts.push(
          item.checkOutTime
            ? new Date(item.checkOutTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '--',
        );

        grouped[userId].totalHours += item.totalHours || 0;
      });

      setAttendanceRows(Object.values(grouped));
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
        </View>

        {attendanceRows.map((row: any) => (
          <View key={row.id} style={styles.managedTableRow}>
            <View style={styles.managedUserCell}>
              <Text style={styles.managedUserName}>{row.userName}</Text>
            </View>

            <View style={styles.managedHeaderCell}>
              {row.checkIns.map((time: string, index: number) => (
                <Text key={index}>{time}</Text>
              ))}
            </View>

            <View style={styles.managedHeaderCell}>
              {row.checkOuts.map((time: string, index: number) => (
                <Text key={index}>{time}</Text>
              ))}
            </View>

            <Text style={styles.managedHeaderCell}>
              {row.totalHours.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}
