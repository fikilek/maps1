import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";

import { Slot } from "expo-router";
import AuthBootstrap from "../src/navigation/AuthBootstrap";
import GuardedStack from "../src/navigation/GuardedStack";
import { store } from "../src/redux/store";

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Provider store={store}>
          {/* 🔑 GLOBAL AUTH LISTENER (never unmounts) */}
          <AuthBootstrap />
          <GuardedStack />
          <Slot />
        </Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
