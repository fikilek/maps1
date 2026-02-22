import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// 🏛️ SOVEREIGN CONTEXTS ONLY
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";
import ErfFilterHeader from "./erfFilterHeader";
import { ErfReport } from "./ErfReport";
import ErfsBottomSearch from "./ErfsBottomSearch";

import { HandleNuclearReset } from "../../test/mmkvNuclearReset";
import StealthAuditor from "../../test/premisesDiagnosis";
import { ErfItem } from "./erfItem";

export default function ErfsScreen() {
  const isFocused = useIsFocused();
  const lastScrolledIdRef = useRef(null);
  const flatListRef = useRef(null);
  const router = useRouter();

  const { geoState, updateGeo } = useGeo();
  const { all, filtered, loading } = useWarehouse();
  const [searchQuery, setSearchQuery] = useState("");
  const [reportVisible, setReportVisible] = useState(false);

  // 1. 🎯 THE DATA POOL: Memoized for stability
  const filteredErfs = useMemo(() => {
    let sectorPool = [...(filtered?.erfs || [])];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      sectorPool = sectorPool.filter(
        (e) =>
          e?.erfNo?.toLowerCase().includes(q) ||
          e.id?.toLowerCase().includes(q),
      );
    }
    return sectorPool;
  }, [searchQuery, filtered?.erfs]);

  // Inside ErfsScreen.js

  const scrollToTarget = useCallback(() => {
    const targetId = geoState?.selectedErf?.id;

    // 🛡️ Safety check: No target or no list? Stand down.
    if (!targetId || !flatListRef.current || filteredErfs.length === 0) return;

    const index = filteredErfs.findIndex((e) => e.id === targetId);

    if (index !== -1) {
      console.log(
        `🚀 [SCROLL SENTINEL]: Index ${index} located. Executing jump.`,
      );

      // 🎯 We use requestAnimationFrame to ensure the A06
      // has finished its "Render Cycle" before we move the list.
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0, // 📍 Keeps it comfortably visible below the header
        });
        lastScrolledIdRef.current = targetId; // Mark mission success
      });
    }
  }, [geoState?.selectedErf?.id, filteredErfs]);

  // 🛰️ AUTO-JUMP: When user selects from Map and lands here
  useEffect(() => {
    if (isFocused && geoState?.selectedErf?.id) {
      // Give the screen 300ms to "settle" before the first jump
      const timer = setTimeout(scrollToTarget, 300);
      return () => clearTimeout(timer);
    }
  }, [isFocused, geoState?.selectedErf?.id, scrollToTarget]);

  // Show the spinner if the system is loading AND we have no Erfs yet.
  if (loading && (!all?.erfs || all.erfs.length === 0)) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#00BFFF" />
        <Text
          style={{
            marginTop: 15,
            fontWeight: "800",
            color: "#64748b",
            letterSpacing: 1,
          }}
        >
          HYDRATING SOVEREIGN VAULT...
        </Text>
        <Text style={{ fontSize: 10, color: "#94a3b8", marginTop: 5 }}>
          LOADING EPHRAIM MOGALE DATA
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Testing & Diagnostics */}
      <View>
        <HandleNuclearReset />
        <StealthAuditor />
      </View>

      <ErfFilterHeader
        selectedWard={geoState.selectedWard}
        setSelectedWard={(w) =>
          updateGeo({ selectedWard: w, lastSelectionType: "WARD" })
        }
        availableWards={all?.wards}
        filteredCount={filteredErfs.length}
        totalCount={all?.erfs?.length || 0}
        selectedErf={geoState.selectedErf}
        onScrollToSelected={scrollToTarget}
      />

      <FlashList
        ref={flatListRef}
        data={filteredErfs}
        keyExtractor={(item) => item?.id}
        extraData={geoState?.selectedErf?.id} // 🎯 Crucial for highlighting
        estimatedItemSize={106}
        onScrollToIndexFailed={(info) => {
          // A06 Fallback: Sometimes the item isn't rendered yet
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
          setTimeout(() => scrollToTarget(), 100);
        }}
        renderItem={({ item }) => (
          <ErfItem
            item={item}
            isActive={item?.id === geoState?.selectedErf?.id}
            onSelect={() => {
              const isSame = geoState?.selectedErf?.id === item.id;
              updateGeo({
                selectedErf: isSame ? null : item,
                lastSelectionType: isSame ? null : "ERF",
              });
            }}
            onMapPress={() => {
              updateGeo({ selectedErf: item, lastSelectionType: "ERF" });
              router.push("/(tabs)/maps");
            }}
            onErfDetailPress={(item) => {
              updateGeo({ selectedErf: item, lastSelectionType: "ERF" });
              router.push(`/erfs/${item?.id}`);
            }}
          />
        )}
      />

      <ErfsBottomSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        count={filteredErfs.length}
      />

      <ErfReport
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        erf={geoState.selectedErf}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  itemWrapper: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 3,
  },
  activeItemWrapper: {
    borderColor: "#00BFFF",
    borderWidth: 2,
    backgroundColor: "#f0faff",
  },
  itemContainer: { flexDirection: "row", alignItems: "center", padding: 12 },
  infoSection: { flex: 1.5 },
  actionSection: { flex: 0.5, alignItems: "center" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0faff",
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconCircle: { backgroundColor: "#e8f5e9" },
  parcelText: { fontSize: 18, fontWeight: "800", color: "#2c3e50" },
  activeText: { color: "#00BFFF" },
  idText: { fontSize: 11, color: "#95a5a6", fontFamily: "monospace" },
  wardText: { fontSize: 12, color: "#7f8c8d", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  mapLinkText: { fontSize: 10, fontWeight: "bold", color: "#00BFFF" },
  syncingBanner: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  syncingText: { fontSize: 10, color: "#1976d2", fontWeight: "bold" },
  summaryStats: { alignItems: "center", marginTop: 4 },
  serviceDots: { flexDirection: "row", gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statText: { fontSize: 10, fontWeight: "bold", color: "#666" },

  premiseSection: {
    flex: 0.5,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#eee",
    paddingVertical: 4,
  },
  dashboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 1,
  },
  dashboardCol: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bigCountText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2c3e50",
  },
  serviceCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#546e7a",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 3,
  },
  timeText: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
