import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import HydrationActivityIndicator from "../../../components/HydrationActivityIndicator";
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";
import ErfFilterHeader from "./erfFilterHeader";
import { ErfItem } from "./erfItem";
import { ErfReport } from "./ErfReport";
import ErfsBottomSearch from "./ErfsBottomSearch";

function EmptyScopeState({ title = "SCOPE NOT READY", message }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "900",
          color: "#0F172A",
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "#64748B",
          textAlign: "center",
        }}
      >
        {message}
      </Text>
    </View>
  );
}

function AwaitWardState({ lmName, wardsCount }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "900",
          color: "#0F172A",
          letterSpacing: 1,
        }}
      >
        SELECT A WARD
      </Text>

      <Text
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "#64748B",
          textAlign: "center",
        }}
      >
        You are currently viewing the LM overview for:
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: "800",
          color: "#334155",
          textAlign: "center",
        }}
      >
        {lmName}
      </Text>

      <Text
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "#94A3B8",
          textAlign: "center",
        }}
      >
        {wardsCount > 0
          ? "Choose a ward from the ward selector above to load ERFs."
          : "No wards are currently available for this LM."}
      </Text>
    </View>
  );
}

function NoErfsState({ lmName, wardName, onRetry }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "900",
          color: "#0F172A",
          letterSpacing: 1,
        }}
      >
        NO ERFs FOUND
      </Text>

      <Text
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "#64748B",
          textAlign: "center",
        }}
      >
        There are currently no ERFs loaded for:
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: "800",
          color: "#334155",
          textAlign: "center",
        }}
      >
        {lmName} • {wardName}
      </Text>

      <Text
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "#94A3B8",
          textAlign: "center",
        }}
      >
        If this is unexpected, check your ward selection or data pipeline.
      </Text>

      {!!onRetry && (
        <Text
          onPress={onRetry}
          style={{
            marginTop: 18,
            fontSize: 11,
            fontWeight: "900",
            color: "#00BFFF",
          }}
        >
          TAP TO RETRY
        </Text>
      )}
    </View>
  );
}

export default function ErfsScreen() {
  const isFocused = useIsFocused();
  const lastScrolledIdRef = useRef(null);
  const flatListRef = useRef(null);
  const router = useRouter();

  const { geoState, updateGeo } = useGeo();
  const { all, filtered, sync } = useWarehouse();

  const [searchQuery, setSearchQuery] = useState("");
  const [reportVisible, setReportVisible] = useState(false);

  const scopeSync = sync?.scope ?? { status: "idle" };
  const wardErfsSync = sync?.erfs ?? { status: "idle" };

  const lmName = geoState?.selectedLm?.name ?? "LOCAL MUNICIPALITY";
  const wardName = geoState?.selectedWard?.name ?? "WARD";

  const hasLm = !!geoState?.selectedLm?.id;
  const hasWard = !!geoState?.selectedWard?.id;

  const wardsCount = all?.wards?.length ?? 0;
  const erfsCount = all?.erfs?.length ?? 0;
  const loadedCount = erfsCount;
  const totalCount = wardErfsSync?.size ?? null;

  const expectedPackKey =
    hasLm && hasWard
      ? `${geoState.selectedLm.id}__${geoState.selectedWard.id}`
      : null;

  const packKeyMatches =
    !!expectedPackKey && wardErfsSync?.wardCacheKey === expectedPackKey;

  const isScopeReady = scopeSync?.status === "ready";
  const isLmOnly = scopeSync?.status === "lm-only";

  const isErfDatasetReady =
    isScopeReady &&
    hasLm &&
    hasWard &&
    packKeyMatches &&
    wardErfsSync?.status === "ready";

  const showHydrationSpinner =
    isScopeReady &&
    hasLm &&
    hasWard &&
    (!packKeyMatches ||
      wardErfsSync?.status === "idle" ||
      wardErfsSync?.status === "syncing");

  const showSyncingBanner =
    isErfDatasetReady && erfsCount > 0 && wardErfsSync?.status === "syncing";

  const filteredErfs = useMemo(() => {
    let sectorPool = [...(filtered?.erfs || [])];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      sectorPool = sectorPool.filter(
        (e) =>
          e?.erfNo?.toLowerCase().includes(q) ||
          e?.id?.toLowerCase().includes(q),
      );
    }

    return sectorPool;
  }, [searchQuery, filtered?.erfs]);

  const scrollToTarget = useCallback(() => {
    const targetId = geoState?.selectedErf?.id;

    if (!targetId || !flatListRef.current || filteredErfs.length === 0) return;
    if (lastScrolledIdRef.current === targetId) return;

    const index = filteredErfs.findIndex((e) => e.id === targetId);

    if (index !== -1) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0,
        });
        lastScrolledIdRef.current = targetId;
      });
    }
  }, [geoState?.selectedErf?.id, filteredErfs]);

  useEffect(() => {
    lastScrolledIdRef.current = null;
  }, [geoState?.selectedWard?.id]);

  useEffect(() => {
    if (!isFocused) return;
    if (!isErfDatasetReady) return;
    if (!geoState?.selectedErf?.id) return;

    const timer = setTimeout(scrollToTarget, 300);
    return () => clearTimeout(timer);
  }, [isFocused, isErfDatasetReady, geoState?.selectedErf?.id, scrollToTarget]);

  if (!hasLm) {
    return <EmptyScopeState message="No active workbase is selected." />;
  }

  if (scopeSync?.status === "invalid-ward") {
    return (
      <EmptyScopeState message="The selected ward does not belong to the active workbase." />
    );
  }

  if (isLmOnly || !hasWard) {
    return (
      <View style={styles.container}>
        <ErfFilterHeader
          selectedWard={geoState.selectedWard}
          setSelectedWard={(w) =>
            updateGeo({ selectedWard: w, lastSelectionType: "WARD" })
          }
          availableWards={all?.wards}
          filteredCount={0}
          totalCount={0}
          selectedErf={geoState.selectedErf}
          onScrollToSelected={scrollToTarget}
        />

        <AwaitWardState lmName={lmName} wardsCount={wardsCount} />

        <ErfsBottomSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          count={0}
        />
      </View>
    );
  }

  if (showHydrationSpinner) {
    return (
      <HydrationActivityIndicator
        status={wardErfsSync?.status}
        title="HYDRATING SOVEREIGN VAULT..."
        subtitle={`LOADING ${lmName} • ${wardName}`}
        showOnceHint
        errorText={wardErfsSync?.lastError || null}
        loadedCount={loadedCount}
        totalCount={totalCount}
      />
    );
  }

  return (
    <View style={styles.container}>
      {showSyncingBanner && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator size="small" />
          <Text style={styles.syncingText}>SYNCING LATEST UPDATES...</Text>
        </View>
      )}

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
        extraData={geoState?.selectedErf?.id}
        estimatedItemSize={106}
        onScrollToIndexFailed={(info) => {
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
              updateGeo({
                selectedErf: item,
                // selectedPremise: null,
                // selectedMeter: null,
                lastSelectionType: "ERF",
              });
              router.push("/(tabs)/premises");
            }}
            // onErfDetailPress={(item) => {
            //   updateGeo({ selectedErf: item, lastSelectionType: "ERF" });
            //   router.push(`/erfs/${item?.id}`);
            // }}
          />
        )}
        ListEmptyComponent={
          isErfDatasetReady ? (
            <NoErfsState
              lmName={lmName}
              wardName={wardName}
              onRetry={() =>
                updateGeo(
                  { flightSignal: geoState.flightSignal + 1 },
                  { silent: true },
                )
              }
            />
          ) : null
        }
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
