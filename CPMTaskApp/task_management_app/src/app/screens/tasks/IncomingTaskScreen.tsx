import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, FieldLabel, FormCard, InfoRow, ScreenHeader } from '../../components';
import { styles } from '../../theme/styles';
import type { ScreenRendererProps } from '../types';

type IncomingTaskScreenProps = Pick<
  ScreenRendererProps,
  | 'selectedTask'
  | 'goBack'
  | 'getUserName'
  | 'getUserRole'
  | 'setShowRejectModal'
  | 'handleAcceptTask'
>;

export function IncomingTaskScreen(props: IncomingTaskScreenProps) {
  const {
    selectedTask,
    goBack,
    getUserName,
    getUserRole,
    setShowRejectModal,
    handleAcceptTask,
  } = props;

  if (!selectedTask) {
    return null;
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.formScroll}>
        <ScreenHeader title="Incoming Task" onBack={goBack} />

        <View style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <Text style={styles.alertIcon}>+</Text>
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.alertTitle}>New Task Assignment</Text>
            <Text style={styles.alertText}>
              {getUserName(selectedTask.assignedBy)} assigned you a new task. Please
              review and accept or reject it.
            </Text>
          </View>
        </View>

        <FormCard>
          <Text style={styles.detailsTitle}>{selectedTask.title}</Text>
          <Text style={styles.detailsDesc}>{selectedTask.description}</Text>
          <InfoRow label="Due Date" value={selectedTask.dueDate} />
          <InfoRow label="Created" value={selectedTask.createdAt} />
        </FormCard>

        <FormCard>
          <FieldLabel label="Assigned By" />
          <Text style={styles.assignedPerson}>{getUserName(selectedTask.assignedBy)}</Text>
          <Text style={styles.assignedRole}>{getUserRole(selectedTask.assignedBy)}</Text>
        </FormCard>

        <View style={styles.rowGap}>
          <ActionButton
            title="Reject"
            onPress={() => setShowRejectModal(true)}
            variant="secondary"
            narrow
          />
          <ActionButton
            title="Accept Task"
            onPress={() => handleAcceptTask(selectedTask.id)}
            variant="primary"
            narrow
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
