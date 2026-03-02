import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

export const ExportIntelligenceModal = ({ visible, onClose, onExport }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>EXPORT INTELLIGENCE</Text>
          <IconButton icon="close" size={20} onPress={onClose} />
        </View>

        <TouchableOpacity style={styles.option} onPress={onExport}>
          <IconButton icon="file-delimited" iconColor="#10b981" size={30} />
          <View>
            <Text style={styles.optionTitle}>CSV Spreadsheet</Text>
            <Text style={styles.optionSub}>
              Standard format for Excel & Management
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          File will be generated and opened in the system share sheet.
        </Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  content: { backgroundColor: "white", borderRadius: 20, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#1e293b",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionTitle: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
  optionSub: { fontSize: 11, color: "#64748b" },
  footerNote: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
});
