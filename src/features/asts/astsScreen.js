import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useGeo } from "../../context/GeoContext";
import { useMap } from "../../context/MapContext";
import { useGetAstsByLmPcodeQuery } from "../../redux/astsApi";

const AstItem = ({ item }) => {
  const { flyTo } = useMap();
  const { setGeoState } = useGeo();
  const router = useRouter();

  // 🎯 DATA EXTRACTION
  const isWater = item.meterType === "water";
  const meterNo = item.ast?.astData?.astNo || "NO METER NO";
  const manufacturer = item.ast?.astData?.astManufacturer || "Unknown";
  const anomaly = item.ast?.anomalies?.anomaly || "Meter Ok";

  // 🏠 PREMISE ADDRESS (From accessData)
  const premiseAddress = item.accessData?.premise?.address || "Unknown Address";

  const handleGoToMap = () => {
    const targetErfId = item?.accessData?.erfId;
    const gps = item.ast?.location?.gps;

    if (targetErfId && gps) {
      setGeoState((prev) => ({
        ...prev,
        selectedErf: { id: targetErfId },
        selectedMeter: item,
      }));

      // ✈️ Execute the Point-Strike Flight
      flyTo([{ latitude: gps.lat, longitude: gps.lng }], 70);
      router.push("/(tabs)/maps");
    }
  };

  return (
    <View style={styles.card}>
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

        {/* 🏠 THE PREMISE ADDRESS ROW */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <MaterialCommunityIcons
            name="home-map-marker"
            size={14}
            color="#64748B"
          />
          <Text
            style={[
              styles.subDetail,
              { marginLeft: 4, color: "#1E293B", fontWeight: "600" },
            ]}
          >
            {premiseAddress}
          </Text>
        </View>

        <Text style={styles.subDetail}>
          {manufacturer} • {item.ast?.astData?.astName || "Standard"}
        </Text>

        <View style={styles.statusRow}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <MaterialCommunityIcons
              name={anomaly === "Meter Ok" ? "check-circle" : "alert-circle"}
              size={14}
              color={anomaly === "Meter Ok" ? "#10B981" : "#EF4444"}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: anomaly === "Meter Ok" ? "#10B981" : "#EF4444",
                  marginLeft: 4,
                },
              ]}
            >
              {anomaly}
            </Text>
          </View>

          <TouchableOpacity onPress={handleGoToMap} style={styles.mapButton}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// const AstItem = ({ item }) => {
//   console.log(`AstItem ----item`, item);
//   const { flyTo } = useMap();
//   const { setGeoState } = useGeo();
//   const router = useRouter();

//   const isWater = item.meterType === "water";
//   const meterNo = item.ast?.astData?.astNo || "NO METER NO";
//   const manufacturer = item.ast?.astData?.astManufacturer || "Unknown";
//   const anomaly = item.ast?.anomalies?.anomaly || "Meter Ok";

//   const handleGoToMap = () => {
//     // console.log(`AstItem ----handleGoToMap`);
//     // 🛡️ 1. Extract the target Erf ID and coordinate
//     const targetErfId = item?.accessData?.erfId; // Ensure your asset data has this
//     // console.log(`AstItem ----targetErfId`, targetErfId);

//     const gps = item.ast?.location?.gps;

//     if (targetErfId) {
//       console.log(
//         `✈️ Pilot: Assets detected. Navigating to parent Erf: ${targetErfId}`,
//       );

//       // 🎯 THE SOVEREIGN UPDATE:
//       // We set the selectedErf using the ID.
//       // The Map's useEffect is already watching this ID!
//       setGeoState((prev) => ({
//         ...prev,
//         selectedErf: { id: targetErfId }, // Trigger the golden border and flight
//         selectedMeter: item, // Optional: for future Level 4 marker logic
//       }));
//       flyTo([{ latitude: gps.lat, longitude: gps.lng }], 70);
//       router.push("/(tabs)/maps");
//     } else if (gps) {
//       // 🛰️ Fallback: If no Erf ID is linked, fly to raw GPS
//       console.log("🛰️ Pilot: No Erf ID found. Executing raw GPS flight.");
//       // You can call your MapContext flyTo directly if needed
//       router.push("/(tabs)/maps");
//     }
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

//         <Text style={styles.subDetail}>
//           {manufacturer} • {item.ast?.astData?.astName || "Standard"}
//         </Text>

//         <View style={styles.statusRow}>
//           <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
//             <MaterialCommunityIcons
//               name={anomaly === "Meter Ok" ? "check-circle" : "alert-circle"}
//               size={14}
//               color={anomaly === "Meter Ok" ? "#10B981" : "#EF4444"}
//             />
//             <Text
//               style={[
//                 styles.statusText,
//                 {
//                   color: anomaly === "Meter Ok" ? "#10B981" : "#EF4444",
//                   marginLeft: 4,
//                 },
//               ]}
//             >
//               {anomaly}
//             </Text>
//           </View>

//           {/* 🎯 The Standard Map Navigation Icon */}
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

export default function AstsScreen() {
  const { geoState } = useGeo();
  const lmPcode = geoState?.selectedLm?.id;

  const {
    data: asts,
    isLoading,
    isError,
  } = useGetAstsByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });

  // 🏛️ 1. Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Fetching Assets...</Text>
      </View>
    );
  }

  // 🏛️ 2. Error State (Optional but good for demos)
  if (isError) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color="#EF4444"
        />
        <Text style={styles.errorText}>Failed to load assets.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={asts}
        renderItem={({ item }) => <AstItem item={item} />}
        estimatedItemSize={100}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text style={styles.subtitle}>No meters found in this area.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  // 🎯 Added for centering the spinner
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
  listHeader: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  subtitle: { fontSize: 14, color: "#64748B" },
  // ... rest of your styles remain unchanged ...
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
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
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  mapButton: {
    padding: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
});
