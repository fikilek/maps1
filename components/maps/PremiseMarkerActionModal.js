import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function PremiseMarkerActionModal({
  visible,
  premise,
  onClose,
  onOpenMeterDiscovery,
  onAdjustPosition,
}) {
  if (!visible || !premise) return null;

  const erfNo = premise?.erfNo || "?";
  const typeName = premise?.propertyType?.name || "";
  const unitNo = premise?.propertyType?.unitNo || "";
  const title = `Erf ${erfNo}`;
  const subtitle =
    typeName && unitNo ? `${typeName}-${unitNo}` : typeName || "Premise";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenMeterDiscovery}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name="counter"
                size={18}
                color="#2563EB"
              />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Open Meter Discovery</Text>
              <Text style={styles.actionSub}>
                Continue to premise discovery workflow
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onAdjustPosition}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={18}
                color="#059669"
              />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Adjust Position</Text>
              <Text style={styles.actionSub}>
                Fine-tune the marker location on the map
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default PremiseMarkerActionModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.28)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },

  header: {
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  actionTextWrap: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },

  actionSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },

  cancelBtn: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#EF4444",
  },
});
