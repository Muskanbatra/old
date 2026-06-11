import React, { useEffect, useState } from 'react';
import { View, Button, Alert } from 'react-native';

import { getCurrentLocation } from '../../utils/location';

import { attendanceService } from '../../services/attendance.service';

import { calculateDistance } from '../../utils/distance';
import { OFFICE_LOCATION } from '../../constants/ office';

type AttendanceScreenProps = {
  userId: string;
};

export default function AttendanceScreen({ userId }: AttendanceScreenProps) {
  const [checkedIn, setCheckedIn] = useState(false);
  const loadAttendanceStatus = async () => {
    try {
      const response = await attendanceService.getAttendanceStatus(userId);

      const record = response.data;

      if (record && record.status === 'CHECKED_IN') {
        setCheckedIn(true);
      } else {
        setCheckedIn(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (userId) {
      loadAttendanceStatus();
    }
  }, [userId]);

  async function handleCheckIn() {
    try {
      const location = await getCurrentLocation();

      const distance = calculateDistance(
        location.latitude,

        location.longitude,

        OFFICE_LOCATION.latitude,

        OFFICE_LOCATION.longitude,
      );

      if (distance > OFFICE_LOCATION.allowedRadius) {
        Alert.alert('Outside office area');

        return;
      }

      await attendanceService.checkIn({
        userId,

        checkInTime: new Date(),

        checkInLocation: location,

        status: 'CHECKED_IN',
      });

      await loadAttendanceStatus();

      Alert.alert(
        'Success',

        'Checked In',
      );
    } catch (error) {
      Alert.alert(
        'Location Error',

        String(error),
      );
    }
  }

  async function handleCheckOut() {
    try {
      const location = await getCurrentLocation();

      await attendanceService.checkOut({
        userId,

        checkOutTime: new Date(),

        checkOutLocation: location,

        status: 'CHECKED_OUT',
      });

      await loadAttendanceStatus();

      Alert.alert(
        'Success',

        'Checked Out',
      );
    } catch (error) {
      Alert.alert(
        'Error',

        String(error),
      );
    }
  }

  return (
    <View>
      {checkedIn ? (
        <Button title="Check Out" onPress={handleCheckOut} />
      ) : (
        <Button title="Check In" onPress={handleCheckIn} />
      )}
    </View>
  );
}
