import { Stack } from "expo-router";
import { useMemo } from "react";
import SovereignHeader from "../../../components/SovereignHeader";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import { useTrnFilter } from "../../../src/hooks/useTrnFilter";

export default function TrnsLayout() {
  const { all, sync } = useWarehouse();

  const trns = useMemo(() => all?.trns || [], [all?.trns]);
  // console.log(`trns`, trns);
  // console.log("all.trns", all?.trns);
  // console.log("sync.trns", sync?.trns);
  // console.log(
  //   "all.trns ids",
  //   (all?.trns || []).map((x) => x.id),
  // );

  const {
    showFilters,
    setShowFilters,
    showStats,
    setShowStats,
    showSearch,
    setShowSearch,
    filterState,
    resetFilters,
  } = useTrnFilter();

  const filteredTrns = useMemo(() => {
    let list = trns;

    if (filterState?.status) {
      list = list.filter((t) => t.status === filterState.status);
    }

    if (filterState?.searchQuery) {
      const q = String(filterState.searchQuery).trim().toLowerCase();

      if (q) {
        list = list.filter((t) => {
          const meterNo = String(t?.ast?.astData?.astNo || "").toLowerCase();
          const address = String(
            t?.accessData?.premise?.address || "",
          ).toLowerCase();
          const erfNo = String(t?.accessData?.erfNo || "").toLowerCase();

          return (
            meterNo.includes(q) || address.includes(q) || erfNo.includes(q)
          );
        });
      }
    }

    return list;
  }, [trns, filterState]);

  const isFiltering =
    filterState?.status !== null ||
    !!String(filterState?.searchQuery || "").trim();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => (
            <SovereignHeader
              title="TRNS"
              totalCount={trns.length}
              filteredCount={filteredTrns.length}
              isFiltering={isFiltering}
              filterCount={filterState?.status ? 1 : 0}
              showSearch={showSearch}
              onSearchPress={() => setShowSearch(true)}
              onFilterPress={() => setShowFilters(true)}
              onStatsPress={() => setShowStats(true)}
              onQuickReset={() => resetFilters()}
            />
          ),
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          presentation: "transparentModal",
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}

// import { Stack } from "expo-router";
// import { useMemo } from "react";
// import SovereignHeader from "../../../components/SovereignHeader";
// import { useGeo } from "../../../src/context/GeoContext";
// import { useTrnFilter } from "../../../src/hooks/useTrnFilter"; // 🎯 Ensure you have this hook
// import { useGetTrnsByLmPcodeQuery } from "../../../src/redux/trnsApi";

// export default function TrnsLayout() {
//   const { geoState } = useGeo();
//   const lmPcode = geoState?.selectedLm?.id;

//   // 🏛️ TACTICAL DATA HOOK
//   const { data: trns } = useGetTrnsByLmPcodeQuery(
//     { lmPcode },
//     { skip: !lmPcode },
//   );

//   // 🎯 FILTER HOOK (Standardized)
//   const {
//     showFilters,
//     setShowFilters,
//     showStats,
//     setShowStats,
//     showSearch,
//     setShowSearch,
//     filterState,
//     resetFilters,
//   } = useTrnFilter();

//   // 📊 CALCULATION OF RATIOS
//   const filteredTrns = useMemo(() => {
//     let list = trns || [];
//     if (filterState?.status) {
//       list = list.filter((t) => t.status === filterState.status);
//     }
//     return list;
//   }, [trns, filterState]);

//   const isFiltering =
//     filterState?.status !== null || filterState?.searchQuery !== "";

//   return (
//     <Stack>
//       <Stack.Screen
//         name="index"
//         options={{
//           header: () => (
//             <SovereignHeader
//               title="TRNS"
//               totalCount={trns?.length || 0}
//               filteredCount={filteredTrns?.length || 0}
//               isFiltering={isFiltering}
//               filterCount={filterState?.status ? 1 : 0}
//               showSearch={showSearch}
//               onSearchPress={() => setShowSearch(true)}
//               onFilterPress={() => setShowFilters(true)}
//               onStatsPress={() => setShowStats(true)}
//               onQuickReset={() => resetFilters()}
//             />
//           ),
//         }}
//       />

//       {/* 🛡️ THE DISMISSIBLE REPORT MODAL */}
//       <Stack.Screen
//         name="[id]"
//         options={{
//           presentation: "transparentModal",
//           headerShown: false,
//           animation: "fade",
//         }}
//       />
//     </Stack>
//   );
// }
