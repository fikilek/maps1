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
import { useGeo } from "../context/GeoContext"; // 🎯 Import GeoContext
import { useWarehouse } from "../context/WarehouseContext"; // 🎯 Import Warehouse
import { erfsApi } from "../redux/erfsApi";
import { premisesApi } from "../redux/premisesApi";
import { erfMemory } from "../storage/erfMemory";
import { premiseMemory } from "../storage/premiseMemory";

const EMPTY_META = { metaEntries: [] };
const EMPTY_PREMS = [];

const StealthAuditor = ({ lmPcode = "ZA1048" }) => {
  const [visible, setVisible] = useState(false);

  // 🏛️ WAREHOUSE & GEO CONTEXT
  const warehouse = useWarehouse();
  console.log(` `);
  console.log(
    `StealthAuditor ----warehouse?.all?.erfs?.length`,
    warehouse?.all?.erfs?.length,
  );
  const { geoState } = useGeo();

  // 🧠 DIRECT RAM READ (Redux Cache)
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
    // 1. Get whatever is on disk
    const diskRaw = erfMemory.getErfsMetaList(lmPcode);

    // 🎯 SMART EXTRACTION:
    // If it's an array, use it. If it's an object with metaEntries, use those.
    const diskErfs = Array.isArray(diskRaw)
      ? diskRaw
      : diskRaw?.metaEntries || [];

    const diskPremises = premiseMemory.getLmList(lmPcode) || [];
    const ramErfs = ramErfData?.metaEntries || [];

    // 🛡️ Safe Calculation helpers
    const getLinks = (arr) =>
      Array.isArray(arr)
        ? arr.reduce((acc, e) => acc + (e.premises?.length || 0), 0)
        : 0;

    const totalRamLinks = getLinks(ramErfs);
    const totalDiskLinks = getLinks(diskErfs);

    return {
      ram: {
        erfs: ramErfs.length,
        prems: ramPremiseData?.length || 0,
        links: totalRamLinks,
      },
      disk: {
        erfs: diskErfs.length,
        prems: diskPremises.length,
        links: totalDiskLinks,
      },
      isSynced:
        (ramErfData?.metaEntries?.length || 0) === diskErfs.length &&
        (ramPremiseData?.length || 0) === diskPremises.length &&
        totalRamLinks === totalDiskLinks,
    };
  }, [ramErfData, ramPremiseData, lmPcode]);

  // const auditReport = useMemo(() => {
  //   // 🎯 FIX: erfMemory returns an object { metaEntries: [], geoEntries: {}, ... }
  //   const diskRaw = erfMemory.getErfsMetaList(lmPcode);
  //   const diskErfs = diskRaw?.metaEntries || []; // Extract the array here

  //   const diskPremises = premiseMemory.getLmList(lmPcode) || [];

  //   const ramErfs = ramErfData.metaEntries || [];

  //   // 🛡️ Safety filters to ensure we are working with arrays
  //   const ramLinkedErfs = Array.isArray(ramErfs)
  //     ? ramErfs.filter((e) => e.premises?.length > 0)
  //     : [];

  //   const totalRamLinks = ramLinkedErfs.reduce(
  //     (acc, e) => acc + (e.premises?.length || 0),
  //     0,
  //   );

  //   // 🎯 This was the crashing line: now diskErfs is guaranteed to be an array
  //   const diskLinkedErfs = diskErfs.filter((e) => e.premises?.length > 0);
  //   const totalDiskLinks = diskLinkedErfs.reduce(
  //     (acc, e) => acc + (e.premises?.length || 0),
  //     0,
  //   );

  //   return {
  //     ram: {
  //       erfs: ramErfs.length,
  //       prems: ramPremiseData?.length || 0,
  //       links: totalRamLinks,
  //     },
  //     disk: {
  //       erfs: diskErfs.length,
  //       prems: diskPremises.length,
  //       links: totalDiskLinks,
  //     },
  //     isSynced:
  //       (ramPremiseData?.length || 0) === (diskPremises?.length || 0) &&
  //       totalRamLinks === totalDiskLinks,
  //   };
  // }, [ramErfData, ramPremiseData, lmPcode]);

  // const auditReport = useMemo(() => {
  //   const diskErfs = erfMemory.getErfsMetaList(lmPcode) || [];
  //   const diskPremises = premiseMemory.getLmList(lmPcode) || [];

  //   const ramErfs = ramErfData.metaEntries || [];
  //   const ramLinkedErfs = ramErfs?.filter((e) => e.premises?.length > 0);
  //   const totalRamLinks = ramLinkedErfs.reduce(
  //     (acc, e) => acc + (e.premises?.length || 0),
  //     0,
  //   );

  //   const diskLinkedErfs = diskErfs?.filter((e) => e.premises?.length > 0);
  //   const totalDiskLinks = diskLinkedErfs.reduce(
  //     (acc, e) => acc + (e.premises?.length || 0),
  //     0,
  //   );

  //   return {
  //     ram: {
  //       erfs: ramErfs?.length || [],
  //       prems: ramPremiseData?.length || [],
  //       links: totalRamLinks || [],
  //     },
  //     disk: {
  //       erfs: diskErfs?.length || [],
  //       prems: diskPremises?.length || [],
  //       links: totalDiskLinks || [],
  //     },
  //     isSynced:
  //       ramPremiseData?.length === diskPremises?.length &&
  //       totalRamLinks === totalDiskLinks,
  //   };
  // }, [ramErfData, ramPremiseData, lmPcode]);

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
            <Text style={styles.headerTitle}>System Diagnostic</Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* SECTION 1: GEO CONTEXT (Current Selections) */}
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

            {/* SECTION 2: WAREHOUSE (The Logic Layer) */}
            <Text style={styles.sectionTitle}>🏭 WAREHOUSE DASHBOARD</Text>
            <View style={styles.statsContainer}>
              <WarehouseCard
                title="📦 ALL DATA"
                stats={{
                  erfs: warehouse?.all?.erfs?.length || [],
                  wards: warehouse?.all?.wards?.length || [],
                  prems: warehouse?.all?.prems?.length || [],
                }}
                color="#5856D6"
              />
              <WarehouseCard
                title="🔍 FILTERED"
                stats={{
                  erfs: warehouse?.filtered?.erfs?.length || 0,
                  wards: warehouse?.filtered?.wards?.length || 0,
                  prems: warehouse?.filtered?.prems?.length || 0,
                }}
                color="#AF52DE"
              />
            </View>

            {/* SECTION 3: STORAGE (RAM vs DISK) */}
            <Text style={styles.sectionTitle}>💾 STORAGE INTEGRITY</Text>
            <View style={styles.statsContainer}>
              <AuditCard
                title="🧠 RAM CACHE"
                data={auditReport?.ram}
                color="#007AFF"
              />
              <AuditCard
                title="💾 MMKV DISK"
                data={auditReport?.disk}
                color="#4CD964"
              />
            </View>

            {!auditReport?.isSynced && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>⚠️ DISK/RAM OUT OF SYNC</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

// --- Helper Components ---

const ContextRow = ({ label, value }) => (
  <View style={styles.contextRow}>
    <Text style={styles.contextLabel}>{label}:</Text>
    <Text style={styles.contextValue}>{value}</Text>
  </View>
);

const WarehouseCard = ({ title, stats, color }) => {
  console.log(` `);
  console.log(`WarehouseCard ----title`, title);
  console.log(`WarehouseCard ----stats`, stats);
  console.log(`------------------------------------------- `);

  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      <Text style={styles.statLabel}>
        Erfs: <Text style={styles.statVal}>{stats.erfs}</Text>
      </Text>
      <Text style={styles.statLabel}>
        Wards: <Text style={styles.statVal}>{stats.wards}</Text>
      </Text>
      <Text style={styles.statLabel}>
        Prems: <Text style={styles.statVal}>{stats.prems}</Text>
      </Text>
    </View>
  );
};

const AuditCard = ({ title, data, color }) => {
  console.log(` `);
  console.log(`AuditCard ----title`, title);
  console.log(`AuditCard ----data`, data);
  console.log(`------------------------------------------- `);
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
        Links: <Text style={styles.statVal}>{data.links}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    // bottom: 20,
    // right: 20,
    width: 56,
    height: 56,
    // borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  fabText: { fontSize: 24 },
  modalContainer: { flex: 1, backgroundColor: "#F2F2F7" },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D1D6",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  closeBtn: { padding: 8, backgroundColor: "#FF3B30", borderRadius: 6 },
  closeText: { color: "#fff", fontWeight: "bold" },
  content: { padding: 15 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8E8E93",
    marginBottom: 10,
    marginTop: 15,
    textTransform: "uppercase",
  },
  contextCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 5,
  },
  contextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  contextLabel: { fontSize: 13, color: "#8E8E93", fontWeight: "600" },
  contextValue: { fontSize: 13, color: "#000", fontWeight: "700" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderTopWidth: 5,
  },
  cardTitle: { fontWeight: "bold", fontSize: 12, marginBottom: 8 },
  statLabel: { fontSize: 11, color: "#8E8E93", marginBottom: 2 },
  statVal: { color: "#000", fontWeight: "bold" },
  warningBanner: {
    backgroundColor: "#FF9500",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  warningText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});

export default StealthAuditor;
