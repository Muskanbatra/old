import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { GradientSurface } from '../../../components';
import { ManageTab } from '../../../domain/model';
import { styles } from '../../../theme/styles';

const manageTabs = [
  { key: 'create' as ManageTab, label: 'Create Task' },
  { key: 'created' as ManageTab, label: 'Task Created' },
  { key: 'review' as ManageTab, label: 'Task Review' },

  { key: 'done' as ManageTab, label: 'Done Task' },
];

export function ManageTaskTabs({
  activeTab,
  onPress,
}: {
  activeTab: ManageTab;
  onPress: (tab: ManageTab) => void;
}) {
  return (
    <ScrollView
      horizontal
      style={styles.manageTabsTight}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.myTasksTabScrollContent}
    >
      <View style={styles.myTasksTabRow}>
        {manageTabs.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => onPress(tab.key)}
            style={[
              styles.myTasksTabButton,
              activeTab === tab.key && styles.myTasksTabButtonActive,
            ]}
          >
            {activeTab === tab.key ? (
              <GradientSurface style={styles.myTasksTabGradient} />
            ) : null}
            <Text
              style={[
                styles.myTasksTabText,
                activeTab === tab.key && styles.myTasksTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
