import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RejectTaskModal } from './src/app/components/modals/RejectTaskModal';
import { SuccessModal } from './src/app/components/modals/SuccessModal';
import { useTaskManagementApp } from './src/app/hooks/useTaskManagementApp';
import { COLORS } from './src/app/domain/model';
import { ScreenRenderer } from './src/app/navigation/ScreenRenderer';

function App() {
  const {
    activeScreen,
    screenRendererProps,
    rejectTaskModalProps,
    successModalProps,
  } = useTaskManagementApp();

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={
          activeScreen === 'splash' || activeScreen === 'activeTask'
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor={activeScreen === 'splash' ? COLORS.indigo : COLORS.bg}
      />

      <ScreenRenderer {...screenRendererProps} />
      <RejectTaskModal {...rejectTaskModalProps} />
      <SuccessModal {...successModalProps} />
    </SafeAreaProvider>
  );
}

export default App;
