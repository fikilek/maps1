import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getParam = (value, fallback = "NAv") => {
  if (Array.isArray(value)) return value[0] || fallback;
  if (value === undefined || value === null || value === "") return fallback;
  return value;
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "NAv"}</Text>
  </View>
);

export default function InspectPrepScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log(`params`, params);

  const launchContext = useMemo(() => {
    return {
      trnType: "inspection",
      astId: getParam(params?.id),
      meterNo: getParam(params?.meterNo),
      masterId: getParam(params?.masterId),
      premiseId: getParam(params?.premiseId),
      erfId: getParam(params?.erfId),
      lmPcode: getParam(params?.lmPcode),
      wardPcode: getParam(params?.wardPcode),
      launchSource: getParam(params?.launchSource, "meter-report"),
      launchContext: getParam(params?.launchContext, "inspect-prep"),
      premiseAddress: getParam(params?.premiseAddress),
      erfNo: getParam(params?.erfNo),
      // wardName: getParam(params?.wardName),
      // lmName: getParam(params?.lmName),
      wardNo: getParam(params?.wardNo),
      lmNo: getParam(params?.lmNo),
    };
  }, [params]);
  console.log(`launchContext`, launchContext);

  const handleCancel = () => {
    router.back();
  };

  const handleProceed = () => {
    router.replace({
      pathname: "/admin/operations/workorders",
      params: launchContext,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons
                name="clipboard-arrow-right-outline"
                size={32}
                color="#1d4ed8"
              />
            </View>

            <Text style={styles.title}>Continue to Ops Center?</Text>
          </View>

          <Text style={styles.bodyText}>
            You are about to leave the current screen and continue to Ops Center
            where you can continue the operational workflow and create a Meter
            Inspection TRN for this meter.
          </Text>

          <Text style={styles.bodyText}>
            Choose CANCEL to stay where you are, or PROCEED to Ops Center.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Launch Context</Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <InfoRow label="TRN Type" value={launchContext.trnType} />
            <InfoRow label="Meter No" value={launchContext.meterNo} />
            <InfoRow label="Launch Source" value={launchContext.launchSource} />
          </View>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <InfoRow label="Premise" value={launchContext.premiseAddress} />
            <InfoRow label="Ward" value={launchContext.wardNo} />
            <InfoRow label="ERF" value={launchContext.erfNo} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.85}
          onPress={handleCancel}
        >
          <Text style={styles.cancelBtnText}>CANCEL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.proceedBtn}
          activeOpacity={0.9}
          onPress={handleProceed}
        >
          <Text style={styles.proceedBtnText}>PROCEED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 14,
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    padding: 18,
  },

  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
    letterSpacing: -0.4,
  },

  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    marginBottom: 10,
    fontWeight: "500",
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },

  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.3,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },

  noteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
    fontWeight: "500",
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },

  cancelBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  cancelBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#334155",
  },

  proceedBtn: {
    flex: 1.4,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  proceedBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },
});
