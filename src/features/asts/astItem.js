import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";

const getMeterStatusConfig = (state = "") => {
  const s = String(state || "UNKNOWN").toUpperCase();

  if (s === "CONNECTED") {
    return {
      label: "CONNECTED",
      icon: "check-circle",
      color: "#10B981",
      bg: "#ECFDF5",
      border: "#A7F3D0",
    };
  }

  if (s === "DISCONNECTED") {
    return {
      label: "DISCONNECTED",
      icon: "close-circle",
      color: "#EF4444",
      bg: "#FEF2F2",
      border: "#FECACA",
    };
  }

  return {
    label: s,
    icon: "alert-circle",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
  };
};

const LifecycleActionButton = ({ label, icon, enabled, onPress }) => {
  return (
    <TouchableOpacity
      onPress={enabled ? onPress : undefined}
      activeOpacity={enabled ? 0.75 : 1}
      style={[
        styles.lifecycleActionButton,
        !enabled && styles.lifecycleActionButtonDisabled,
      ]}
    >
      <MaterialCommunityIcons
        name={enabled ? icon : "lock-outline"}
        size={18}
        color={enabled ? "#2563EB" : "#94A3B8"}
      />
      <Text
        style={[
          styles.lifecycleActionText,
          !enabled && styles.lifecycleActionTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const AstItem = ({ item }) => {
  // console.log(`AstItem --item`, item);
  const { updateGeo } = useGeo();
  const { all } = useWarehouse();
  const router = useRouter();

  // 🎯 DATA EXTRACTION
  const isWater = item.meterType === "water";
  const meterNo = item.ast?.astData?.astNo || "NO METER NO";
  const manufacturer = item.ast?.astData?.astManufacturer || "Unknown";
  const anomaly = item.ast?.anomalies?.anomaly || "Meter Ok";

  const meterStatusState = item?.status?.state || "UNKNOWN";
  const meterStatusConfig = getMeterStatusConfig(meterStatusState);

  const visibility = item?.master?.visibility || "NAv";
  const isVisible = visibility === "VISIBLE";
  const isInvisible = visibility === "INVISIBLE";

  const astName = item.ast?.astData?.astName || "NAv";
  const erfNo = item.accessData?.erfNo || "NAv";
  const premiseId = item.accessData?.premise?.id || null;

  const parentPremiseDoc = all?.prems?.find((p) => p.id === premiseId);

  const premiseFullAddress = parentPremiseDoc
    ? `${parentPremiseDoc?.address?.strNo || ""} ${parentPremiseDoc?.address?.strName || ""} ${parentPremiseDoc?.address?.strType || ""}`.trim() ||
      "NAv"
    : item.accessData?.premise?.address || "NAv";

  const wardPcode =
    item?.accessData?.parents?.wardPcode ||
    parentPremiseDoc?.parents?.wardPcode ||
    "";

  const wardNo = (() => {
    const tail = String(wardPcode || "").slice(-3);
    const n = parseInt(tail, 10);
    return Number.isNaN(n) ? "NAv" : String(n);
  })();

  const normalize = (value) =>
    String(value || "")
      .trim()
      .toUpperCase();

  const meterState = normalize(item?.status?.state);
  const meterType = String(item?.meterType || "").toLowerCase();
  const meterKind = String(item?.ast?.astData?.meter?.type || "")
    .trim()
    .toLowerCase();

  const isPrepaidElectricity =
    meterType === "electricity" && meterKind === "prepaid";

  const canCommission = meterState === "FIELD" && meterType === "electricity";

  const canInspect = meterState !== "REMOVED";
  const canDisconnect = meterState === "CONNECTED";
  const canReconnect = meterState === "DISCONNECTED";
  const canRemove = meterState !== "REMOVED";
  const canVend = meterState === "CONNECTED" && isPrepaidElectricity;

  const launchCommissioning = () => {
    if (!canCommission) return;

    router.push({
      pathname: "/(tabs)/asts/commissioning",
      params: {
        astId: item.id,
        premiseId: item?.accessData?.premise?.id || "NAv",
        action: JSON.stringify({
          trnType: "METER_COMMISSIONING",
          astId: item.id,
          meterType: item?.meterType || "NAv",
          meterNo: item?.ast?.astData?.astNo || "NAv",
          statusBefore: item?.status?.state || "UNKNOWN",
        }),
      },
    });
  };

  const handleGoToDetails = () => {
    const meterNo = item.ast?.astData?.astNo;
    const docId = item.id;

    router.push({
      pathname: "/(tabs)/asts/details",
      params: {
        docId: docId,
        astNo: meterNo || "NAv",
      },
    });
  };

  const handleGoToReport = () => {
    const meterNo = item?.ast?.astData?.astNo || "NAv";
    const id = item?.id;

    if (!id) {
      console.warn("⚠️ Asset missing AST id, cannot open report");
      return;
    }

    if (!item?.ast?.astData?.astNo) {
      console.warn("⚠️ Asset missing Meter Number, using ID only");
    }

    router.push({
      pathname: "/(tabs)/asts/[id]",
      params: {
        id,
        astNo: meterNo,
      },
    });
  };

  const handleGoToMedia = () => {
    const meterNo = item.ast?.astData?.astNo;
    const id = item.id;

    router.push({
      pathname: "/(tabs)/asts/media",
      params: {
        astNo: meterNo || "NAv",
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
      selectedErf: parentErf || null,
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
            <View style={styles.titleBlock}>
              <Text style={styles.meterNo}>{meterNo}</Text>

              <View style={styles.makeModelRow}>
                <Text style={styles.makeModelText}>{manufacturer}</Text>
                <Text style={styles.makeModelDot}>•</Text>
                <Text style={styles.makeModelText}>{astName}</Text>
              </View>
            </View>

            <View style={styles.topRightBadgeCol}>
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

              <Text
                style={[
                  styles.visibilityText,
                  isVisible && styles.visibilityTextVisible,
                  isInvisible && styles.visibilityTextInvisible,
                  !isVisible && !isInvisible && styles.visibilityTextNeutral,
                ]}
              >
                {visibility}
              </Text>
            </View>
          </View>

          <View style={styles.geoRow}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={14}
              color="#64748B"
            />
            <Text style={styles.geoText}>
              W{wardNo} • ERF {erfNo} • {premiseFullAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Row for trn btns */}

      <View style={styles.lifecycleActionRow}>
        <LifecycleActionButton
          label="COMM"
          icon="progress-check"
          enabled={canCommission}
          onPress={launchCommissioning}
        />

        <LifecycleActionButton
          label="INSP"
          icon="clipboard-search-outline"
          enabled={canInspect}
          onPress={() => {}}
        />

        <LifecycleActionButton
          label="DISC"
          icon="power-plug-off-outline"
          enabled={canDisconnect}
          onPress={() => {}}
        />

        <LifecycleActionButton
          label="RECON"
          icon="power-plug-outline"
          enabled={canReconnect}
          onPress={() => {}}
        />

        <LifecycleActionButton
          label="REM"
          icon="delete-alert-outline"
          enabled={canRemove}
          onPress={() => {}}
        />

        <LifecycleActionButton
          label="VEND"
          icon="cash-register"
          enabled={canVend}
          onPress={() => {}}
        />
      </View>

      {/* 🏛️ NEW: EXTREME LEFT-TO-RIGHT ACTION ROW */}
      <View style={styles.fullWidthActionRow}>
        <View style={styles.statusInfo}>
          <View style={styles.statusStack}>
            <View style={styles.statusLine}>
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
                numberOfLines={1}
              >
                {anomaly}
              </Text>
            </View>

            <View
              style={[
                styles.meterStateBadge,
                {
                  backgroundColor: meterStatusConfig.bg,
                  borderColor: meterStatusConfig.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={meterStatusConfig.icon}
                size={12}
                color={meterStatusConfig.color}
              />
              <Text
                style={[
                  styles.meterStateText,
                  { color: meterStatusConfig.color },
                ]}
                numberOfLines={1}
              >
                {meterStatusConfig.label}
              </Text>
            </View>
          </View>
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
    flex: 1,
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
  // statusInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  statusLabel: { fontSize: 12, fontWeight: "700", marginLeft: 4 },
  mapButton: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 8 },

  // buttonGroup: {
  //   flexDirection: "row",
  //   gap: 8,
  //   alignItems: "center",
  // },
  // actionButton: {
  //   padding: 8,
  //   backgroundColor: "#F1F5F9",
  //   borderRadius: 8,
  //   borderWidth: 1,
  //   borderColor: "#E2E8F0",
  // },
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
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    // Remove flexDirection: 'row' here so content stacks vertically
  },
  mainContent: {
    flex: 1,
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

  topRightBadgeCol: {
    alignItems: "flex-end",
  },

  visibilityText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "900",
  },

  visibilityTextVisible: {
    color: "#047857",
  },

  visibilityTextInvisible: {
    color: "#B91C1C",
  },

  visibilityTextNeutral: {
    color: "#64748B",
  },

  titleBlock: {
    flex: 1,
    paddingRight: 10,
  },

  makeModelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  makeModelText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  makeModelDot: {
    marginHorizontal: 6,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "900",
  },

  geoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  geoText: {
    marginLeft: 4,
    color: "#1E293B",
    fontWeight: "600",
    fontSize: 12,
    flex: 1,
  },

  // statusStack: {
  //   flex: 1,
  //   justifyContent: "center",
  // },

  statusLine: {
    flexDirection: "row",
    alignItems: "center",
  },

  meterStateBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },

  meterStateText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  statusInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  statusStack: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  statusBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },

  statusBadgeText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  buttonGroup: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexShrink: 0,
  },

  actionButton: {
    padding: 7,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  lifecycleActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },

  lifecycleActionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  lifecycleActionButtonDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },

  lifecycleActionText: {
    marginTop: 3,
    fontSize: 8,
    fontWeight: "900",
    color: "#2563EB",
  },

  lifecycleActionTextDisabled: {
    color: "#94A3B8",
  },
});
