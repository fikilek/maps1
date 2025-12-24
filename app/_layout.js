import { Stack } from "expo-router";
import { Provider } from "react-redux";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PersistGate } from "redux-persist/integration/react";
import AuthBootstrap from "../src/redux/AuthBootstrap";
import { persistor, store } from "../src/redux/store";

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView mode="margin" style={{ flex: 1, backgroundColor: "white" }}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            {/* 🔑 keeps auth listener alive */}
            <AuthBootstrap />
            <Stack screenOptions={{ headerShown: false }} />
          </PersistGate>
        </Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
