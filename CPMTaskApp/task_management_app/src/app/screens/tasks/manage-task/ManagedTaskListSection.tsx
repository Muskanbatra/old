import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '../../../components';
import { styles } from '../../../theme/styles';

export function ManagedTaskListSection({
  isTasksLoading,
  taskCount,
  emptyTitle = 'No tasks here',
  emptySubtitle = 'This manage tab does not have any tasks yet.',
  children,
}: {
  isTasksLoading: boolean;
  taskCount: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  children: React.ReactNode;
}) {
  if (isTasksLoading) {
    return <EmptyState title="Loading tasks" subtitle="Pulling the latest task data." />;
  }

  if (!taskCount) {
    return (
      <EmptyState
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    );
  }

  return <View style={styles.manageTaskListTight}>{children}</View>;
}
