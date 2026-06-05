import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, FeedbackCard, FormCard, InfoRow, ScreenHeader } from '../../components';
import { styles } from '../../theme/styles';
import type { ScreenRendererProps } from '../types';

type TaskDetailsScreenProps = Pick<
  ScreenRendererProps,
  | 'selectedTask'
  | 'goBack'
  | 'getUserName'
  | 'navigateTo'
  | 'currentUser'
  | 'loadEditForm'
>;

export function TaskDetailsScreen(props: TaskDetailsScreenProps) {
  const { selectedTask, goBack, getUserName, navigateTo, currentUser, loadEditForm } =
    props;

  if (!selectedTask) {
    return null;
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.formScroll}>
        <ScreenHeader title="Task Details" onBack={goBack} />

        <FormCard>
          <View>
           
            <Text style={styles.badge}>
              {selectedTask.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.detailsTitle}>{selectedTask.title}</Text>
          <Text style={styles.detailsDesc}>{selectedTask.description}</Text>
        </FormCard>

        <FormCard>
          <InfoRow label="Due Date" value={selectedTask.dueDate} />
          <InfoRow label="Assigned By" value={getUserName(selectedTask.assignedBy)} />
          <InfoRow label="Created On" value={selectedTask.createdAt} />
        </FormCard>

        {selectedTask.feedback ? (
          <FeedbackCard title="Previous Feedback" text={selectedTask.feedback} />
        ) : null}

        {selectedTask.status === 'in_progress' ? (
          <ActionButton
            title="Submit for Review"
            onPress={() => navigateTo('reviewTask', selectedTask.id)}
            variant="primary"
          />
        ) : null}
        {selectedTask.status === 'pending' ? (
          <ActionButton
            title="Accept or Reject Task"
            onPress={() => navigateTo('incomingTask', selectedTask.id)}
            variant="primary"
          />
        ) : null}
        {selectedTask.assignedBy === currentUser?.id ? (
          <ActionButton title="Edit Task" onPress={loadEditForm} variant="secondary" />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
