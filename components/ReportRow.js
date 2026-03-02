import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const ReportRow = ({ item }) => {
  // 🏷️ Construct the "Prop Type, name, unitNo" string (e.g. "Flats, Block A, A1")
  const propDesc = [
    item.propertyType?.type,
    item.propertyType?.name,
    item.propertyType?.unitNo,
  ]
    .filter((val) => val && val !== "")
    .join(", ");

  const hasMeter = !!item.meter;
  const isWater =
    item.meter?.meterType === "water" || item.meter?.type === "water";

  return (
    <View style={styles.tableRow}>
      {/* 🚀 COL 1: Erf No (flex: 1) */}
      <Text style={[styles.cell, { flex: 1, fontWeight: "900" }]}>
        {item.erfNo || "N/A"}
      </Text>

      {/* 🚀 COL 2: Premise Address (flex: 2) */}
      <View style={{ flex: 2 }}>
        <Text style={styles.addressText}>
          {`${item.address?.strNo || ""} ${item.address?.strName || ""}`}
        </Text>
      </View>

      {/* 🚀 COL 3: Prop Type/Name/Unit (flex: 2) */}
      <Text style={[styles.cell, { flex: 2, fontSize: 10, color: "#64748b" }]}>
        {propDesc || "Residential"}
      </Text>

      {/* 🚀 COL 4: Meter / Hardware (flex: 1.2) */}
      <View style={styles.meterCol}>
        {hasMeter ? (
          <View style={styles.meterPill}>
            <MaterialCommunityIcons
              name={isWater ? "water" : "lightning-bolt"}
              size={12}
              color={isWater ? "#3b82f6" : "#eab308"}
            />
            <Text style={styles.meterNo}>
              {item.meter?.ast?.astData?.astNo || "???"}
            </Text>
          </View>
        ) : (
          <Text style={styles.noMetersText}>No Meter</Text>
        )}
      </View>
    </View>
  );
};

export default ReportRow;

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cell: {
    fontSize: 11,
    color: "#334155",
  },
  addressText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e293b",
  },
  meterCol: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  meterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  meterNo: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0f172a",
    marginLeft: 4,
  },
  noMetersText: {
    fontSize: 10,
    color: "#94a3b8",
    fontStyle: "italic",
  },
});
