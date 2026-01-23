import { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useGeo } from "../context/GeoContext";
import { useWarehouse } from "../context/WarehouseContext";
import { geoMemory } from "../storage/geoMemory";
import { MOCK_LM, MOCK_WARDS } from "./MockData";

const ArchitectureTest = () => {
  const { geoState, updateGeo } = useGeo();
  const { wards, erfs } = useWarehouse();

  useEffect(() => {
    // 🎯 THE FIX: Manually stock the "General Geography" bucket
    // so GeoContext doesn't find 'undefined'
    if (!geoMemory.getMunicipality(MOCK_LM.id)) {
      console.log("🧪 Test Lab: Seeding Storage with Mock LM...");
      geoMemory.saveMunicipality(MOCK_LM);
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛡️ iREPS Logic Validator</Text>

      {/* --- TEST 1: LM BOOTSTRAP --- */}
      <View style={styles.card}>
        <Text style={styles.label}>Step 1: Bootstrap LM</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => updateGeo({ selectedLm: MOCK_LM })}
        >
          <Text style={styles.btnText}>Set LM to Knysna</Text>
        </TouchableOpacity>
        <Text>Current LM: {geoState.selectedLm?.name || "None"}</Text>
        <Text>Wards in Warehouse: {wards.length}</Text>
      </View>

      {/* --- TEST 2: WARD CASCADE --- */}
      <View style={styles.card}>
        <Text style={styles.label}>Step 2: Select Ward (Filter Erfs)</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {MOCK_WARDS.map((w) => (
            <TouchableOpacity
              key={w.pcode}
              style={[styles.btn, { flex: 1 }]}
              onPress={() => updateGeo({ selectedWard: w })}
            >
              <Text style={styles.btnText}>{w.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text>Selected Ward: {geoState.selectedWard?.name || "All"}</Text>
        <Text>Visible Erfs: {erfs.length}</Text>

        {/* Integrity Check */}
        {geoState.selectedWard && (
          <Text
            style={
              erfs.every((e) => e.wardPcode === geoState.selectedWard.pcode)
                ? styles.pass
                : styles.fail
            }
          >
            {erfs.every((e) => e.wardPcode === geoState.selectedWard.pcode)
              ? "✅ CASCADE SUCCESS"
              : "❌ FILTER LEAK"}
          </Text>
        )}
      </View>

      {/* --- TEST 3: RESET LOGIC --- */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#FF3B30", marginTop: 20 }]}
        onPress={() => updateGeo({ selectedLm: null })}
      >
        <Text style={styles.btnText}>☢️ FULL RESET</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#121212" },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  label: { color: "#007AFF", fontWeight: "bold", marginBottom: 10 },
  btn: { backgroundColor: "#007AFF", padding: 10, borderRadius: 5 },
  btnText: { color: "#fff", textAlign: "center" },
  pass: { color: "#4CD964", fontWeight: "bold", marginTop: 5 },
  fail: { color: "#FF3B30", fontWeight: "bold", marginTop: 5 },
});

export default ArchitectureTest;
