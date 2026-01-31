import { useMemo, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { useGeo } from "../context/GeoContext";
import { useWarehouse } from "../context/WarehouseContext";
import { erfsApi } from "../redux/erfsApi";
import { premisesApi } from "../redux/premisesApi";
import { erfMemory } from "../storage/erfMemory";
import { premiseMemory } from "../storage/premiseMemory";

const EMPTY_META = { metaEntries: [] };
const EMPTY_PREMS = [];

const StealthAuditor = ({ lmPcode = "ZA1048" }) => {
  const [visible, setVisible] = useState(false);
  const warehouse = useWarehouse();
  const { geoState } = useGeo();

  // 🧠 REDUX CACHE SELECTORS (RAM)
  const ramErfData = useSelector(
    (state) =>
      erfsApi.endpoints.getErfsByLmPcode.select({ lmPcode })(state)?.data ||
      EMPTY_META,
  );
  const ramPremiseData = useSelector(
    (state) =>
      premisesApi.endpoints.getPremisesByLmPcode.select({ lmPcode })(state)
        ?.data || EMPTY_PREMS,
  );

  const auditReport = useMemo(() => {
    // 💾 DISK DATA
    const diskRaw = erfMemory.getErfsMetaList(lmPcode);
    const diskErfs = Array.isArray(diskRaw)
      ? diskRaw
      : diskRaw?.metaEntries || [];
    const diskPremises = premiseMemory.getLmList(lmPcode) || [];
    // console.log(`StealthAuditor ----diskErfs`, diskErfs);

    // diskErfs?.map((erf) => console.log(`StealthAuditor ----id`, erf?.id));

    // 🧠 RAM DATA
    const ramErfs = ramErfData?.metaEntries || [];

    // 🎯 METER & LINK LOGIC
    const countMeters = (prems) =>
      prems.reduce(
        (acc, p) => ({
          water: acc.water + (p.services?.waterMeters?.length || 0),
          elec: acc.elec + (p.services?.electricityMeters?.length || 0),
        }),
        { water: 0, elec: 0 },
      );

    const ramMeters = countMeters(ramPremiseData);
    const diskMeters = countMeters(diskPremises);

    // 🏘️ TABLE 1: Erfs with Premises (Rule 2)
    const linkedErfs = diskErfs
      .filter((e) => e.premises?.length > 0)
      .map((e) => ({ erfNo: e.erfNo, count: e.premises.length }));

    // 📟 TABLE 2: Premises with Meters (Rule 3)
    const premiseMeterLinks = diskPremises.map((p) => ({
      erfNo: p.erfNo || "??",
      id: p.id.slice(-6),
      water: p.services?.waterMeters?.length || 0,
      elec: p.services?.electricityMeters?.length || 0,
    }));

    return {
      ram: {
        erfs: ramErfs.length,
        prems: ramPremiseData?.length || 0,
        meters: ramMeters.water + ramMeters.elec,
        links: ramErfs.reduce((acc, e) => acc + (e.premises?.length || 0), 0),
      },
      disk: {
        erfs: diskErfs.length,
        prems: diskPremises.length,
        meters: diskMeters.water + diskMeters.elec,
        links: diskErfs.reduce((acc, e) => acc + (e.premises?.length || 0), 0),
      },
      linkedErfs,
      premiseMeterLinks,
      isSynced:
        ramErfs.length === diskErfs.length &&
        ramPremiseData.length === diskPremises.length,
    };
  }, [ramErfData, ramPremiseData, lmPcode]);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: auditReport.isSynced ? "#4CD964" : "#FF9500" },
        ]}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.fabText}>📊</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>System Diagnostic</Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* 📍 SECTION 1: GEO CONTEXT (The Compass) */}
            <Text style={styles.sectionTitle}>📍 GEO CONTEXT</Text>
            <View style={styles.contextCard}>
              <ContextRow
                label="LM"
                value={geoState.selectedLm?.id || "None"}
              />
              <ContextRow
                label="Ward"
                value={geoState.selectedWard || "None"}
              />
              <ContextRow
                label="Erf"
                value={geoState.selectedErf?.erfNo || "None"}
              />
              <ContextRow
                label="Premise"
                value={geoState.selectedPremise?.id?.slice(-6) || "None"}
              />
            </View>

            {/* 💾 SECTION 2: STORAGE INTEGRITY (RAM vs DISK) */}
            <Text style={styles.sectionTitle}>💾 STORAGE INTEGRITY</Text>
            <View style={styles.statsContainer}>
              <AuditCard
                title="🧠 RAM CACHE"
                data={auditReport.ram}
                color="#007AFF"
              />
              <AuditCard
                title="💾 MMKV DISK"
                data={auditReport.disk}
                color="#4CD964"
              />
            </View>

            {/* 🏘️ SECTION 3: ERF LINKS (Rule 2) */}
            <Text style={styles.sectionTitle}>🏘️ ERFS WITH PREMISE LINKS</Text>
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={{ flex: 2, fontSize: 10, fontWeight: "800" }}>
                  Erf No
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 10,
                    fontWeight: "800",
                    textAlign: "right",
                  }}
                >
                  Total Prems
                </Text>
              </View>
              {auditReport.linkedErfs.map((item, i) => {
                console.log(`StealthAuditor ----item`, item);
                return (
                  <View key={i} style={styles.tableRow}>
                    <Text style={{ flex: 2, fontWeight: "700" }}>
                      {item.erfNo}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: "right",
                        color: "#059669",
                        fontWeight: "bold",
                      }}
                    >
                      {item.count}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* 📟 SECTION 4: PREMISE METERS (Rule 3) */}
            <Text style={styles.sectionTitle}>📟 PREMISES WITH METERS</Text>
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableColHead}>ERF</Text>
                <Text style={styles.tableColHead}>PREM ID</Text>
                <Text style={styles.tableColHead}>WTR</Text>
                <Text style={styles.tableColHead}>ELC</Text>
              </View>
              {auditReport.premiseMeterLinks.map((p, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableColText}>{p.erfNo}</Text>
                  <Text style={styles.tableColText}>{p.id}</Text>
                  <Text style={[styles.tableColText, { color: "#3b82f6" }]}>
                    {p.water}
                  </Text>
                  <Text style={[styles.tableColText, { color: "#f59e0b" }]}>
                    {p.elec}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

// --- Helpers ---
const ContextRow = ({ label, value }) => (
  <View style={styles.contextRow}>
    <Text style={styles.contextLabel}>{label}:</Text>
    <Text style={styles.contextValue}>{value}</Text>
  </View>
);

const AuditCard = ({ title, data, color }) => {
  console.log(`title`, title);
  console.log(`data`, data);
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      <Text style={styles.statLabel}>
        Erfs: <Text style={styles.statVal}>{data.erfs}</Text>
      </Text>
      <Text style={styles.statLabel}>
        Prems: <Text style={styles.statVal}>{data.prems}</Text>
      </Text>
      <Text style={styles.statLabel}>
        Meters: <Text style={styles.statVal}>{data.meters}</Text>
      </Text>
      <Text style={styles.statLabel}>
        Links: <Text style={styles.statVal}>{data.links}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  fabText: { fontSize: 24 },
  modalContainer: { flex: 1, backgroundColor: "#F2F2F7" },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "900" },
  closeBtn: { padding: 8, backgroundColor: "#FF3B30", borderRadius: 6 },
  closeText: { color: "#fff", fontWeight: "bold" },
  content: { padding: 15 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#8E8E93",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  contextCard: { backgroundColor: "#fff", padding: 15, borderRadius: 12 },
  contextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  contextLabel: { fontSize: 12, color: "#8E8E93", fontWeight: "600" },
  contextValue: { fontSize: 12, fontWeight: "800" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderTopWidth: 5,
  },
  cardTitle: { fontWeight: "900", fontSize: 11, marginBottom: 8 },
  statLabel: { fontSize: 10, color: "#8E8E93", marginBottom: 2 },
  statVal: { color: "#000", fontWeight: "800" },
  tableCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingBottom: 6,
  },
  tableColHead: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textAlign: "center",
  },
  tableColText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#f1f5f9",
  },
});

export default StealthAuditor;
