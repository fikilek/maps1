import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";

// 🛰️ BEACON SELECTOR: Visualizes property types instantly
const getPropertyBeacon = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("church") || t.includes("religion"))
    return { name: "church", color: "#6366f1" };
  if (t.includes("school") || t.includes("education"))
    return { name: "school", color: "#10b981" };
  if (t.includes("township")) return { name: "home-variant", color: "#f59e0b" };
  if (t.includes("suburb")) return { name: "home-city", color: "#3b82f6" };
  if (t.includes("flat") || t.includes("sectional"))
    return { name: "office-building", color: "#8b5cf6" };
  if (t.includes("commercial") || t.includes("shop"))
    return { name: "storefront", color: "#ec4899" };
  if (t.includes("business") || t.includes("shop"))
    return { name: "storefront", color: "#ec4899" };
  if (t.includes("industrial") || t.includes("factory"))
    return { name: "factory", color: "#64748b" };
  return { name: "home", color: "#94a3b8" };
};

// 🎗️ STATUS SELECTOR: Visualizes the current mission state
const getStatusConfig = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("audited") || s.includes("accessed"))
    return { label: "AUDITED", color: "#10B981", icon: "check-decagram" };
  if (s.includes("occupied") || s.includes("pending"))
    return { label: "PENDING", color: "#F59E0B", icon: "clock-outline" };
  if (s.includes("vandalised") || s.includes("no access"))
    return { label: "ALERT", color: "#EF4444", icon: "alert-octagon" };
  return { label: "NEW", color: "#94A3B8", icon: "plus-circle-outline" };
};

const PremiseCard = memo(
  ({
    item,
    wardNo,
    onMapPress,
    onDiscover,
    onInstall,
    onDetailPress,
    onDuplicate,
    onNaPress,
  }) => {
    const isFlat = item?.propertyType?.type === "Flats";
    const erfId = item?.erfId; // 🎯 The link to the sovereign

    const { updateGeo } = useGeo(); // 🛰️ THE COMMANDER
    const { all } = useWarehouse(); // 🕵️ THE INTEL

    const router = useRouter();

    const resolveEntityIdentity = () => {
      const type = item?.propertyType?.type || "";
      const name = item?.propertyType?.name || "";
      const unit = item?.propertyType?.unitNo || "";

      // 🎯 Logic A: Flats / Sectional Title (Show Name + Unit)
      if (type === "Flats" || type === "Sectional Title") {
        return `${name}${unit ? ` | Unit ${unit}` : ""}`;
      }

      // 🎯 Logic B: Named Entities (Commercial, Church, School, Business)
      if (["Commercial", "Church", "School", "Business"].includes(type)) {
        return name || type; // Fallback to type if name is missing
      }

      // 🎯 Logic C: Standard (Residential, Vacant Land, etc.)
      // return type;
      return "";
    };

    // const beacon = getPropertyBeacon(propertyTypeStr);
    const status = getStatusConfig(item?.occupancy?.status || "");
    const naCount = Array.isArray(item?.metadata?.naCount)
      ? item?.metadata?.naCount.length
      : 0;

    const identityLabel = resolveEntityIdentity();
    const addressStr =
      `${item?.address?.strNo || ""} ${item?.address?.strName || ""} ${item?.address?.strType || ""}`.trim();
    const beacon = getPropertyBeacon(item?.propertyType?.type);

    // 🏛️ THE DUPLICATE TRIGGER
    const handleLongPressDuplicate = () => {
      console.log(`handleLongPressDuplicate pressed`);
      Alert.aleprt(
        "Duplicate Unit",
        "This will create a new Flat Unit using this unit as a template. All data except the Unit Number, No Access and Services will be copied.",
        [
          { text: "CANCEL", style: "cancel" },
          {
            text: "PROCEED",
            onPress: () => onDuplicate?.(item),
            style: "default",
          },
        ],
      );
    };

    const handleBeaconPress = () => {
      // 🕵️ 1. Find the parent Erf in the Warehouse
      const parentErf = all?.erfs?.find((e) => e.id === erfId);

      console.log(
        `📡 [Beacon Strike]: Locking GeoContext and Jumping to Erf: ${erfId}`,
      );

      // 🎯 TAP 1: Select the Erf (The Sovereign)
      updateGeo({
        selectedErf: parentErf || { id: erfId },
        lastSelectionType: "ERF",
      });

      // 🎯 TAP 2: Select the Premise (The Target)
      updateGeo({
        selectedPremise: item,
        lastSelectionType: "PREMISE",
      });

      // 🚀 THE JUMP: Navigate to the Erfs Screen
      // This assumes your Erfs list is at /(tabs)/erfs/index.js
      router.push("/(tabs)/erfs");
    };

    return (
      <TouchableOpacity
        style={styles.card}
        // onPress={() => onDetailPress?.(item)}
        activeOpacity={0.9}
      >
        {/* 🎗️ STATUS RIBBON */}
        <View style={[styles.statusRibbon, { backgroundColor: status.color }]}>
          <MaterialCommunityIcons name={status.icon} size={12} color="white" />
          <Text style={styles.statusText}>{status.label}</Text>
        </View>

        <View style={styles.cardHeader}>
          <TouchableOpacity
            onPress={handleBeaconPress}
            activeOpacity={0.7}
            style={[
              styles.beaconContainer,
              { backgroundColor: `${beacon.color}15` },
            ]}
          >
            {/* 🛰️ THE GIANT BEACON */}
            <View
              style={[
                styles.beaconContainer,
                { backgroundColor: `${beacon.color}15` },
              ]}
            >
              <MaterialCommunityIcons
                name={beacon.name}
                size={32}
                color={beacon.color}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.identityColumn}>
            <View style={styles.identityRow}>
              <Text style={styles.addressText} numberOfLines={1}>
                {addressStr || "No Address"}
              </Text>
              <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>
                  {item?.propertyType?.type}
                </Text>
                <Text style={styles.typeTagName}>
                  {item?.propertyType?.name}
                </Text>
              </View>
            </View>
            <View style={styles.identityRow}>
              <Text style={[styles.propertyTypeText, { color: beacon.color }]}>
                {`${identityLabel}`}
              </Text>
            </View>

            {/* lets have a btn to duplicate the premise if its a flat */}

            {/* 🎯 THE TARGET ROW: Now contains Erf, Ward, and the Edit Button */}
            <View style={styles.geoRow}>
              <Text
                style={styles.geoBadge}
              >{`Erf ${item?.erfNo || "N/A"}`}</Text>
              <Text style={styles.geoDivider}>•</Text>
              <Text style={styles.geoBadge}>{`Ward ${wardNo || "?"}`}</Text>

              {/* 🛡️ THE EDIT BEACON: Moved INSIDE geoRow to stay on one line */}
              <TouchableOpacity
                onPress={() => onDetailPress?.(item)}
                style={styles.editIconBtn}
              >
                <MaterialCommunityIcons
                  name="square-edit-outline"
                  size={26}
                  color="#2563eb"
                />
              </TouchableOpacity>

              <View style={styles.actionGroup}>
                {/* 📸 THE MEDIA GATEWAY (Placeholder) */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => router.push("/(tabs)/premises/premiseMedia")}
                >
                  <MaterialCommunityIcons
                    name="camera-iris"
                    size={28}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* 👯 THE DUPLICATE BEACON: ONLY AND ONLY FOR FLATS */}
              {isFlat && (
                <TouchableOpacity
                  onPress={handleLongPressDuplicate}
                  delayLongPress={1000} // 🎯 Must hold for 1 second
                  style={styles.duplicateIconBtn}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={28}
                    color="#8b5cf6"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* COMPACT MAP PORTAL */}
          <TouchableOpacity
            style={styles.mapAction}
            onPress={() => onMapPress?.(item)}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="map-search"
                size={20}
                color="#00BFFF"
              />
            </View>
            <Text style={styles.mapLabel}>MAP</Text>
          </TouchableOpacity>
        </View>

        {/* 🏛️ THE COMMAND STRIP */}
        <View style={styles.commandStrip}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={16}
                color="#EAB308"
              />
              <Text style={styles.statCount}>
                {item?.services?.electricityMeters?.length || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="water" size={16} color="#3B82F6" />
              <Text style={styles.statCount}>
                {item?.services?.waterMeters?.length || 0}
              </Text>
            </View>

            {naCount > 0 && (
              <TouchableOpacity
                style={styles.compactNaBadge}
                onPress={() => onNaPress?.(item)}
              >
                <MaterialCommunityIcons
                  name="shield-alert-outline"
                  size={14}
                  color="#EA580C"
                />
                <Text style={styles.naCountText}>{naCount}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.compactBtn, styles.btnDiscover]}
              onPress={() => onDiscover?.(item)}
            >
              <MaterialCommunityIcons
                name="magnify-scan"
                size={16}
                color="#1E293B"
              />
              <Text style={styles.compactBtnText}>Discover</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.compactBtn, styles.btnInstall]}
              onPress={() => onInstall?.(item)}
            >
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={16}
                color="#FFF"
              />
              <Text style={[styles.compactBtnText, { color: "#FFF" }]}>
                Install
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

PremiseCard.displayName = "PremiseCard";

export default PremiseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    paddingTop: 24,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  statusRibbon: {
    position: "absolute",
    top: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 10,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  beaconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  identityColumn: { flex: 1, justifyContent: "center" },
  identityRow: { flexDirection: "row", alignItems: "center" },
  addressText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    maxWidth: "70%",
  },
  propertyTypeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  geoDivider: { color: "#CBD5E1", fontSize: 12 },
  mapAction: { alignItems: "center", marginLeft: 12, marginTop: 40 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0FAFF",
    justifyContent: "center",
    alignItems: "center",
  },
  mapLabel: { fontSize: 9, fontWeight: "900", color: "#00BFFF", marginTop: 2 },
  commandStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 0.4 },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  statCount: { fontSize: 12, fontWeight: "800", color: "#1E293B" },
  compactNaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEDD5",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 2,
  },
  naCountText: { fontSize: 12, fontWeight: "900", color: "#EA580C" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 0.6,
    justifyContent: "flex-end",
  },
  compactBtn: {
    flexDirection: "row",
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  btnDiscover: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  btnInstall: { backgroundColor: "#007AFF" },
  compactBtnText: { fontSize: 12, fontWeight: "800", color: "#1E293B" },

  geoRow: {
    flexDirection: "row",
    alignItems: "center", // 🎯 Keeps icons and text vertically centered
    marginTop: 4,
    gap: 6, // 🎯 Ensures consistent spacing between badges
  },
  editIconBtn: {
    marginLeft: 4, // 🎯 Subtle distance from the Ward badge
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#eff6ff", // Light Blue tint
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#bfdbfe", // Subtle blue border for definition
    justifyContent: "center",
    alignItems: "center",
  },
  geoBadge: {
    fontSize: 10, // 🎯 Slightly smaller for better fit on one line
    fontWeight: "800",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  propertyType: {
    marginLeft: 10,
    fontSize: 12,
    color: "grey",
  },
  typeTag: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginLeft: 8,
    flexDirection: "column",
  },
  typeTagName: {
    fontSize: 10,
  },
});
