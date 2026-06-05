import React from 'react';
import {
  ActiveTaskScreen,
  DashboardScreen,
  ForgotPasswordScreen,
  IncomingTaskScreen,
  LoginScreen,
  ManageUsersScreen,
  ManageTaskScreen,
  MyTasksScreen,
  NotificationsScreen,
  ProfileScreen,
  ResetPasswordScreen,
  ReviewTaskScreen,
  SplashScreen,
  TaskDetailsScreen,
  UserDetailsScreen,
  VerifyOtpScreen,
} from '../screens';
import type { ScreenRendererProps } from '../screens/types';

export type { ScreenRendererProps } from '../screens/types';

export function ScreenRenderer(props: ScreenRendererProps) {
  const { screen } = props;

  if (screen === 'splash') {
    return <SplashScreen progress={props.progress} />;
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        loginEmail={props.loginEmail}
        loginPassword={props.loginPassword}
        setLoginEmail={props.setLoginEmail}
        setLoginPassword={props.setLoginPassword}
        handleLogin={props.handleLogin}
        openForgotPassword={props.openForgotPassword}
        loginError={props.loginError}
        isLoggingIn={props.isLoggingIn}
      />
    );
  }

  if (screen === 'forgotPassword') {
    return (
      <ForgotPasswordScreen
        email={props.forgotPasswordEmail}
        setEmail={props.setForgotPasswordEmail}
        handleSendOtp={props.handleRequestPasswordReset}
        error={props.forgotPasswordError}
        message={props.forgotPasswordMessage}
        isSubmitting={props.isForgotPasswordSubmitting}
        goBack={props.goBack}
      />
    );
  }

  if (screen === 'verifyOtp') {
    return (
      <VerifyOtpScreen
        email={props.forgotPasswordEmail}
        otp={props.forgotPasswordOtp}
        setOtp={props.setForgotPasswordOtp}
        handleVerifyOtp={props.handleVerifyForgotPasswordOtp}
        error={props.forgotPasswordError}
        message={props.forgotPasswordMessage}
        isSubmitting={props.isForgotPasswordSubmitting}
        goBack={props.goBack}
      />
    );
  }

  if (screen === 'resetPassword') {
    return (
      <ResetPasswordScreen
        email={props.forgotPasswordEmail}
        newPassword={props.forgotPasswordNewPassword}
        confirmPassword={props.forgotPasswordConfirmPassword}
        setNewPassword={props.setForgotPasswordNewPassword}
        setConfirmPassword={props.setForgotPasswordConfirmPassword}
        handleResetPassword={props.handleResetPassword}
        error={props.forgotPasswordError}
        message={props.forgotPasswordMessage}
        isSubmitting={props.isForgotPasswordSubmitting}
        goBack={props.goBack}
      />
    );
  }

  if (screen === 'dashboard') {
    return (
      <DashboardScreen
        currentUser={props.currentUser}
        tasks={props.tasks}
        currentUserName={props.currentUser?.name}
        unreadNotifications={props.unreadNotifications}
        pushNotificationStatus={props.pushNotificationStatus}
        pushNotificationToken={props.pushNotificationToken}
        homeStats={props.homeStats}
        setScreen={props.setScreen}
        renderDashboardNavItem={props.renderDashboardNavItem}
        getUserName={props.getUserName}
        notifications={props.notifications}
        openNotification={props.openNotification}
      />
    );
  }

  if (screen === 'createTask' || screen === 'editTask') {
    return <ManageTaskScreen {...props} />;
  }

  if (screen === 'taskDetails' && props.selectedTask) {
    return <TaskDetailsScreen {...props} />;
  }

  if (screen === 'incomingTask' && props.selectedTask) {
    return <IncomingTaskScreen {...props} />;
  }

  if (screen === 'activeTask' && props.selectedTask) {
    return <ActiveTaskScreen {...props} />;
  }

  if (screen === 'reviewTask' && props.selectedTask) {
    return <ReviewTaskScreen {...props} />;
  }

  if (screen === 'notifications') {
    return <NotificationsScreen {...props} />;
  }

  if (screen === 'myTasks') {
    return <MyTasksScreen {...props} />;
  }

  if (screen === 'profile') {
    return <ProfileScreen {...props} />;
  }

  if (screen === 'manageUsers') {
    return <ManageUsersScreen {...props} />;
  }

  if (screen === 'userDetails') {
    return <UserDetailsScreen {...props} />;
  }

  return null;
}
