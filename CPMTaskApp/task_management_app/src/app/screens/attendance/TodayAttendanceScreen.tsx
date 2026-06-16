import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components';
import { styles } from '../../theme/styles';
import TodayAttendanceTable from './TodayAttendanceTable';

export function TodayAttendanceScreen({
  getUserName,
  goBack,
}: {
  getUserName: (id: string) => string;
  goBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={styles.formScroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Today's Report" onBack={goBack} />
        <TodayAttendanceTable getUserName={getUserName} />
      </ScrollView>
    </SafeAreaView>
  );
}
