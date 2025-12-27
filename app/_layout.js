import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";

import { Slot } from "expo-router";
import { PaperProvider } from "react-native-paper";
import AuthBootstrap from "../src/navigation/AuthBootstrap";
import GuardedStack from "../src/navigation/GuardedStack";
import { store } from "../src/redux/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <SafeAreaProvider style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
            {/* 🔑 GLOBAL AUTH LISTENER (never unmounts) */}
            <AuthBootstrap />
            <GuardedStack />
            <Slot />
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
}
