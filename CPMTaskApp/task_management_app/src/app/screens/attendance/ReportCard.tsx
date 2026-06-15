import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ReportCardProps = {
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  onPress?: () => void;
};

export const ReportCard = ({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  onPress,
}: ReportCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <ReportCardIcon name={icon} color={iconColor} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.arrow}>
        <ChevronIcon />
      </View>
    </Pressable>
  );
};

function ReportCardIcon({ name, color }: { name: string; color: string }) {
  if (name.includes('people')) {
    return (
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8.75 11.25C10.5449 11.25 12 9.79493 12 8C12 6.20507 10.5449 4.75 8.75 4.75C6.95507 4.75 5.5 6.20507 5.5 8C5.5 9.79493 6.95507 11.25 8.75 11.25Z"
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M3.75 19.25C4.35 16.75 6.12 15.5 9.06 15.5C11.99 15.5 13.73 16.75 14.25 19.25"
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M15.25 11.25C16.9069 11.25 18.25 9.90685 18.25 8.25C18.25 6.59315 16.9069 5.25 15.25 5.25"
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16.25 15.75C18.45 16.08 19.78 17.25 20.25 19.25"
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.25 3.75V6.25M16.75 3.75V6.25M4.75 9.25H19.25"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.75 5.25H17.25C18.3546 5.25 19.25 6.14543 19.25 7.25V17.25C19.25 18.3546 18.3546 19.25 17.25 19.25H6.75C5.64543 19.25 4.75 18.3546 4.75 17.25V7.25C4.75 6.14543 5.64543 5.25 6.75 5.25Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.75 13.25H8.76M12 13.25H12.01M15.25 13.25H15.26M8.75 16H8.76M12 16H12.01"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke="#7C74FF"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#E8E6FF',

  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7B8090',
    lineHeight: 16,
  },

  arrow: {
    position: 'absolute',
    bottom: 14,
    right: 14,
  },
});
