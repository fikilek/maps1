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

// import { useSelector } from "react-redux";
import HydrationActivityIndicator from "../../../components/HydrationActivityIndicator";
import { ErfItem } from "./erfItem";

// const MyComponent = () => {
//   // 🏛️ SOVEREIGN SELECTION: Only listen to the specific Erf Cache
//   // This prevents the "Root State" warning and stops 90% of unnecessary rerenders.
//   const erfCache = useSelector((state) => state.erfsApi?.queries);
//   const authCache = useSelector((state) => state.authApi?.queries);

//   if (__DEV__) {
//     console.log("Targeted Erf Cache:", erfCache);
//     // console.log(`erfCache:`, JSON.stringify(erfCache, null, 2));

//     console.log("Targeted Auth Cache:", authCache);
//   }

//   return null;
// };

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

  console.log(` `);
  console.log(` `);
  console.log(` `);
  const { geoState, updateGeo } = useGeo();
  const { all, filtered, sync, loading } = useWarehouse();

  const [searchQuery, setSearchQuery] = useState("");
  const [reportVisible, setReportVisible] = useState(false);

  // 0. SYNC
  const wardErfsSync = sync?.erfs ?? { status: "idle" };

  // const wardsSync = sync?.wards ?? { status: "idle" };

  // 1. SELECTION STATE

  const lmName = geoState?.selectedLm?.name ?? "LOCAL MUNICIPALITY";
  const wardName = geoState?.selectedWard?.name ?? "WARD";
  const lmPcode = geoState?.selectedLm?.id ?? null;

  console.log("ErfsScreen --lmName", lmName);
  console.log("ErfsScreen --lmPcode", lmPcode);

  const hasLm = !!geoState?.selectedLm?.id;
  console.log("ErfsScreen --hasLm", hasLm);
  const hasWard = !!geoState?.selectedWard?.id;
  console.log("ErfsScreen --hasWard", hasWard);
  // console.log("ErfsScreen --wardErfsSync?.status", wardErfsSync?.status);

  // 2. COUNTS
  const wardsCount = all?.wards?.length ?? 0;
  console.log("ErfsScreen --wardsCount", wardsCount);

  const erfsCount = all?.erfs?.length ?? 0;

  const loadedCount = erfsCount;
  const totalCount = wardErfsSync?.size ?? null;

  // // 3. PACK IDENTITY
  const expectedPackKey =
    hasLm && hasWard
      ? `${geoState.selectedLm.id}__${geoState.selectedWard.id}`
      : null;

  const packKeyMatches =
    !!expectedPackKey && wardErfsSync?.wardCacheKey === expectedPackKey;

  // // 4. UI PHASE FLAGS
  // const showWardsLoading =
  //   hasLm &&
  //   !hasWard &&
  //   (wardsSync?.status === "syncing" || (wardsCount === 0 && loading));
  // // console.log("ErfsScreen --showWardsLoading", showWardsLoading);

  // const showNoWardsState =
  //   hasLm &&
  //   !hasWard &&
  //   wardsSync?.status === "ready" &&
  //   // wardsCount === 0 &&
  //   !loading;
  // // console.log("ErfsScreen --showNoWardsState", showNoWardsState);

  const isErfDatasetReady =
    hasLm && hasWard && packKeyMatches && wardErfsSync?.status === "ready";
  console.log("ErfsScreen --isErfDatasetReady", isErfDatasetReady);

  // const showNoErfsState = isErfDatasetReady && erfsCount === 0;
  // console.log("ErfsScreen --showNoErfsState", showNoErfsState);

  const showSyncingBanner =
    isErfDatasetReady && erfsCount > 0 && wardErfsSync?.status === "syncing";
  // console.log("ErfsScreen --showSyncingBanner", showSyncingBanner);

  // console.log(` `);
  // const showWaitingForWard = hasLm && !hasWard && wardsCount > 0;
  // console.log("ErfsScreen --showWaitingForWard", showWaitingForWard);

  // // 1. WAITING FOR WARD RESOLUTION
  // const showWaitingForWardResolution =
  //   hasLm && !hasWard && wardsSync?.status !== "ready";
  // console.log(
  //   "ErfsScreen --showWaitingForWardResolution",
  //   showWaitingForWardResolution,
  // );

  // // 2. HYDRATING ACTIVE WARD ERFS
  // const showHydrationSpinner = hasLm && hasWard && !isErfDatasetReady;
  // console.log("ErfsScreen --showHydrationSpinner", showHydrationSpinner);

  // // 3. NO WARD DATA EXISTS FOR THIS LM
  // const showNoWardErfsState =
  //   hasLm && !hasWard && wardsSync?.status === "ready" && wardsCount === 0;
  // console.log("ErfsScreen --showNoWardErfsState", showNoWardErfsState);

  // // 4. ACTIVE WARD ERFS READY
  // const showErfs = hasLm && hasWard && isErfDatasetReady;
  // console.log("ErfsScreen --showErfs", showErfs);

  /*************************************
   *    * ERFS FILTERING
   *************************************/

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

  /*************************************
   *    ERF ITEM SCROLLING
   *************************************/

  const scrollToTarget = useCallback(() => {
    const targetId = geoState?.selectedErf?.id;

    if (!targetId || !flatListRef.current || filteredErfs.length === 0) return;

    // prevent noisy repeat jumps to the same already-handled target
    if (lastScrolledIdRef.current === targetId) return;

    const index = filteredErfs.findIndex((e) => e.id === targetId);

    if (index !== -1) {
      console.log(
        `🚀 [SCROLL SENTINEL]: Index ${index} located. Executing jump.`,
      );

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

  // reset scroll sentinel when ward changes
  useEffect(() => {
    lastScrolledIdRef.current = null;
  }, [geoState?.selectedWard?.id]);

  // auto-jump only when dataset is truly ready
  useEffect(() => {
    if (!isFocused) return;
    if (!isErfDatasetReady) return;
    if (!geoState?.selectedErf?.id) return;

    const timer = setTimeout(scrollToTarget, 300);
    return () => clearTimeout(timer);
  }, [isFocused, geoState?.selectedErf?.id, scrollToTarget]);

  /*************************************
   *    RENDER DECISION TREE
   *************************************/
  // 1️⃣ SYNCING (wards or erfs still syncing)
  console.log("ErfsScreen --wardErfsSync?.status", wardErfsSync?.status);
  const isSyncing = sync?.erfs?.status === "syncing";
  const idle = sync?.erfs?.status === "idle";
  const ready = sync?.erfs?.status === "ready";

  if (isSyncing) {
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

  // 2️⃣ DO WE HAVE ERFS FOR THIS LM/WARD?
  // const hasWardErfs = (all?.erfs?.length ?? 0) > 0;
  // console.log("ErfsScreen --hasWardErfs", hasWardErfs);

  // const erfCountForActiveWard = wardErfsSync?.size ?? 0;
  // console.log("ErfsScreen --erfCountForActiveWard", erfCountForActiveWard);

  // if (idle) {
  //   return <ActivityIndicator />;
  // }

  // 3️⃣ OTHERWISE SHOW ERFS
  return (
    <View style={styles.container}>
      <View>
        {/* <HandleNuclearReset /> */}
        {/* <StealthAuditor /> */}
      </View>
      <View>{/* <MyComponent /> */}</View>

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
              updateGeo({ selectedErf: item, lastSelectionType: "ERF" });
              router.push(`/erfs/${item?.id}`);
            }}
          />
        )}
        ListEmptyComponent={
          <NoErfsState
            lmName={lmName}
            wardName="NO WARDS LOADED"
            onRetry={() =>
              updateGeo(
                { flightSignal: geoState.flightSignal + 1 },
                { silent: true },
              )
            }
          />
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

// import { useIsFocused } from "@react-navigation/native";
// import { FlashList } from "@shopify/flash-list";
// import { useRouter } from "expo-router";
// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// // 🏛️ SOVEREIGN CONTEXTS ONLY
// import { useGeo } from "../../context/GeoContext";
// import { useWarehouse } from "../../context/WarehouseContext";
// import ErfFilterHeader from "./erfFilterHeader";
// import { ErfReport } from "./ErfReport";
// import ErfsBottomSearch from "./ErfsBottomSearch";

// import { useSelector } from "react-redux";
// import HydrationActivityIndicator from "../../../components/HydrationActivityIndicator";
// import { useGetWardsByLocalMunicipalityQuery } from "../../redux/geoApi";
// import { ErfItem } from "./erfItem";

// const MyComponent = () => {
//   // 🏛️ SOVEREIGN SELECTION: Only listen to the specific Erf Cache
//   // This prevents the "Root State" warning and stops 90% of unnecessary rerenders.
//   const erfCache = useSelector((state) => state.erfsApi?.queries);
//   const authCache = useSelector((state) => state.authApi?.queries);

//   if (__DEV__) {
//     console.log("Targeted Erf Cache:", erfCache);
//     // console.log(`erfCache:`, JSON.stringify(erfCache, null, 2));

//     console.log("Targeted Auth Cache:", authCache);
//   }
// };

// function NoErfsState({ lmName, wardName, onRetry }) {
//   return (
//     <View
//       style={{
//         flex: 1,
//         alignItems: "center",
//         justifyContent: "center",
//         padding: 22,
//       }}
//     >
//       <Text
//         style={{
//           fontSize: 14,
//           fontWeight: "900",
//           color: "#0F172A",
//           letterSpacing: 1,
//         }}
//       >
//         NO ERFs FOUND
//       </Text>

//       <Text
//         style={{
//           marginTop: 10,
//           fontSize: 12,
//           color: "#64748B",
//           textAlign: "center",
//         }}
//       >
//         There are currently no ERFs loaded for:
//       </Text>

//       <Text
//         style={{
//           marginTop: 6,
//           fontSize: 12,
//           fontWeight: "800",
//           color: "#334155",
//           textAlign: "center",
//         }}
//       >
//         {lmName} • {wardName}
//       </Text>

//       <Text
//         style={{
//           marginTop: 12,
//           fontSize: 11,
//           color: "#94A3B8",
//           textAlign: "center",
//         }}
//       >
//         If this is unexpected, check your ward selection or data pipeline.
//       </Text>

//       {!!onRetry && (
//         <Text
//           onPress={onRetry}
//           style={{
//             marginTop: 18,
//             fontSize: 11,
//             fontWeight: "900",
//             color: "#00BFFF",
//           }}
//         >
//           TAP TO RETRY
//         </Text>
//       )}
//     </View>
//   );
// }

// export default function ErfsScreen() {
//   const isFocused = useIsFocused();
//   const lastScrolledIdRef = useRef(null);
//   const flatListRef = useRef(null);
//   const router = useRouter();

//   console.log(` `);
//   const { geoState, updateGeo } = useGeo();
//   // console.log(
//   //   "ErfsScreen --geoState?.selectedWard?.name",
//   //   geoState?.selectedWard?.name,
//   // );

//   const { all, filtered, sync, loading } = useWarehouse();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [reportVisible, setReportVisible] = useState(false);

//   const loadedCount = all?.erfs?.length ?? 0;
//   const totalCount = wardErfsSync?.size ?? null; // this becomes known after first snapshot

//   // 0. SYNC
//   const wardErfsSync = sync?.erfs ?? { status: "idle" };

//   const hasLm = !!geoState?.selectedLm?.id;
//   // console.log("ErfsScreen -- all?.erfs?.length", all?.erfs?.length);
//   // console.log("ErfsScreen -- wardErfsSync.status", wardErfsSync.status);

//   /*************************************
//    *    * HYDRATION
//    *************************************/

//   const hasWard = !!geoState?.selectedWard?.id;
//   // console.log(`ErfsScreen --hasWard`, hasWard);
//   // console.log(`ErfsScreen --hasLm`, hasLm);

//   const expectedPackKey =
//     hasLm && hasWard
//       ? `${geoState.selectedLm.id}__${geoState.selectedWard.id}`
//       : null;

//   const packKeyMatches =
//     expectedPackKey && wardErfsSync?.wardCacheKey === expectedPackKey;
//   // console.log(`ErfsScreen --packKeyMatches`, packKeyMatches);
//   // console.log(`ErfsScreen --wardErfsSync?.status`, wardErfsSync?.status);

//   // ✅ show spinner if:
//   // - we have LM+Ward
//   // - and pack not ready OR pack key is still old
//   const showHydrationSpinner =
//     hasLm &&
//     hasWard &&
//     (!packKeyMatches ||
//       wardErfsSync?.status === "idle" ||
//       wardErfsSync?.status === "syncing");
//   // console.log(`ErfsScreen --showHydrationSpinner`, showHydrationSpinner);

//   /*************************************
//    *    NO ERFS STATE
//    *************************************/
//   const lmName = geoState?.selectedLm?.name ?? "LOCAL MUNICIPALITY";
//   const lmPcode = geoState?.selectedLm?.id ?? null; // ✅ FIX: id not name
//   const wardName = geoState?.selectedWard?.name ?? "WARD";

//   console.log("ErfsScreen --lmPcode", lmPcode);

//   const { data: existingWards = [] } = useGetWardsByLocalMunicipalityQuery(
//     lmPcode,
//     { skip: !lmPcode },
//   );

//   const wardsExist = existingWards.length > 0;

//   // pack is considered ready only if it matches current wardCacheKey and status is ready
//   // const isPackReady = !!packKeyMatches && wardErfsSync?.status === "ready";

//   // empty state only when pack is ready and we truly have 0 items
//   // empty state only when THIS pack is ready + confirmed empty
//   // const showNoErfsState =
//   //   hasLm && hasWard && isPackReady && (wardErfsSync?.size ?? null) === 0;

//   /*************************************
//    *    * SYNCING
//    *************************************/

//   const showSyncingBanner =
//     hasLm && (all?.erfs?.length ?? 0) > 0 && wardErfsSync.status === "syncing";

//   /*************************************
//    *    * ERFS FILTERING
//    *************************************/

//   // 1. 🎯 THE DATA POOL: Memoized for stability
//   const filteredErfs = useMemo(() => {
//     let sectorPool = [...(filtered?.erfs || [])];

//     if (searchQuery) {
//       const q = searchQuery.toLowerCase();
//       sectorPool = sectorPool.filter(
//         (e) =>
//           e?.erfNo?.toLowerCase().includes(q) ||
//           e.id?.toLowerCase().includes(q),
//       );
//     }
//     return sectorPool;
//   }, [searchQuery, filtered?.erfs]);

//   /*************************************
//    *    ERFiTEM SCROLLING
//    *************************************/

//   const scrollToTarget = useCallback(() => {
//     const targetId = geoState?.selectedErf?.id;

//     // 🛡️ Safety check: No target or no list? Stand down.
//     if (!targetId || !flatListRef.current || filteredErfs.length === 0) return;

//     const index = filteredErfs.findIndex((e) => e.id === targetId);

//     if (index !== -1) {
//       console.log(
//         `🚀 [SCROLL SENTINEL]: Index ${index} located. Executing jump.`,
//       );

//       // 🎯 We use requestAnimationFrame to ensure the A06
//       // has finished its "Render Cycle" before we move the list.
//       requestAnimationFrame(() => {
//         flatListRef.current?.scrollToIndex({
//           index,
//           animated: true,
//           viewPosition: 0, // 📍 Keeps it comfortably visible below the header
//         });
//         lastScrolledIdRef.current = targetId; // Mark mission success
//       });
//     }
//   }, [geoState?.selectedErf?.id, filteredErfs]);

//   // 🛰️ AUTO-JUMP: When user selects from Map and lands here
//   useEffect(() => {
//     if (isFocused && geoState?.selectedErf?.id) {
//       // Give the screen 300ms to "settle" before the first jump
//       const timer = setTimeout(scrollToTarget, 300);
//       return () => clearTimeout(timer);
//     }
//   }, [isFocused, geoState?.selectedErf?.id, scrollToTarget]);

//   if (showHydrationSpinner) {
//     const lmName = geoState?.selectedLm?.name ?? "LOCAL MUNICIPALITY";
//     const wardName = geoState?.selectedWard?.name ?? "WARD";

//     return (
//       <HydrationActivityIndicator
//         status={wardErfsSync?.status}
//         // loadedCount={all?.erfs?.length || 0}
//         // totalCount={wardErfsSync?.size || null} // only set if you actually know it
//         title="HYDRATING SOVEREIGN VAULT..."
//         subtitle={`LOADING ${lmName} • ${wardName}`}
//         showOnceHint
//         errorText={wardErfsSync?.lastError || null}
//         loadedCount={loadedCount}
//         totalCount={totalCount}
//       />
//     );
//   }

//   if (hasLm && wardsExist) {
//     return (
//       <View style={styles.container}>
//         {/* Testing & Diagnostics */}
//         <View>
//           {/* <HandleNuclearReset /> */}
//           {/* <StealthAuditor /> */}
//         </View>
//         <View>{/* <MyComponent /> */}</View>

//         {showSyncingBanner && (
//           <View style={styles.syncingBanner}>
//             <ActivityIndicator size="small" />
//             <Text style={styles.syncingText}>SYNCING LATEST UPDATES...</Text>
//           </View>
//         )}

//         <ErfFilterHeader
//           selectedWard={geoState.selectedWard}
//           setSelectedWard={(w) =>
//             updateGeo({ selectedWard: w, lastSelectionType: "WARD" })
//           }
//           availableWards={all?.wards}
//           filteredCount={filteredErfs.length}
//           totalCount={all?.erfs?.length || 0}
//           selectedErf={geoState.selectedErf}
//           onScrollToSelected={scrollToTarget}
//         />

//         <FlashList
//           ref={flatListRef}
//           data={filteredErfs}
//           keyExtractor={(item) => item?.id}
//           extraData={geoState?.selectedErf?.id} // 🎯 Crucial for highlighting
//           estimatedItemSize={106}
//           onScrollToIndexFailed={(info) => {
//             // A06 Fallback: Sometimes the item isn't rendered yet
//             flatListRef.current?.scrollToOffset({
//               offset: info.averageItemLength * info.index,
//               animated: false,
//             });
//             setTimeout(() => scrollToTarget(), 100);
//           }}
//           renderItem={({ item }) => (
//             <ErfItem
//               item={item}
//               isActive={item?.id === geoState?.selectedErf?.id}
//               onSelect={() => {
//                 const isSame = geoState?.selectedErf?.id === item.id;
//                 updateGeo({
//                   selectedErf: isSame ? null : item,
//                   lastSelectionType: isSame ? null : "ERF",
//                 });
//               }}
//               onMapPress={() => {
//                 updateGeo({ selectedErf: item, lastSelectionType: "ERF" });
//                 router.push("/(tabs)/maps");
//               }}
//               onErfDetailPress={(item) => {
//                 updateGeo({ selectedErf: item, lastSelectionType: "ERF" });
//                 router.push(`/erfs/${item?.id}`);
//               }}
//             />
//           )}
//           // ListEmptyComponent={
//           //   <NoErfsState
//           //     lmName={lmName}
//           //     wardName={wardName}
//           //     onRetry={() =>
//           //       updateGeo(
//           //         { flightSignal: geoState.flightSignal + 1 },
//           //         { silent: true },
//           //       )
//           //     }
//           //   />
//           // }
//         />

//         <ErfsBottomSearch
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           count={filteredErfs.length}
//         />

//         <ErfReport
//           visible={reportVisible}
//           onClose={() => setReportVisible(false)}
//           erf={geoState.selectedErf}
//         />
//       </View>
//     );
//   }

//   return (
//     <NoErfsState
//       lmName={lmName}
//       wardName={wardName}
//       onRetry={() =>
//         updateGeo({ flightSignal: geoState.flightSignal + 1 }, { silent: true })
//       }
//     />
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f8f9fa" },
//   itemWrapper: {
//     marginHorizontal: 12,
//     marginTop: 10,
//     borderRadius: 12,
//     backgroundColor: "white",
//     elevation: 3,
//   },
//   activeItemWrapper: {
//     borderColor: "#00BFFF",
//     borderWidth: 2,
//     backgroundColor: "#f0faff",
//   },
//   itemContainer: { flexDirection: "row", alignItems: "center", padding: 12 },
//   infoSection: { flex: 1.5 },
//   actionSection: { flex: 0.5, alignItems: "center" },
//   iconCircle: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#f0faff",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   activeIconCircle: { backgroundColor: "#e8f5e9" },
//   parcelText: { fontSize: 18, fontWeight: "800", color: "#2c3e50" },
//   activeText: { color: "#00BFFF" },
//   idText: { fontSize: 11, color: "#95a5a6", fontFamily: "monospace" },
//   wardText: { fontSize: 12, color: "#7f8c8d", marginTop: 4 },
//   row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
//   mapLinkText: { fontSize: 10, fontWeight: "bold", color: "#00BFFF" },
//   syncingBanner: {
//     backgroundColor: "#e3f2fd",
//     paddingVertical: 4,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   syncingText: { fontSize: 10, color: "#1976d2", fontWeight: "bold" },
//   summaryStats: { alignItems: "center", marginTop: 4 },
//   serviceDots: { flexDirection: "row", gap: 4, marginTop: 2 },
//   dot: { width: 6, height: 6, borderRadius: 3 },
//   statText: { fontSize: 10, fontWeight: "bold", color: "#666" },

//   premiseSection: {
//     flex: 0.5,
//     alignItems: "center",
//     justifyContent: "center",
//     borderLeftWidth: 1,
//     borderRightWidth: 1,
//     borderColor: "#eee",
//     paddingVertical: 4,
//   },
//   dashboardRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-around",
//     width: "100%",
//     marginVertical: 1,
//   },
//   dashboardCol: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   serviceItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 2,
//   },
//   bigCountText: {
//     fontSize: 16,
//     fontWeight: "900",
//     color: "#2c3e50",
//   },
//   serviceCount: {
//     fontSize: 11,
//     fontWeight: "600",
//     color: "#546e7a",
//   },

//   timeRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 4,
//     gap: 3,
//   },
//   timeText: {
//     fontSize: 9,
//     color: "#94a3b8",
//     fontWeight: "600",
//     textTransform: "uppercase",
//   },
// });
