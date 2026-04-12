import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import HydrationActivityIndicator from "../../../components/HydrationActivityIndicator";
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";
import ErfFilterHeader from "./erfFilterHeader";
import { ErfItem } from "./erfItem";
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
  console.log(`ErfsScreen --mounting`);
  const router = useRouter();

  const { geoState, updateGeo } = useGeo();
  const { all, filtered, sync } = useWarehouse();

  const [searchQuery, setSearchQuery] = useState("");

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

  const visibleErfs = useMemo(() => {
    let list = [...(filtered?.erfs || [])];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e?.erfNo?.toLowerCase().includes(q) ||
          e?.id?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [searchQuery, filtered?.erfs]);

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
          filteredCount={0}
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
        filteredCount={visibleErfs.length}
      />

      <FlashList
        data={visibleErfs}
        keyExtractor={(item) => item?.id}
        estimatedItemSize={106}
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
                lastSelectionType: "ERF",
              });
              router.push("/(tabs)/premises");
            }}
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
        count={visibleErfs.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  syncingBanner: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  syncingText: { fontSize: 10, color: "#1976d2", fontWeight: "bold" },
});
