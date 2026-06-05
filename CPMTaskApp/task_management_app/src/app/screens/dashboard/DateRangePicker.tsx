import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { ActionButton, GradientSurface } from '../../components';
import { styles } from '../../theme/styles';

export type DateRange = {
  startDate: string;
  endDate: string;
};

const RANGE_DAYS = 7;

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateFromValue(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getInclusiveDayCount(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = getDateFromValue(startDate);
  const end = getDateFromValue(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function isDateInRange(dateValue: string, range: DateRange) {
  return Boolean(
    range.startDate &&
    range.endDate &&
    dateValue >= range.startDate &&
    dateValue <= range.endDate,
  );
}

export function DateRangePicker({
  visible,
  value,
  onClose,
  onApply,
}: {
  visible: boolean;
  value: DateRange;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}) {
  const [draftRange, setDraftRange] = useState<DateRange>(value);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(
      getDateFromValue(value.startDate).getFullYear(),
      getDateFromValue(value.startDate).getMonth(),
      1,
    ),
  );
  const [error, setError] = useState('');
  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const monthOffset = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const calendarDays = Array.from(
    { length: monthOffset + daysInMonth },
    (_, index) => {
      if (index < monthOffset) {
        return null;
      }

      return new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        index - monthOffset + 1,
      );
    },
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    const startDate = getDateFromValue(value.startDate);
    setDraftRange(value);
    setVisibleMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
    setError('');
  }, [value, visible]);

  const handleSelectDate = (date: Date) => {
    const dateValue = formatDateValue(date);

    setError('');

    if (!draftRange.startDate || draftRange.endDate || dateValue < draftRange.startDate) {
      setDraftRange({ startDate: dateValue, endDate: '' });
      return;
    }

    setDraftRange(prev => ({ ...prev, endDate: dateValue }));
  };

  const handleApply = () => {
    if (getInclusiveDayCount(draftRange.startDate, draftRange.endDate) !== RANGE_DAYS) {
      setError('Select exactly 7 days.');
      return;
    }

    onApply(draftRange);
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlayCenter} onPress={onClose}>
        <Pressable style={styles.pickerModalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Select Date Range</Text>
          <Text style={styles.modalText}>Select exactly 7 days.</Text>

          <View style={styles.calendarHeader}>
            <Pressable
              onPress={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              style={styles.calendarNavButton}
            >
              <Text style={styles.calendarNavButtonText}>‹</Text>
            </Pressable>
            <Text style={styles.calendarMonthText}>{monthLabel}</Text>
            <Pressable
              onPress={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              style={styles.calendarNavButton}
            >
              <Text style={styles.calendarNavButtonText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.calendarWeekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.calendarWeekdayText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.calendarDayPlaceholder} />;
              }

              const dateValue = formatDateValue(date);
              const isSelected =
                dateValue === draftRange.startDate || dateValue === draftRange.endDate;
              const isInRange = isDateInRange(dateValue, draftRange);

              return (
                <Pressable
                  key={dateValue}
                  onPress={() => handleSelectDate(date)}
                  style={[
                    styles.calendarDayButton,
                    isInRange && styles.calendarDayButtonActive,
                  ]}
                >
                  {isSelected ? <GradientSurface style={styles.calendarDayGradient} /> : null}
                  <Text
                    style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextActive,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.inlineFieldError}>{error}</Text> : null}

          <View style={styles.rowGap}>
            <ActionButton title="Cancel" onPress={onClose} variant="secondary" narrow />
            <ActionButton title="Apply" onPress={handleApply} variant="primary" narrow />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
