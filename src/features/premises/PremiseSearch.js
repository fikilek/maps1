import { useEffect, useState } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import { IconButton, Surface } from "react-native-paper";

export const PremiseSearch = ({ visible, onClose, value, onChange }) => {
  const [keyboardHeight] = useState(new Animated.Value(0));

  useEffect(() => {
    // 🛰️ Listen for keyboard pops
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        Animated.spring(keyboardHeight, {
          toValue: e.endCoordinates.height,
          useNativeDriver: false, // Layout properties don't support native driver
          friction: 8,
        }).start();
      },
    );

    // 🛰️ Listen for keyboard drops
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        Animated.spring(keyboardHeight, {
          toValue: 0,
          useNativeDriver: false,
          friction: 8,
        }).start();
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.searchWrapper,
        { bottom: Animated.add(keyboardHeight, 0) }, // 🎯 Pins it exactly 20px above keyboard
      ]}
    >
      <Surface style={styles.searchBar} elevation={5}>
        <IconButton icon="magnify" size={24} iconColor="#64748b" />
        <TextInput
          style={styles.input}
          placeholder="Search Address or Erf..."
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChange}
          autoFocus
          returnKeyType="search"
        />
        <IconButton
          icon="close-circle"
          size={24}
          iconColor="#ef4444"
          onPress={() => {
            onChange("");
            onClose();
            Keyboard.dismiss(); // 🎯 Close keyboard too
          }}
        />
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  searchWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: 56,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "700",
  },
});
