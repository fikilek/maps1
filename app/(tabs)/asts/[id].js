import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGetSalesByAstNoQuery } from "../../../src/redux/salesApi";
import { useGetTrnsByAstNoQuery } from "../../../src/redux/trnsApi";

const TimelineItem = ({ item, isLast }) => {
  const isSale = item.type === "SALE";

  return (
    <View style={styles.timelineRow}>
      <View style={styles.leftCol}>
        <View
          style={[
            styles.iconDot,
            { backgroundColor: isSale ? "#10B981" : "#3B82F6" },
          ]}
        >
          <MaterialCommunityIcons
            name={isSale ? "currency-usd" : "hammer-wrench"}
            size={16}
            color="#FFF"
          />
        </View>
        {!isLast && <View style={styles.verticalLine} />}
      </View>

      <View style={styles.contentCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>
            {new Date(item.date).toLocaleDateString("en-ZA", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: isSale ? "#ECFDF5" : "#EFF6FF" },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                { color: isSale ? "#059669" : "#2563EB" },
              ]}
            >
              {isSale ? "VENDING" : "FIELD OP"}
            </Text>
          </View>
        </View>

        <Text style={styles.mainInfo}>
          {isSale
            ? `R${item.amount.toFixed(2)} Purchase`
            : item.trnType || "Inspection"}
        </Text>

        {isSale ? (
          <Text style={styles.subInfo}>Tokens Issued • {item.source}</Text>
        ) : (
          <Text style={styles.subInfo}>
            Technician: {item.techName || "Field User"}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function AstReportScreen() {
  const { id, astNo } = useLocalSearchParams();
  console.log(`id`, id);
  console.log(`astNo`, astNo);

  const router = useRouter();

  // 🏛️ DUAL STRIKE QUERIES
  const { data: trns, isLoading: loadingTrns } = useGetTrnsByAstNoQuery(astNo);
  console.log(`trns`, trns);

  const { data: sales, isLoading: loadingSales } =
    useGetSalesByAstNoQuery(astNo);

  // 🎯 THE TIMELINE MERGE
  // Inside app/(tabs)/asts/[id].js

  const timeline = useMemo(() => {
    const combined = [
      ...(trns || []).map((t) => ({
        ...t,
        type: "FIELD_OP",
        // 🎯 SURGICAL STRIKE ON YOUR SCHEMA:
        date: t.accessData?.metadata?.created?.at,
        trnType: t.accessData?.trnType?.replace("_", " "), // "METER DISCOVERY"
        techName: t.accessData?.metadata?.created?.byUser, // "Mthofi kents"
        details: t.ast?.anomalies?.anomaly || "No Anomaly", // "Meter Damaged"
      })),
      ...(sales || []).map((s) => ({
        ...s,
        type: "SALE",
        date: s.txnDate, // From our Python ISO strike
      })),
    ];
    console.log(`timeline`, timeline);

    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [trns, sales]);

  if (loadingTrns || loadingSales) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Synthesizing Lifecycle...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>METER NUMBER</Text>

        <Text style={styles.meterValue}>{astNo}</Text>
      </View>

      <View style={styles.timelineContainer}>
        {timeline.length === 0 ? (
          <Text style={styles.emptyText}>
            No history recorded for this asset.
          </Text>
        ) : (
          timeline.map((item, index) => (
            <TimelineItem
              key={index}
              item={item}
              isLast={index === timeline.length - 1}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: "#FFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1,
  },

  timelineContainer: { padding: 16 },
  timelineRow: { flexDirection: "row", marginBottom: 0 },
  leftCol: { width: 40, alignItems: "center" },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#FFF",
    marginLeft: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateText: { fontSize: 12, color: "#64748B", fontWeight: "700" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 9, fontWeight: "900" },
  mainInfo: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  subInfo: { fontSize: 12, color: "#64748B", marginTop: 4 },

  summaryBox: {
    margin: 10,
    padding: 15,
    backgroundColor: "#e1ecff", // Deep Slate (The iREPS Night Command color)
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#98b0d0",
    // 🛡️ THE SOVEREIGN GLOW
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  // 🛰️ DECORATIVE ACCENT (Industrial detail)
  boxAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
    backgroundColor: "#3B82F6", // Power Blue Strike
  },
  summaryLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3, // Wide tactical spacing
    // marginBottom: 8,
    textTransform: "uppercase",
  },
  meterValue: {
    color: "#3f4851",
    fontSize: 32, // Large and commanding
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 2,
    textShadowColor: "rgba(33, 43, 58, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  docIdTag: {
    // marginTop: 12,
    fontSize: 10,
    color: "#2a2c2e",
    fontWeight: "700",
    letterSpacing: 1,
    backgroundColor: "rgba(153, 175, 227, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    // borderWidth: 1,
    // borderColor: "#1E293B",
  },
});
