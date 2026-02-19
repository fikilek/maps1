import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGeo } from "../src/context/GeoContext";

export default function GeoStatusHUD() {
  const { geoState, updateGeo } = useGeo();
  const {
    selectedLm,
    selectedWard,
    selectedErf,
    selectedPremise,
    selectedMeter,
  } = geoState;

  // 🎯 THE NUCLEAR RESET: Clears every level of the context
  const handleClearAll = () => {
    // 🏛️ The "Nuclear" UI Reset
    updateGeo({
      selectedLm: geoState.selectedLm,
      lastSelectionType: "LM",
    });
  };

  return (
    <View style={styles.hudContainer}>
      {/* 🏛️ TABLE LAYOUT */}
      <View style={styles.table}>
        {/* ROW 1: LABELS */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Lm</Text>
          <Text style={styles.headerText}>Ward</Text>
          <Text style={styles.headerText}>Erf</Text>
          <Text style={[styles.headerText, { flex: 2 }]}>Premise</Text>
          <Text style={styles.headerText}>Meter</Text>
        </View>

        {/* ROW 2: VALUES */}
        <View style={styles.valueRow}>
          <Text style={styles.valueText} numberOfLines={1}>
            {selectedLm?.name || "---"}
          </Text>
          <Text style={styles.valueText}>
            {selectedWard?.code ||
              selectedWard?.name?.replace(/\D/g, "") ||
              "---"}
          </Text>
          <Text style={styles.valueText}>{selectedErf?.erfNo || "---"}</Text>

          <View style={[styles.valueCell, { flex: 2 }]}>
            <Text style={styles.premMainText} numberOfLines={1}>
              {selectedPremise?.address?.strNo}{" "}
              {selectedPremise?.address?.strName}
            </Text>
            {selectedPremise?.propertyType?.name && (
              <Text style={styles.premSubText} numberOfLines={1}>
                {selectedPremise.propertyType.name}
              </Text>
            )}
          </View>

          <Text style={styles.valueText}>
            {selectedMeter?.ast?.astData?.astNo || "---"}
          </Text>
        </View>
      </View>

      {/* 🚀 THE INTEGRATED CLEAR BUTTON */}
      <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
        <MaterialCommunityIcons name="refresh-circle" size={24} color="white" />
        <Text style={styles.clearText}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    overflow: "hidden",
    elevation: 4,
  },
  table: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  headerText: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: 4,
    color: "#64748b",
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  valueRow: { flexDirection: "row", alignItems: "center" },
  valueText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  valueCell: {
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
    justifyContent: "center",
  },
  premMainText: { fontSize: 11, fontWeight: "900", textAlign: "center" },
  premSubText: { fontSize: 9, color: "#64748b", textAlign: "center" },
  clearBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  clearText: { color: "white", fontSize: 10, fontWeight: "900", marginTop: -2 },
});
