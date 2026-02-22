import { Stack } from "expo-router";
import { useMemo } from "react";
import SovereignHeader from "../../../components/SovereignHeader";
import { useGeo } from "../../../src/context/GeoContext";
import { useAstFilter } from "../../../src/hooks/useAstFilter";
import { useGetAstsByLmPcodeQuery } from "../../../src/redux/astsApi";

export default function AstsLayout() {
  const { geoState } = useGeo();
  const lmPcode = geoState?.selectedLm?.id;

  // 🏛️ TACTICAL DATA HOOK
  // Fetching here ensures the Header has access to the length immediately
  const { data: asts, isLoading } = useGetAstsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  // 🎯 FILTER HOOK
  const {
    showFilters,
    setShowFilters,
    showStats,
    setShowStats,
    showSearch,
    setShowSearch,
    filterState,
    setFilterState,
    resetFilters,
  } = useAstFilter();

  // 📊 CALCULATION OF RATIOS
  // We calculate the filtered count here to pass it to the "Filtered Pod"
  const filteredMeters = useMemo(() => {
    let list = asts || [];
    if (filterState.mosiGroup) {
      // Add your specific G1-R5 filtering logic here
      list = list.filter((a) => a.mosiGroup === filterState.mosiGroup);
    }
    if (filterState.status) {
      list = list.filter((a) => a.status === filterState.status);
    }
    return list;
  }, [asts, filterState]);

  const isFiltering =
    filterState.mosiGroup !== null || filterState.status !== null;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => (
            <SovereignHeader
              title="METERS"
              totalCount={asts?.length || 0}
              filteredCount={filteredMeters?.length || 0}
              isFiltering={isFiltering}
              filterCount={
                (filterState.mosiGroup ? 1 : 0) + (filterState.status ? 1 : 0)
              }
              showSearch={showSearch}
              onSearchPress={() => setShowSearch(true)}
              onFilterPress={() => setShowFilters(true)}
              onStatsPress={() => setShowStats(true)}
              onQuickReset={() => resetFilters()}
            />
          ),
        }}
      />

      {/* 🚀 Asset Lifecycle Report */}
      <Stack.Screen
        name="[id]"
        options={{
          title: "Meter Report",
          headerShown: true, // We use our own custom header in [id].js
        }}
      />

      {/* 📸 Asset Media Gallery/Camera Strike */}
      <Stack.Screen
        name="media"
        options={{
          title: "ASSET EVIDENCE",
          headerStyle: { backgroundColor: "#F8FAFC" },
          headerTitleStyle: {
            fontWeight: "900",
            color: "#0F172A",
            letterSpacing: 1,
          },
          headerShadowVisible: true,
          presentation: "modal", // Gives it a focused "overlay" feel
        }}
      />

      <Stack.Screen
        name="details"
        options={{
          title: "Meter details",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
