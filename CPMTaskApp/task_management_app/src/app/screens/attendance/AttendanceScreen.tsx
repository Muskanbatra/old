import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { SuccessModal } from '../../components/modals/SuccessModal';
import { getCurrentLocation } from '../../utils/location';

import { attendanceService } from '../../services/attendance.service';

import { calculateDistance } from '../../utils/distance';
import { OFFICE_LOCATION } from '../../constants/ office';
import { styles } from '../../theme/styles';

type AttendanceScreenProps = {
  userId: string;
};

function ClockIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke="#FFFFFF"
        strokeWidth={2.2}
      />
      <Path
        d="M12 6.75V12L15.5 15.5"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function formatAttendanceTime(value?: string | Date | null) {
  if (!value) {
    return '--:--';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
const BYPASS_LOCATION_CHECK = true;

export default function AttendanceScreen({ userId }: AttendanceScreenProps) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccessModal = (message: string) => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }

    setSuccessMessage(message);
    setSuccessModalVisible(true);

    successTimerRef.current = setTimeout(() => {
      setSuccessModalVisible(false);
    }, 1600);
  };

  const loadAttendanceStatus = async () => {
    try {
      const response = await attendanceService.getAttendanceStatus(userId);

      const record = response.data;
      setAttendanceRecord(record);

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

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  async function handleCheckIn() {
    try {
      const location = await getCurrentLocation();

      const distance = calculateDistance(
        location.latitude,

        location.longitude,

        OFFICE_LOCATION.latitude,

        OFFICE_LOCATION.longitude,
      );

      if (!BYPASS_LOCATION_CHECK && distance > OFFICE_LOCATION.allowedRadius) {
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

      showSuccessModal('Checked In');
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

      showSuccessModal('Checked Out');
    } catch (error) {
      Alert.alert(
        'Error',

        String(error),
      );
    }
  }

  const actionTitle = checkedIn ? 'Check Out' : 'Check In';
  const displayTime = checkedIn
    ? attendanceRecord?.checkInTime
    : attendanceRecord?.checkOutTime ?? attendanceRecord?.checkInTime;
  const timeTitle = attendanceRecord?.checkOutTime
    ? 'Check out time'
    : 'Check in time';

  return (
    <>
      <View style={styles.attendanceHeroAction}>
        <View style={styles.attendanceHeroIconWrap}>
          <ClockIcon />
        </View>
        <View style={styles.attendanceHeroTextWrap}>
          <Text style={styles.attendanceHeroTitle}>{actionTitle}</Text>
          <Text style={styles.attendanceHeroSubtitle}>
            {timeTitle}: {formatAttendanceTime(displayTime)}
          </Text>
        </View>
        <Pressable
          onPress={checkedIn ? handleCheckOut : handleCheckIn}
          style={styles.attendanceHeroButton}
        >
          <Text style={styles.attendanceHeroButtonText}>{actionTitle}</Text>
        </Pressable>
      </View>
      <SuccessModal
        visible={successModalVisible}
        message={successMessage}
        onClose={() => setSuccessModalVisible(false)}
      />
    </>
  );
}
