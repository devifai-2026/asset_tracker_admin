import React from 'react';
import Routes from './src/routes';
import 'react-native-reanimated';

import { Platform } from 'react-native';
import { Text, TextInput } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './src/Redux/store';
import { toastConfig } from './src/Components/toastConfig';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Define font family for Inter
const fontFamily = Platform.OS === 'ios' ? 'Inter' : 'Inter-Regular';

// Apply default font family to Text and TextInput components
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  style: [{ fontFamily: fontFamily }],
};

(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  style: [{ fontFamily: fontFamily }],
};

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Routes />
          <Toast config={toastConfig} />
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;