import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Portal, Surface, Text } from "react-native-paper";

/**
 * 🔒 MISSION LOCK
 * Prevents user interaction during sensitive data transmissions.
 */
export const ScreenLock = ({
  visible,
  title = "SYNCING TO LEDGER",
  status = "Uploading forensic evidence...",
}) => {
  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.mask}>
        <Surface style={styles.dialog} elevation={5}>
          <ActivityIndicator size="large" color="#3B82F6" />

          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.status}>{status}</Text>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              DO NOT CLOSE THE APP OR NAVIGATE AWAY
            </Text>
          </View>
        </Surface>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.85)", // Deep Navy/Slate - Very professional
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000, // Above everything
  },
  dialog: {
    width: "100%",
    height: "100%",
    // flex: 1,
    // padding: 30,
    // borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    marginTop: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1.5,
    textAlign: "center",
    textTransform: "uppercase",
  },
  status: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  warningBox: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    width: "100%",
  },
  warningText: {
    fontSize: 9,
    color: "#EF4444", // Forensic Red
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
