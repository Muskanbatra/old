import React from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { ActionButton } from '../../components';
import { COLORS } from '../../domain/model';
import { styles } from '../../theme/styles';

type RejectTaskModalProps = {
  visible: boolean;
  reason: string;
  onChangeReason: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RejectTaskModal({
  visible,
  reason,
  onChangeReason,
  onCancel,
  onConfirm,
}: RejectTaskModalProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <Text style={styles.modalTitle}>Reject Task</Text>
          <Text style={styles.modalText}>Add a reason for rejecting this task.</Text>
          <TextInput
            value={reason}
            onChangeText={onChangeReason}
            placeholder="Enter your reason"
            placeholderTextColor={COLORS.textSoft}
            style={[styles.inputNoMargin, styles.textArea]}
            multiline
          />
          <View style={styles.rowGap}>
            <ActionButton title="Cancel" onPress={onCancel} variant="secondary" narrow />
            <ActionButton
              title="Confirm Reject"
              onPress={onConfirm}
              variant="danger"
              narrow
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
