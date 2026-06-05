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

type ForgotPasswordScreenProps = {
  email: string;
  setEmail: (value: string) => void;
  handleSendOtp: () => void;
  error: string;
  message: string;
  isSubmitting: boolean;
  goBack: () => void;
};

export function ForgotPasswordScreen(props: ForgotPasswordScreenProps) {
  const { email, setEmail, handleSendOtp, error, message, isSubmitting, goBack } = props;

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
                  <Text style={styles.loginLogoIcon}>✉</Text>
                </View>
              </View>
              <Text style={styles.loginTitle}>Forgot Password</Text>
              <Text style={styles.loginSubtitle}>We&apos;ll send a one-time code to your email</Text>
            </View>

            <View style={styles.panel}>
              <FieldLabel label="Email" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Please Enter Your Email"
                placeholderTextColor={COLORS.textSoft}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable onPress={handleSendOtp} style={styles.loginButton}>
                <GradientSurface style={styles.loginButtonGradient} />
                <Text style={styles.loginButtonText}>
                  {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                </Text>
              </Pressable>
              {message ? <Text style={styles.formHelperText}>{message}</Text> : null}
              {error ? <Text style={styles.formErrorText}>{error}</Text> : null}
              <Pressable onPress={goBack}>
                <Text style={styles.loginHelpText}>Back to sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
