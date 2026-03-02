import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useGeo } from "../context/GeoContext";
import { useWarehouse } from "../context/WarehouseContext";
import { useAuth } from "../hooks/useAuth";
import { erfsApi } from "../redux/erfsApi";
import { premisesApi } from "../redux/premisesApi";
import { erfMemory } from "../storage/erfMemory";
import { premiseMemory } from "../storage/premiseMemory";

const EMPTY_META = { metaEntries: [] };
const EMPTY_PREMS = [];

const StealthAuditor = () => {
  const [visible, setVisible] = useState(false);
  const warehouse = useWarehouse();
  const { geoState } = useGeo();
  const { activeWorkbase } = useAuth();

  const currentPcode = activeWorkbase?.id;

  // 🧠 REDUX CACHE SELECTORS (The RAM Truth)
  const ramErfData = useSelector(
    (state) =>
      erfsApi?.endpoints?.getErfsByLmPcode?.select({ lmPcode: currentPcode })(
        state,
      )?.data || EMPTY_META,
  );

  const ramPremiseData = useSelector(
    (state) =>
      premisesApi?.endpoints?.getPremisesByLmPcode?.select({
        lmPcode: currentPcode,
      })(state)?.data || EMPTY_PREMS,
  );

  const auditReport = useMemo(() => {
    if (!currentPcode) return null;

    // 🏛️ I. RAM INTELLIGENCE (Active Context)
    const ramErfs = ramErfData?.metaEntries || [];
    const ramPrems = ramPremiseData || [];

    // Count geometries held in the Warehouse RAM
    const lib = warehouse?.all?.geoLibrary || {};
    const geoCount = Object.keys(lib).filter(
      (key) => key.length > 10 && !!lib[key]?.geometry,
    ).length;

    // 📟 METER AGGREGATION (RAM-Only)
    const countMeters = (prems) =>
      prems.reduce(
        (acc, p) => {
          const wCount = Array.isArray(p?.services?.waterMeters)
            ? p.services.waterMeters.length
            : p?.services?.waterMeter || 0;

          const eCount = Array.isArray(p?.services?.electricityMeters)
            ? p.services.electricityMeters.length
            : p?.services?.electricityMeter || 0;

          return { water: acc.water + wCount, elec: acc.elec + eCount };
        },
        { water: 0, elec: 0 },
      );

    const meters = countMeters(ramPrems);

    // 💾 II. DISK VERIFICATION (Background Only)
    // We only check the length to ensure Redux Persist is flushing to MMKV
    const diskErfCount = erfMemory?.getErfsMetaList(currentPcode)?.length || 0;
    const diskPremCount = premiseMemory?.getLmList(currentPcode)?.length || 0;

    return {
      pcode: currentPcode,
      name: activeWorkbase?.name,
      ram: {
        erfs: ramErfs.length,
        geo: geoCount,
        prems: ramPrems.length,
        meters: meters.water + meters.elec,
      },
      disk: {
        erfs: diskErfCount,
        prems: diskPremCount,
      },
      isSynced:
        ramErfs.length === diskErfCount && ramPrems.length === diskPremCount,
    };
  }, [
    ramErfData,
    ramPremiseData,
    warehouse?.all?.geoLibrary,
    currentPcode,
    activeWorkbase,
  ]);

  if (!currentPcode) return null;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: auditReport?.isSynced ? "#4CD964" : "#FF9500" },
        ]}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.fabText}>📊</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Sovereign Diagnostic</Text>
              <Text style={styles.headerSub}>
                RAM CACHE: {auditReport?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>🧠 OPERATIONAL RAM (ACTIVE)</Text>
            <View style={styles.contextCard}>
              <ContextRow label="Municipality" value={auditReport?.name} />
              <ContextRow label="P-Code" value={auditReport?.pcode} />
              <ContextRow
                label="Sync Health"
                value={
                  auditReport?.isSynced ? "✅ VAULT SECURE" : "🔄 PERSISTING..."
                }
              />
            </View>

            <View style={styles.statsContainer}>
              <AuditCard
                title="⚡ LIVE RAM"
                data={auditReport?.ram}
                color="#007AFF"
              />
              <AuditCard
                title="💾 DISK BACKUP"
                data={{
                  erfs: auditReport?.disk.erfs,
                  prems: auditReport?.disk.prems,
                  geo: "---", // Disk geo is shredded, RAM count is the truth
                  meters: "---",
                }}
                color="#8E8E93"
              />
            </View>

            <View style={styles.footerInfo}>
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color="#4CD964"
              />
              <Text style={styles.footerText}>
                Data persisted via MMKV + Redux Persist
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const ContextRow = ({ label, value }) => (
  <View style={styles.contextRow}>
    <Text style={styles.contextLabel}>{label}:</Text>
    <Text style={styles.contextValue}>{value}</Text>
  </View>
);

const AuditCard = ({ title, data, color }) => (
  <View style={[styles.card, { borderTopColor: color }]}>
    <Text style={[styles.cardTitle, { color }]}>{title}</Text>
    <Text style={styles.statLabel}>
      Erfs: <Text style={styles.statVal}>{data?.erfs}</Text>
    </Text>
    <Text style={styles.statLabel}>
      Geo: <Text style={styles.statVal}>{data?.geo}</Text>
    </Text>
    <Text style={styles.statLabel}>
      Prems: <Text style={styles.statVal}>{data?.prems}</Text>
    </Text>
    <Text style={styles.statLabel}>
      Meters: <Text style={styles.statVal}>{data?.meters}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    zIndex: 9999,
  },
  fabText: { fontSize: 28 },
  modalContainer: { flex: 1, backgroundColor: "#F2F2F7" },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: { fontSize: 20, fontWeight: "900" },
  headerSub: { fontSize: 12, color: "#8E8E93", fontWeight: "600" },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#000",
    borderRadius: 8,
  },
  closeText: { color: "#fff", fontWeight: "bold" },
  content: { padding: 15 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#8E8E93",
    marginTop: 25,
    marginBottom: 10,
    letterSpacing: 1,
  },
  contextCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  contextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  contextLabel: { fontSize: 13, color: "#8E8E93", fontWeight: "600" },
  contextValue: { fontSize: 13, fontWeight: "800" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    borderTopWidth: 6,
  },
  cardTitle: { fontWeight: "900", fontSize: 12, marginBottom: 10 },
  statLabel: { fontSize: 11, color: "#8E8E93", marginBottom: 5 },
  statVal: { color: "#000", fontWeight: "800" },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    gap: 5,
  },
  footerText: { fontSize: 10, color: "#8E8E93", fontWeight: "600" },
});

export default StealthAuditor;
