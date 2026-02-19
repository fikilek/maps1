import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Polygon, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import SelecteMeter from "../../../components/maps/SelectedMeter";
import SelectedPremise from "../../../components/maps/SelectedPremise";
import { getSafeCoords } from "../../context/MapContext";
import { useWarehouse } from "../../context/WarehouseContext";

export const ErfReport = ({ visible, onClose, erf }) => {
  const [activeTab, setActiveTab] = useState("LIST"); // LIST, MAP, SMS, WHATSAPP
  const { all } = useWarehouse();

  // 🕵️ DATA BUNDLE: Translating ID manifests into actual Asset hardware
  const reportData = useMemo(() => {
    if (!erf?.id) return [];

    // 1. Get all Premises linked to this Erf
    const erfPrems = all?.prems?.filter((p) => p.erfId === erf.id) || [];

    return erfPrems.map((p) => {
      // 2. Extract the ID manifests from the "services" object
      const eIds = p.services?.electricityMeters || [];
      const wIds = p.services?.waterMeters || [];

      // 3. HYDRATE: Match the IDs to full objects in the Warehouse
      const hydratedMeters = [
        ...eIds.map((id) => {
          const found = all?.meters?.find((a) => a.id === id);
          // 🎯 Force 'meterType' to match the UI checks
          return found ? { ...found, meterType: "electricity" } : null;
        }),
        ...wIds.map((id) => {
          const found = all?.meters?.find((a) => a.id === id);
          // 🎯 Force 'meterType' to match the UI checks
          return found ? { ...found, meterType: "water" } : null;
        }),
      ].filter(Boolean); // 🛡️ Removes any IDs that weren't found in the Warehouse

      return {
        ...p,
        meters: hydratedMeters,
      };
    });
  }, [erf, all]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* 🏛️ HEADER SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{`ERF ${erf?.erfNo} REPORT`}</Text>
            <Text style={styles.headerSub}>
              {erf?.admin?.ward?.name || "Local Context"}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons
              name="chevron-down"
              size={32}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>

        {/* 📑 TACTICAL TAB BAR */}
        <View style={styles.tabBar}>
          <TabBtn
            id="LIST"
            icon="format-list-bulleted"
            active={activeTab}
            set={setActiveTab}
          />
          <TabBtn
            id="MAP"
            icon="map-marker-path"
            active={activeTab}
            set={setActiveTab}
          />
          <TabBtn
            id="SMS"
            icon="message-text-outline"
            active={activeTab}
            set={setActiveTab}
          />
          <TabBtn
            id="WHATSAPP"
            icon="whatsapp"
            active={activeTab}
            set={setActiveTab}
          />
        </View>

        {/* 🎯 CONTENT AREA */}
        <View style={styles.content}>
          {activeTab === "LIST" && (
            <ReportListView data={reportData} erfNo={erf?.erfNo} />
          )}
          {activeTab === "MAP" && <ReportMapView erf={erf} data={reportData} />}
          {activeTab === "SMS" && (
            <PlaceholderView label="SMS Module" icon="message-text" />
          )}
          {activeTab === "WHATSAPP" && (
            <PlaceholderView label="WhatsApp Module" icon="whatsapp" />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// --- 📋 TAB A: THE DATA LIST ---

const ReportListView = ({ data, erfNo }) => (
  <ScrollView style={styles.scroll}>
    <View style={styles.tableHeader}>
      <Text style={[styles.colHeader, { flex: 1 }]}>Erf</Text>
      <Text style={[styles.colHeader, { flex: 2 }]}>Premise Adr</Text>
      <Text style={[styles.colHeader, { flex: 2 }]}>Type/Name/Unit</Text>
      <Text style={[styles.colHeader, { flex: 1 }]}>Meters</Text>
    </View>

    {data.map((p) => {
      // 🎯 Case 1: Premise has meters - Create a row for EACH meter
      if (p.meters && p.meters.length > 0) {
        return p.meters.map((m) => (
          <View key={`${p.id}-${m.id}`} style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 1, fontWeight: "800" }]}>
              {erfNo}
            </Text>
            <Text style={[styles.cell, { flex: 2 }]}>
              {`${p.address?.strNo || ""} ${p.address?.strName || ""}`}
            </Text>
            <Text
              style={[
                styles.cell,
                { flex: 2, fontStyle: "italic", fontSize: 10 },
              ]}
            >
              {`${p.propertyType?.type || ""}, ${p.propertyType?.name || ""}, ${p.propertyType?.unitNo || ""}`}
            </Text>

            <View
              style={[
                styles.cell,
                { flex: 1, flexDirection: "row", alignItems: "center" },
              ]}
            >
              <MaterialCommunityIcons
                name={m.meterType === "water" ? "water" : "lightning-bolt"}
                size={12}
                color={m.meterType === "water" ? "#3b82f6" : "#eab308"}
              />
              <Text style={[styles.meterNo, { marginLeft: 4 }]}>
                {m.ast?.astData?.astNo || "NO ID"}
              </Text>
            </View>
          </View>
        ));
      }

      // 🎯 Case 2: Premise has NO meters - Create one row with placeholder
      return (
        <View key={p.id} style={styles.tableRow}>
          <Text style={[styles.cell, { flex: 1, fontWeight: "800" }]}>
            {erfNo}
          </Text>
          <Text style={[styles.cell, { flex: 2 }]}>
            {`${p.address?.strNo || ""} ${p.address?.strName || ""}`}
          </Text>
          <Text
            style={[
              styles.cell,
              { flex: 2, fontStyle: "italic", fontSize: 10 },
            ]}
          >
            {`${p.propertyType?.type || ""}, ${p.propertyType?.name || ""}, ${p.propertyType?.unitNo || ""}`}
          </Text>
          <Text
            style={[styles.cell, { flex: 1, color: "#94a3b8", fontSize: 10 }]}
          >
            No Assets
          </Text>
        </View>
      );
    })}
  </ScrollView>
);

const ReportMapView = ({ erf, data }) => {
  const { all } = useWarehouse();
  const erfGeo = all?.geoLibrary?.[erf?.id];
  const erfCoords = getSafeCoords(erfGeo?.geometry);

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: erfGeo?.centroid?.lat || -34.03,
        longitude: erfGeo?.centroid?.lng || 23.04,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      }}
    >
      {erfCoords.length > 2 && (
        <Polygon
          coordinates={erfCoords}
          strokeColor="#FFD700"
          fillColor="rgba(255, 215, 0, 0.1)"
          strokeWidth={3}
        />
      )}

      {data.map((p) => (
        <React.Fragment key={p.id}>
          {/* 🏠 THE LABELED TARGET (Using your custom component) */}
          <SelectedPremise
            coordinate={{
              latitude: p.geometry.centroid[0],
              longitude: p.geometry.centroid[1],
            }}
            erfNo={p.erfNo || erf?.erfNo} // Fallback to parent Erf No if child is missing it
            adrLn1={`${p.address?.strNo || ""} ${p.address?.strName || ""}`}
            adrLn2={p.address?.strType || ""}
            premiseId={p.id}
          />

          {/* ⚡ METER LINEAGE & PINS */}
          {p.meters.map((m) => {
            const mGps = m.ast?.location?.gps;
            if (!mGps?.lat) return null;

            const isWater = m.meterType === "water";
            const astNo = m?.ast?.astData?.astNo || "N/av";
            const erfNo = m?.accessData?.access?.erfNo;
            const adrLn1 = `${p.address?.strNo || ""} ${p.address?.strName || ""}`;

            return (
              <React.Fragment key={m.id}>
                {/* 🏁 THE UMBILICAL LINK */}
                <Polyline
                  coordinates={[
                    {
                      latitude: p.geometry.centroid[0],
                      longitude: p.geometry.centroid[1],
                    },
                    {
                      latitude: mGps.lat,
                      longitude: mGps.lng,
                    },
                  ]}
                  strokeColor="#64748b"
                  strokeWidth={2}
                  lineDashPattern={[5, 5]}
                />

                {/* 📍 THE ASSET PIN */}

                <SelecteMeter
                  isWater={isWater}
                  meterNo={astNo}
                  coordinates={{
                    latitude: mGps.lat,
                    longitude: mGps.lng,
                  }}
                  shortAdr={adrLn1}
                  erfNo={erfNo}
                />
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
    </MapView>
  );
};

// --- HELPERS ---
const TabBtn = ({ id, icon, active, set }) => (
  <TouchableOpacity
    style={[styles.tab, active === id && styles.activeTab]}
    onPress={() => set(id)}
  >
    <MaterialCommunityIcons
      name={icon}
      size={24}
      color={active === id ? "#2563eb" : "#94a3b8"}
    />
    <Text style={[styles.tabLabel, active === id && { color: "#2563eb" }]}>
      {id}
    </Text>
  </TouchableOpacity>
);

const PlaceholderView = ({ label, icon }) => (
  <View style={styles.center}>
    <MaterialCommunityIcons name={icon} size={64} color="#e2e8f0" />
    <Text style={styles.placeholderText}>{label} Coming Soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  headerSub: { fontSize: 12, color: "#64748b", textTransform: "uppercase" },
  tabBar: {
    flexDirection: "row",
    height: 60,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  tab: { flex: 1, justifyContent: "center", alignItems: "center" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2563eb" },
  tabLabel: { fontSize: 10, fontWeight: "800", marginTop: 2, color: "#94a3b8" },
  content: { flex: 1 },
  scroll: { flex: 1 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  colHeader: { fontSize: 10, fontWeight: "900", color: "#64748b" },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  cell: { fontSize: 11, color: "#334155" },
  meterSmall: { fontSize: 10, color: "#2563eb", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "700",
  },

  // ⚡ METER SPECIFIC STYLING
  meterNo: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0f172a", // Deep Navy/Black
  },
  noMeters: {
    fontSize: 10,
    color: "#94a3b8", // Slate 400
    fontStyle: "italic",
  },
  // 🏷️ ADDITIONAL FORMATTING
  erfText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#1e293b",
  },
  addressText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  detailText: {
    fontSize: 10,
    color: "#64748b",
    lineHeight: 14,
  },
});
