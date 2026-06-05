import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../domain/model';
import { FieldLabel, GradientSurface } from '../../components';
import { styles } from '../../theme/styles';

type VerifyOtpScreenProps = {
  email: string;
  otp: string;
  setOtp: (value: string) => void;
  handleVerifyOtp: () => void;
  error: string;
  message: string;
  isSubmitting: boolean;
  goBack: () => void;
};

export function VerifyOtpScreen(props: VerifyOtpScreenProps) {
  const { email, otp, setOtp, handleVerifyOtp, error, message, isSubmitting, goBack } = props;

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.centeredScroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.loginWrap}>
            <View style={styles.loginHeader}>
              <View style={styles.loginLogoWrap}>
                <View style={styles.loginLogoShell}>
                  <GradientSurface style={styles.loginLogoGradient} />
                  <Text style={styles.loginLogoIcon}>#</Text>
                </View>
              </View>
              <Text style={styles.loginTitle}>Verify OTP</Text>
              <Text style={styles.loginSubtitle}>Enter the code sent to your email</Text>
              <Text style={styles.authStepText}>{email}</Text>
            </View>

            <View style={styles.panel}>
              <FieldLabel label="OTP" />
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit code"
                placeholderTextColor={COLORS.textSoft}
                style={styles.input}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
              <Pressable onPress={handleVerifyOtp} style={styles.loginButton}>
                <GradientSurface style={styles.loginButtonGradient} />
                <Text style={styles.loginButtonText}>
                  {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </Pressable>
              {message ? <Text style={styles.formHelperText}>{message}</Text> : null}
              {error ? <Text style={styles.formErrorText}>{error}</Text> : null}
              <Pressable onPress={goBack}>
                <Text style={styles.loginHelpText}>Back</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
