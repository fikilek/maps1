import { Stack } from "expo-router";
import { useMemo } from "react";
import SovereignHeader from "../../../components/SovereignHeader";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import { useAstFilter } from "../../../src/hooks/useAstFilter";

export default function AstsLayout() {
  const { all } = useWarehouse();

  const {
    showFilters,
    setShowFilters,
    showStats,
    setShowStats,
    showSearch,
    setShowSearch,
    filterState,
    resetFilters,
  } = useAstFilter();

  const filteredMeters = useMemo(() => {
    let list = all?.meters || [];

    if (filterState.mosiGroup) {
      list = list.filter((a) => a.mosiGroup === filterState.mosiGroup);
    }

    if (filterState.status) {
      list = list.filter((a) => a.status === filterState.status);
    }

    return list;
  }, [all?.meters, filterState]);

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
              totalCount={all?.meters?.length || 0}
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

      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />

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
          presentation: "modal",
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
