// /app/(tabs)/admin/reports/components/DateRangeModal.js
import { getDateRange } from "@/src/utils/dateHelpers";
import { Modal, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Divider, Surface } from "react-native-paper";

export default function DateRangeModal({ visible, onClose, onSelect }) {
  const options = [
    { label: "All Time", key: "ALL" },
    { label: "Today", key: "TODAY" },
    { label: "Yesterday", key: "YESTERDAY" },
    { label: "Last 7 Days", key: "WEEK" },
    { label: "This Month", key: "MONTH" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Surface style={styles.content} elevation={5}>
          <Text style={styles.title}>SELECT DATE RANGE</Text>
          <Divider style={styles.divider} />

          {options.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.optionBtn}
              onPress={() => {
                const range = getDateRange(opt.key);
                onSelect(range);
                onClose();
              }}
            >
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </Surface>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    marginBottom: 15,
    textAlign: "center",
    letterSpacing: 1,
  },
  divider: { marginBottom: 10 },
  optionBtn: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },
  optionText: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  cancelBtn: { marginTop: 15, paddingVertical: 10, alignItems: "center" },
  cancelText: { color: "#ef4444", fontWeight: "bold", fontSize: 12 },
});
