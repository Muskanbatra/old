import React, { useState } from 'react';

import { View, Button, Alert } from 'react-native';

import { getCurrentLocation } from '../../utils/location';

import { attendanceService } from '../../services/attendance.service';

import { calculateDistance } from '../../utils/distance';
import { OFFICE_LOCATION } from '../../constants/ office';


export default function AttendanceScreen() {
  const [checkedIn, setCheckedIn] = useState(false);

  const userId = '123';

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

      setCheckedIn(true);

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

      setCheckedIn(false);

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
