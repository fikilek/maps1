import { Stack } from "expo-router";
import { useMemo } from "react";
import SovereignHeader from "../../../components/SovereignHeader";
import { useGeo } from "../../../src/context/GeoContext";
import { useTrnFilter } from "../../../src/hooks/useTrnFilter"; // 🎯 Ensure you have this hook
import { useGetTrnsByLmPcodeQuery } from "../../../src/redux/trnsApi";

export default function TrnsLayout() {
  const { geoState } = useGeo();
  const lmPcode = geoState?.selectedLm?.id;

  // 🏛️ TACTICAL DATA HOOK
  const { data: trns } = useGetTrnsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  // 🎯 FILTER HOOK (Standardized)
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

  // 📊 CALCULATION OF RATIOS
  const filteredTrns = useMemo(() => {
    let list = trns || [];
    if (filterState?.status) {
      list = list.filter((t) => t.status === filterState.status);
    }
    return list;
  }, [trns, filterState]);

  const isFiltering =
    filterState?.status !== null || filterState?.searchQuery !== "";

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => (
            <SovereignHeader
              title="TRNS"
              totalCount={trns?.length || 0}
              filteredCount={filteredTrns?.length || 0}
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

      {/* 🛡️ THE DISMISSIBLE REPORT MODAL */}
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
