// src/components/maps/NeighbourhoodPremiseMarker.js
// iREPS — Premise Neighbourhood Marker (PNBS)
// Lightweight, offline-safe, scalable (memo + tracksViewChanges=false)

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

/* ----------------------------
   Helpers (kept inside scope)
----------------------------- */
const getPropertyBeacon = (type = "") => {
  const t = (type || "").toLowerCase();

  if (t.includes("church") || t.includes("religion"))
    return { name: "church", color: "#6366f1" };

  if (t.includes("school") || t.includes("education"))
    return { name: "school", color: "#10b981" };

  if (t.includes("township")) return { name: "home-variant", color: "#f59e0b" };

  if (t.includes("suburb")) return { name: "home-city", color: "#3b82f6" };

  if (t.includes("flat") || t.includes("sectional"))
    return { name: "office-building", color: "#8b5cf6" };

  if (t.includes("commercial") || t.includes("shop") || t.includes("business"))
    return { name: "storefront", color: "#ec4899" };

  if (t.includes("industrial") || t.includes("factory"))
    return { name: "factory", color: "#64748b" };

  return { name: "home", color: "#94a3b8" };
};

const getOccupancyColor = (status = "") => {
  const s = (status || "").toUpperCase();

  if (s === "OCCUPIED") return "#10B981";
  if (s === "ACCESSED") return "#3B82F6";
  if (s === "NO_ACCESS") return "#EF4444";

  return "#64748B";
};

const formatShortAddress = (addr) => {
  const strNo = addr?.strNo || "";
  const strName = addr?.strName || "";
  const strType = addr?.strType || "";
  const s = `${strNo} ${strName} ${strType}`.trim();
  return s || "No Address";
};

/* ----------------------------
   Component
----------------------------- */
const NeighbourhoodPremiseMarker = memo(
  ({
    prem,
    zoom,
    coordinate, // required: { latitude, longitude }
    onPress, // optional
    showAddressFromZoom = 18, // show address at this zoom+
    showTypeFromZoom = 18, // show property type at this zoom+
    maxWidth = 90, // allow tuning if you want wider labels
  }) => {
    // Defensive guard

    const statusColor = useMemo(
      () => getOccupancyColor(prem?.occupancy?.status),
      [prem?.occupancy?.status],
    );

    const beacon = useMemo(
      () => getPropertyBeacon(prem?.propertyType?.type),
      [prem?.propertyType?.type],
    );

    const erfLabel = useMemo(() => `Erf ${prem?.erfNo || "?"}`, [prem?.erfNo]);

    const addressLabel = useMemo(
      () => formatShortAddress(prem?.address),
      [prem?.address],
    );

    if (!prem || !coordinate) return null;

    const typeLabel = prem?.propertyType?.type || "";

    const showAddress = (zoom || 0) >= showAddressFromZoom;
    const showType = (zoom || 0) >= showTypeFromZoom;

    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        // tracksViewChanges={false}
        onPress={onPress}
      >
        <View
          style={[styles.badge, { borderColor: statusColor, maxWidth: 50 }]}
        >
          {/* Left Icon (Property Beacon) */}

          {/* Text Column */}
          <View style={styles.textCol}>
            <Text style={styles.title} numberOfLines={1}>
              {erfLabel}
            </Text>

            {showAddress && (
              <Text style={styles.sub} numberOfLines={1}>
                {addressLabel}
              </Text>
            )}
            <View
              style={[styles.iconBox, { backgroundColor: `${beacon.color}18` }]}
            >
              <MaterialCommunityIcons
                name={beacon.name}
                size={10}
                color={beacon.color}
              />
            </View>

            {/* {showType && !!typeLabel && (
              <Text
                style={[styles.type, { color: beacon.color }]}
                numberOfLines={1}
              >
                {typeLabel}
              </Text>
            )} */}
          </View>

          {/* Right Status Dot (Occupancy) */}
          {/* <View style={[styles.dot, { backgroundColor: statusColor }]} /> */}
        </View>
      </Marker>
    );
  },
);

NeighbourhoodPremiseMarker.displayName = "NeighbourhoodPremiseMarker";
export default NeighbourhoodPremiseMarker;

/* ----------------------------
   Styles
----------------------------- */
const styles = StyleSheet.create({
  badge: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    width: "90",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  iconBox: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  textCol: {
    flex: 1,
    gap: 1,
  },

  title: {
    fontSize: 6,
    fontWeight: "900",
    color: "#0F172A",
  },

  sub: {
    fontSize: 6,
    fontWeight: "700",
    color: "#64748B",
  },

  type: {
    fontSize: 5,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
