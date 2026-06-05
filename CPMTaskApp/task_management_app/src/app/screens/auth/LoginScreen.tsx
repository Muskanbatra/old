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
import { FieldLabel, GradientSurface, PasswordInput } from '../../components';
import { styles } from '../../theme/styles';

type LoginScreenProps = {
  loginEmail: string;
  loginPassword: string;
  setLoginEmail: (value: string) => void;
  setLoginPassword: (value: string) => void;
  handleLogin: () => void;
  openForgotPassword: () => void;
  loginError: string;
  isLoggingIn: boolean;
};

export function LoginScreen(props: LoginScreenProps) {
  const {
    loginEmail,
    loginPassword,
    setLoginEmail,
    setLoginPassword,
    handleLogin,
    openForgotPassword,
    loginError,
    isLoggingIn,
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
                  <Text style={styles.loginLogoIcon}>✓</Text>
                </View>
              </View>
              <Text style={styles.loginTitle}>Welcome Back</Text>
              <Text style={styles.loginSubtitle}>
                Sign in to continue to TaskFlow
              </Text>
            </View>
            {loginError ? (
              <Text style={styles.formErrorText}>{loginError}</Text>
            ) : null}
            <View style={styles.panel}>
              <FieldLabel label="Email" />
              <TextInput
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="Please Enter Your Email"
                placeholderTextColor={COLORS.textSoft}
                style={styles.input}
                autoCapitalize="none"
              />
              <FieldLabel label="Password" />
              <PasswordInput
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="Please Enter Your Password"
              />
              <Pressable onPress={handleLogin} style={styles.loginButton}>
                <GradientSurface style={styles.loginButtonGradient} />
                <Text style={styles.loginButtonText}>
                  {isLoggingIn ? 'Signing In...' : 'Sign In'}
                </Text>
              </Pressable>

              <Pressable onPress={openForgotPassword}>
                <Text style={styles.loginHelpText}>Forgot password?</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
