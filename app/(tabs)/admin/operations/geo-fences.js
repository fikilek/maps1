import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // 🚀 Import Router
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

export default function GeoFencesTemplate() {
  const router = useRouter(); // 🛰️ Initialize Router

  return (
    <View style={styles.container}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} />

      {/* TACTICAL OVERLAY */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
          <Text style={styles.toolTitle}>Polygon Architect</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.toolBtn}>
            <MaterialCommunityIcons
              name="vector-polygon-variant"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn}>
            <MaterialCommunityIcons
              name="content-save-outline"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  toolbar: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
  },
  toolbarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  backBtn: { marginRight: 4 },
  toolTitle: { color: "#fff", fontSize: 14, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 10 },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
});
