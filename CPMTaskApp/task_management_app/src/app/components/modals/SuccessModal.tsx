import React from 'react';
import { Modal, Text, View } from 'react-native';
import { styles } from '../../theme/styles';

type SuccessModalProps = {
  visible: boolean;
  message: string;
  onClose: () => void;
};

export function SuccessModal({ visible, message, onClose }: SuccessModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlayCenter}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrap}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Success</Text>
          <Text style={styles.successText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}
