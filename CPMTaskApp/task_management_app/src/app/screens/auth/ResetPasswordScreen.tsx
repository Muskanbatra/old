import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldLabel, GradientSurface, PasswordInput } from '../../components';
import { styles } from '../../theme/styles';

type ResetPasswordScreenProps = {
  email: string;
  newPassword: string;
  confirmPassword: string;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  handleResetPassword: () => void;
  error: string;
  message: string;
  isSubmitting: boolean;
  goBack: () => void;
};

export function ResetPasswordScreen(props: ResetPasswordScreenProps) {
  const {
    email,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    handleResetPassword,
    error,
    message,
    isSubmitting,
    goBack,
  } = props;

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
                  <Text style={styles.loginLogoIcon}>⚿</Text>
                </View>
              </View>
              <Text style={styles.loginTitle}>Set New Password</Text>
              <Text style={styles.loginSubtitle}>Choose a secure password for {email}</Text>
            </View>

            <View style={styles.panel}>
              <FieldLabel label="New Password" />
              <PasswordInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Please Enter Your New Password"
              />
              <FieldLabel label="Confirm Password" />
              <PasswordInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Please Confirm Your New Password"
              />
              <Pressable onPress={handleResetPassword} style={styles.loginButton}>
                <GradientSurface style={styles.loginButtonGradient} />
                <Text style={styles.loginButtonText}>
                  {isSubmitting ? 'Updating...' : 'Update Password'}
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
