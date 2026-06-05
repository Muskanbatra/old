import React from 'react';
import { Pressable, Text } from 'react-native';
import { NavIcon } from '../../components';
import type { DashboardTab } from '../../domain/model';
import { styles } from '../../theme/styles';

type DashboardNavItemProps = {
  label: string;
  tab: DashboardTab;
  icon: string;
  activeTab: DashboardTab;
  onPress: (tab: DashboardTab) => void;
};

export function DashboardNavItem({
  label,
  tab,
  icon,
  activeTab,
  onPress,
}: DashboardNavItemProps) {
  return (
    <Pressable key={tab} onPress={() => onPress(tab)} style={styles.bottomNavItem}>
      <NavIcon name={icon} active={activeTab === tab} />
      <Text
        style={[
          styles.bottomNavText,
          activeTab === tab && styles.bottomNavTextActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}
