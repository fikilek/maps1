import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { format, isValid } from "date-fns"; // 🎯 Added isValid
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { useAuth } from "../../../src/hooks/useAuth";
import { useGetTrnsByLmPcodeQuery } from "../../../src/redux/trnsApi";

const TrnItem = ({ item }) => {
  const router = useRouter();
  const isWater = item.meterType === "water";

  // 🛡️ DEFENSIVE: Standardize boolean check for hasAccess
  const accessVal = item.accessData?.access?.hasAccess;
  const hasAccess =
    accessVal === true || accessVal === "yes" || accessVal === "true";

  const boundaryColor = !hasAccess
    ? "#EF4444"
    : isWater
      ? "#3B82F6"
      : "#EAB308";

  const trnRef = item.id?.split("_").pop() || "N/A";
  const agentDisplayName =
    item.accessData?.metadata?.created?.byUser || "Field Agent";
  const meterNo = item.ast?.astData?.astNo || "NO METER";

  // 🕒 TIMESTAMP RESOLUTION (THE CRASH FIX)
  const dateAt = item.accessData?.metadata?.created?.at;
  // Firestore timestamp handles: check for __time__ or raw string
  const rawDate = dateAt?.__time__ || dateAt;
  const parsedDate = rawDate ? new Date(rawDate) : null;

  // 🛡️ Only format if the date is actually valid
  const timeLabel =
    parsedDate && isValid(parsedDate) ? format(parsedDate, "HH:mm") : "--:--";
  const dateLabel =
    parsedDate && isValid(parsedDate) ? format(parsedDate, "MMM dd") : "";

  return (
    <View
      style={[
        styles.card,
        { borderRightWidth: 6, borderRightColor: boundaryColor },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.header, { alignItems: "center" }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flex: 1,
            }}
          >
            <View
              style={[
                styles.typeTag,
                { backgroundColor: `${boundaryColor}10` },
              ]}
            >
              <MaterialCommunityIcons
                name={isWater ? "water" : "lightning-bolt"}
                size={22}
                color={boundaryColor}
              />
            </View>

            <View style={styles.meterNumberContainer}>
              <Text style={styles.meterNumberText} numberOfLines={1}>
                {meterNo}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.timeText}>{timeLabel}</Text>
              <Text
                style={{ fontSize: 9, color: "#94A3B8", fontWeight: "800" }}
              >
                {dateLabel}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/trns/${item.id}`)}
            >
              <MaterialCommunityIcons
                name="file-document-edit-outline"
                size={26}
                color="#2563eb"
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.addressText, { marginTop: 8 }]} numberOfLines={1}>
          {item.accessData?.premise?.address || "Street Address N/A"}
        </Text>

        <View style={styles.footer}>
          <View style={styles.agentInfo}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={14}
              color="#64748B"
            />
            <Text style={styles.agentName}>{agentDisplayName}</Text>
            <Text style={styles.idBadge}>#{trnRef}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: hasAccess ? "#DCFCE7" : "#FEE2E2" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: hasAccess ? "#166534" : "#991B1B" },
              ]}
            >
              {hasAccess ? "SUCCESS" : "NO ACCESS"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function TrnsScreen() {
  const { activeWorkbase } = useAuth();
  const lmPcode = activeWorkbase?.id;
  const {
    data: trns,
    isLoading,
    isError,
  } = useGetTrnsByLmPcodeQuery(lmPcode, { skip: !lmPcode });
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Syncing Audit Logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={trns}
        renderItem={({ item }) => <TrnItem item={item} />}
        estimatedItemSize={120}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, color: "#64748B", fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#64748B", fontWeight: "500", marginTop: 8 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: "hidden",
  },
  accentBar: { width: 5 },
  content: { flex: 1, padding: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 4,
    color: "#475569",
  },
  timeText: { fontSize: 11, color: "#94A3B8", fontWeight: "800" },
  addressText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  agentInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  agentName: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  idBadge: {
    fontSize: 10,
    color: "#94A3B8",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: "900" },

  meterNumberContainer: {
    backgroundColor: "#F1F5F9", // Subtle grey background
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  meterNumberText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A", // Darker navy for contrast
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", // 🎯 Technical look
  },
});
