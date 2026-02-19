import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Badge } from "react-native-paper";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import { usePremiseFilter } from "../../context/PremiseFilterContext";

export const PremiseHeader = ({
  onStatsPress,
  onFilterPress,
  onSearchPress,
}) => {
  const { all } = useWarehouse();
  // const { filterState, setFilterState, showSearch } =
  //   useContext(PremiseFilterContext);

  const { filterState, setFilterState, showSearch, setShowSearch } =
    usePremiseFilter(); // 🚀 CLEANER

  const totalCount = all?.prems?.length || 0;

  const filteredCount = useMemo(() => {
    let list = all?.prems || [];
    if (filterState?.propertyTypes?.length > 0) {
      list = list.filter((p) =>
        filterState.propertyTypes.includes(p?.propertyType?.type),
      );
    }
    return list.length;
  }, [all?.prems, filterState.propertyTypes]);

  const isFiltering = filterState?.propertyTypes?.length > 0;

  const handleQuickReset = () => {
    // 🎯 Clear the whole tactical board
    setFilterState({
      propertyTypes: [],
      wards: [],
      searchQuery: "",
    });
  };

  // const handleQuickReset = () => {
  //   setFilterState({ propertyTypes: [] });
  // };

  return (
    <View style={styles.headerContainer}>
      {/* 🏛️ LEFT: TACTICAL RATIO & SEARCH POD */}
      <View style={styles.leftSection}>
        <View style={styles.statPod}>
          <Text style={styles.statLabel}>TOTAL</Text>
          <Text style={styles.statValue}>{totalCount}</Text>
        </View>

        <View style={styles.podDivider} />

        <View style={styles.statPod}>
          <Text style={[styles.statLabel, isFiltering && styles.activeText]}>
            FILTERED
          </Text>
          <Text style={[styles.statValue, isFiltering && styles.activeText]}>
            {filteredCount}
          </Text>
        </View>

        {/* 🔍 SEARCH POD: Shows Label + Icon, Hides when Search is Active */}
        {!showSearch && (
          <>
            <View style={styles.podDivider} />
            <TouchableOpacity style={styles.searchPod} onPress={onSearchPress}>
              <Text style={styles.statLabel}>ERF/STRNAME</Text>
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color="#2563eb"
                style={{ marginTop: -2 }}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 🏛️ RIGHT: TOOLS */}
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.statsBtn} onPress={onStatsPress}>
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={24}
            color="#64748b"
          />
        </TouchableOpacity>

        <View style={[styles.filterPod, isFiltering && styles.filterPodActive]}>
          {isFiltering && (
            <TouchableOpacity
              style={styles.podActionBtn}
              onPress={handleQuickReset}
            >
              <MaterialCommunityIcons
                name="filter-off-outline"
                size={20}
                color="#ef4444"
              />
            </TouchableOpacity>
          )}
          {isFiltering && <View style={styles.podDivider} />}
          <TouchableOpacity style={styles.podActionBtn} onPress={onFilterPress}>
            <View>
              <MaterialCommunityIcons
                name={isFiltering ? "filter" : "filter-variant"}
                size={22}
                color={isFiltering ? "#2563eb" : "#1e293b"}
              />
              {isFiltering && (
                <Badge size={14} style={styles.filterBadge}>
                  {filterState.propertyTypes.length}
                </Badge>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statPod: {
    alignItems: "center",
    paddingHorizontal: 6,
  },
  searchPod: {
    alignItems: "center",
    paddingHorizontal: 6,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#334155",
  },
  activeText: {
    color: "#2563eb",
  },
  podDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 2,
  },
  rightSection: { flexDirection: "row", alignItems: "center" },
  statsBtn: { padding: 8, marginRight: 8 },
  filterPod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 2,
  },
  filterPodActive: { borderColor: "#dbeafe", backgroundColor: "#f0f7ff" },
  podActionBtn: { padding: 8 },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#2563eb",
  },
});
