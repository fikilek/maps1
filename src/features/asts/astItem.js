import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";

const AstItem = ({ item }) => {
  const { updateGeo } = useGeo();
  const { all } = useWarehouse();
  const router = useRouter();

  // 🎯 DATA EXTRACTION
  const isWater = item.meterType === "water";
  const meterNo = item.ast?.astData?.astNo || "NO METER NO";
  const manufacturer = item.ast?.astData?.astManufacturer || "Unknown";
  const anomaly = item.ast?.anomalies?.anomaly || "Meter Ok";
  const premiseAddress = item.accessData?.premise?.address || "Unknown Address";

  const handleGoToDetails = () => {
    const meterNo = item.ast?.astData?.astNo;
    const docId = item.id;

    router.push({
      pathname: "/(tabs)/asts/details",
      params: {
        docId: docId,
        astNo: meterNo || "UNKNOWN",
      },
    });
  };

  const handleGoToReport = () => {
    const meterNo = item.ast?.astData?.astNo;
    const id = item.id;

    if (!meterNo) {
      console.warn("⚠️ Asset missing Meter Number, using ID only");
    }

    // 🚀 THE DUAL STRIKE ROUTE
    // Path: /(tabs)/asts/W776644?docId=dN4v3olUYSSsqCS6DNRw
    router.push({
      pathname: `/(tabs)/asts/${id || "UNKNOWN"}`,
      params: { astNo: meterNo },
    });
  };

  const handleGoToMedia = () => {
    const meterNo = item.ast?.astData?.astNo;
    const id = item.id;

    router.push({
      pathname: "/(tabs)/asts/media",
      params: {
        astNo: meterNo || "UNKNOWN",
        id: id,
      },
    });
  };

  const handleGoToMap = () => {
    const meter = item;
    const premiseId = meter?.accessData?.premise?.id;
    const erfId = meter?.accessData?.erfId;

    const parentPremise = all?.prems?.find((p) => p.id === premiseId);
    const parentErf = all?.erfs?.find((e) => e.id === erfId);

    updateGeo({
      selectedErf: parentErf || { id: erfId },
      lastSelectionType: "ERF",
    });
    updateGeo({
      selectedPremise: parentPremise || null,
      lastSelectionType: "PREMISE",
    });
    updateGeo({
      selectedMeter: meter,
      lastSelectionType: "METER",
    });

    router.push("/(tabs)/maps");
  };

  return (
    <View style={styles.card}>
      <View style={styles.mainContent}>
        {/* 🏛️ LEFT: ICON */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isWater ? "#EFF6FF" : "#FEFCE8" },
            ]}
          >
            <MaterialCommunityIcons
              name={isWater ? "water-outline" : "lightning-bolt-outline"}
              size={24}
              color={isWater ? "#3B82F6" : "#EAB308"}
            />
          </View>
        </View>

        {/* 🏛️ RIGHT: DATA */}
        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.meterNo}>{meterNo}</Text>
            <View
              style={[
                styles.typeBadge,
                { borderColor: isWater ? "#3B82F6" : "#EAB308" },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: isWater ? "#3B82F6" : "#EAB308" },
                ]}
              >
                {item.meterType?.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <MaterialCommunityIcons
              name="home-map-marker"
              size={14}
              color="#64748B"
            />
            <Text style={styles.addressText}>{premiseAddress}</Text>
          </View>

          <Text style={styles.subDetail}>
            {manufacturer} • {item.ast?.astData?.astName || "Standard"}
          </Text>
        </View>
      </View>

      {/* 🏛️ NEW: EXTREME LEFT-TO-RIGHT ACTION ROW */}
      <View style={styles.fullWidthActionRow}>
        <View style={styles.statusInfo}>
          <MaterialCommunityIcons
            name={anomaly === "Meter Ok" ? "check-circle" : "alert-circle"}
            size={14}
            color={anomaly === "Meter Ok" ? "#10B981" : "#EF4444"}
          />
          <Text
            style={[
              styles.statusLabel,
              { color: anomaly === "Meter Ok" ? "#10B981" : "#EF4444" },
            ]}
          >
            {anomaly}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={handleGoToDetails}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#475569"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoToMedia}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons
              name="camera-outline"
              size={20}
              color="#475569"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoToReport}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons
              name="file-chart-outline"
              size={20}
              color="#475569"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoToMap}
            style={[styles.actionButton, styles.mapButtonHighlight]}
          >
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={20}
              color="#3B82F6"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// const AstItem = ({ item }) => {
//   const { updateGeo } = useGeo();
//   const { all } = useWarehouse();
//   const router = useRouter();

//   const isWater = item.meterType === "water";
//   const meterNo = item.ast?.astData?.astNo || "NO METER NO";
//   const manufacturer = item.ast?.astData?.astManufacturer || "Unknown";
//   const anomaly = item.ast?.anomalies?.anomaly || "Meter Ok";
//   const premiseAddress = item.accessData?.premise?.address || "Unknown Address";

//   const handleGoToMap = () => {
//     const meter = item;
//     const premiseId = meter?.accessData?.premise?.id;
//     const erfId = meter?.accessData?.erfId;

//     const parentPremise = all?.prems?.find((p) => p.id === premiseId);
//     const parentErf = all?.erfs?.find((e) => e.id === erfId);

//     updateGeo({
//       selectedErf: parentErf || { id: erfId },
//       lastSelectionType: "ERF",
//     });
//     updateGeo({
//       selectedPremise: parentPremise || null,
//       lastSelectionType: "PREMISE",
//     });
//     updateGeo({
//       selectedMeter: meter,
//       lastSelectionType: "METER",
//     });

//     router.push("/(tabs)/maps");
//   };

//   return (
//     <View style={styles.card}>
//       <View style={styles.iconContainer}>
//         <View
//           style={[
//             styles.iconCircle,
//             { backgroundColor: isWater ? "#EFF6FF" : "#FEFCE8" },
//           ]}
//         >
//           <MaterialCommunityIcons
//             name={isWater ? "water-outline" : "lightning-bolt-outline"}
//             size={24}
//             color={isWater ? "#3B82F6" : "#EAB308"}
//           />
//         </View>
//       </View>

//       <View style={styles.details}>
//         <View style={styles.row}>
//           <Text style={styles.meterNo}>{meterNo}</Text>
//           <View
//             style={[
//               styles.typeBadge,
//               { borderColor: isWater ? "#3B82F6" : "#EAB308" },
//             ]}
//           >
//             <Text
//               style={[
//                 styles.typeBadgeText,
//                 { color: isWater ? "#3B82F6" : "#EAB308" },
//               ]}
//             >
//               {item.meterType?.toUpperCase()}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.addressRow}>
//           <MaterialCommunityIcons
//             name="home-map-marker"
//             size={14}
//             color="#64748B"
//           />
//           <Text style={styles.addressText}>{premiseAddress}</Text>
//         </View>

//         <Text style={styles.subDetail}>
//           {manufacturer} • {item.ast?.astData?.astName || "Standard"}
//         </Text>

//         <View style={styles.statusRow}>
//           <View style={styles.statusInfo}>
//             <MaterialCommunityIcons
//               name={anomaly === "Meter Ok" ? "check-circle" : "alert-circle"}
//               size={14}
//               color={anomaly === "Meter Ok" ? "#10B981" : "#EF4444"}
//             />
//             <Text
//               style={[
//                 styles.statusLabel,
//                 { color: anomaly === "Meter Ok" ? "#10B981" : "#EF4444" },
//               ]}
//             >
//               {anomaly}
//             </Text>
//           </View>

//           <TouchableOpacity onPress={handleGoToMap} style={styles.mapButton}>
//             <MaterialCommunityIcons
//               name="map-marker-radius"
//               size={22}
//               color="#64748B"
//             />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// };

export default AstItem;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 8 },

  iconContainer: { marginRight: 16 },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  details: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  meterNo: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeText: { fontSize: 9, fontWeight: "900" },

  subDetail: { fontSize: 13, color: "#64748B", marginBottom: 8 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  statusLabel: { fontSize: 12, fontWeight: "700", marginLeft: 4 },
  mapButton: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 8 },

  buttonGroup: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mapButtonHighlight: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressText: {
    marginLeft: 4,
    color: "#1E293B",
    fontWeight: "600",
    fontSize: 12,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    // Remove flexDirection: 'row' here so content stacks vertically
  },
  mainContent: {
    flexDirection: "row", // Keep icon and text side-by-side
    padding: 16,
    alignItems: "center",
  },
  fullWidthActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9", // Subtle divider
    backgroundColor: "#F8FAFC", // Light slate floor
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});
