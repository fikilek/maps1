import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OperationsHub() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          <OpCard
            title="Operational Teams"
            subtitle="Personnel deployment & allocation"
            icon="account-group"
            color="#2563eb"
            onPress={() => router.push("/admin/operations/teams")}
          />

          {/* 🎯 THE FINANCIAL STRIKE: Revenue Analytics */}
          <OpCard
            title="Revenue Analytics"
            subtitle="Analysis of LM Prepaid Revenues"
            icon="currency-usd"
            color="#0891b2" // Cyan/Deep Blue for Financials
            onPress={() => router.push("/admin/operations/revenue-analytics")}
          />

          <OpCard
            title="Geo-Fencing"
            subtitle="Geospatial work jurisdictions"
            icon="vector-polygon"
            color="#8b5cf6"
            onPress={() => router.push("/admin/operations/geo-fences")}
          />

          <OpCard
            title="Workorders"
            subtitle="Queue management & monitoring"
            icon="clipboard-list"
            color="#059669"
            onPress={() => router.push("/admin/operations/workorders")}
          />

          <OpCard
            title="Field Analytics"
            subtitle="Deployment performance"
            icon="trending-up"
            color="#ea580c"
            onPress={() => router.push("/admin/operations/field-analytics")}
          />

          <OpCard
            title="Quality Assurance"
            subtitle="Review & approve discovery docs"
            icon="shield-check"
            color="#ef4444" // Switched to Red for "The Auditor"
            onPress={() => router.push("/admin/operations/quality-assurance")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const OpCard = ({ title, subtitle, icon, color, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    backgroundColor: "#fff",
    width: "48%", // Grid of 2
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1e293b",
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
    lineHeight: 14,
    fontWeight: "500",
  },
});

// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function OperationsHub() {
//   const router = useRouter();

//   return (
//     <SafeAreaView style={styles.container} edges={["left", "right"]}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={styles.grid}>
//           <OpCard
//             title="Operational Teams"
//             subtitle="Personnel deployment & allocation"
//             icon="account-group"
//             color="#2563eb"
//             onPress={() => router.push("/admin/operations/teams")}
//           />
//           <OpCard
//             title="Geo-Fencing"
//             subtitle="Geospatial work jurisdictions"
//             icon="vector-polygon"
//             color="#8b5cf6"
//             onPress={() => router.push("/admin/operations/geo-fences")}
//           />
//           <OpCard
//             title="Workorders"
//             subtitle="Queue management & monitoring"
//             icon="clipboard-list"
//             color="#059669"
//             onPress={() => router.push("/admin/operations/workorders")}
//           />
//           <OpCard
//             title="Field Analytics"
//             subtitle="Deployment performance"
//             icon="trending-up"
//             color="#ea580c"
//             onPress={() => router.push("/admin/operations/field-analytics")}
//           />
//           <OpCard
//             title="Quality Assurance"
//             subtitle="Review & approve discovery docs"
//             icon="shield-check"
//             color="#0891b2"
//             onPress={() => router.push("/admin/operations/quality-assurance")}
//           />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const OpCard = ({ title, subtitle, icon, color, onPress }) => (
//   <TouchableOpacity style={styles.card} onPress={onPress}>
//     <MaterialCommunityIcons name={icon} size={32} color={color} />
//     <Text style={styles.cardTitle}>{title}</Text>
//     <Text style={styles.cardSubtitle}>{subtitle}</Text>
//   </TouchableOpacity>
// );

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f8fafc" },
//   scrollContent: { padding: 16 },
//   title: {
//     fontSize: 24,
//     fontWeight: "900",
//     color: "#1e293b",
//     marginBottom: 20,
//   },
//   grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
//   card: {
//     backgroundColor: "#fff",
//     width: "48%",
//     padding: 20,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     elevation: 2,
//   },
//   cardTitle: {
//     fontSize: 14,
//     fontWeight: "900",
//     color: "#1e293b",
//     marginTop: 12,
//   },
//   cardSubtitle: { fontSize: 10, color: "#64748b", marginTop: 4 },
// });
