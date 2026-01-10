import { useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ErfFilterHeader from "../../../src/features/erfs/erfFilterHeader";
import { useAuth } from "../../../src/hooks/useAuth";
import { useGetErfsByLmPcodeQuery } from "../../../src/redux/erfsApi";

// --- MEMOIZED RENDER ITEM ---
// Fixed the 'missing display name' warning by using a named function
const ErfItem = memo(function ErfItem({ item }) {
  const router = useRouter();
  return (
    <TouchableOpacity activeOpacity={0.7}>
      <View style={styles.itemContainer}>
        <View style={styles.row}>
          <Text style={styles.parcelText}>
            ERF {item.sg?.parcelNo || "N/A"}
          </Text>
          <View style={styles.wardBadge}>
            <Text style={styles.wardBadgeText}>
              W {item.admin?.ward?.pcode?.slice(-2)}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={styles.idText}>{item.erfId}</Text>
            <Text style={styles.subText}>
              LM: {item.admin?.localMunicipality?.name}
            </Text>
          </View>
          <View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={"onPress"}
              onLongPress={() =>
                router.push({
                  pathname: "/maps",
                  params: { erfId: item.erfId },
                })
              }
            >
              <Text>Erf Detail</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ErfsScreen() {
  const [search, setSearch] = useState("");
  const [selectedWard, setSelectedWard] = useState("ALL");

  const { profile, isLoading: authLoading } = useAuth();

  const lmPcode = profile?.access?.activeWorkbase?.id;

  // Inside ErfsScreen.js
  const rawPcode = profile?.access?.activeWorkbase?.id;

  // Using the LM query (getDocs version)
  const {
    data: erfs = [],
    isLoading,
    isError,
  } = useGetErfsByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });

  // --- FILTER LOGIC ---

  // 1. Get unique list of Ward Pcodes for the filter bar
  const availableWards = useMemo(() => {
    if (!erfs.length) return ["ALL"];
    const wardSet = new Set(
      erfs.map((e) => e.admin?.ward?.pcode).filter(Boolean)
    );
    return ["ALL", ...Array.from(wardSet).sort()];
  }, [erfs]);

  // 2. Filter data by both Ward AND Search Term
  const filteredErfs = useMemo(() => {
    return erfs.filter((erf) => {
      const matchesWard =
        selectedWard === "ALL" || erf.admin?.ward?.pcode === selectedWard;
      const matchesSearch =
        !search ||
        erf.sg?.parcelNo
          ?.toString()
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        erf.erfId?.toLowerCase().includes(search.toLowerCase());

      return matchesWard && matchesSearch;
    });
  }, [search, selectedWard, erfs]);

  if (authLoading || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00BFFF" />
        <Text style={styles.loadingText}>Syncing iREPS Inventory...</Text>
      </View>
    );
  }

  if (isError)
    return (
      <View style={styles.center}>
        <Text>Error loading ERFs</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* --- HEADER / FILTER SECTION --- */}

      <ErfFilterHeader
        search={search}
        setSearch={setSearch}
        selectedWard={selectedWard}
        setSelectedWard={setSelectedWard}
        availableWards={availableWards}
        filteredCount={filteredErfs?.length}
        totalCount={erfs?.length}
      />

      {/* --- LIST SECTION --- */}
      <FlatList
        data={filteredErfs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ErfItem item={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        // Performance Props for 2000+ items
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No ERFs match your filters.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#666" },
  header: {
    backgroundColor: "white",
    paddingTop: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  searchInput: {
    backgroundColor: "#f0f2f5",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 15,
    fontSize: 16,
  },
  wardScroll: { marginVertical: 10 },
  wardScrollContent: { paddingHorizontal: 15 },
  wardPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  wardPillActive: { backgroundColor: "#00BFFF", borderColor: "#00BFFF" },
  wardPillText: { fontWeight: "600", color: "#444" },
  wardPillTextActive: { color: "white" },
  counter: {
    fontSize: 12,
    color: "#888",
    paddingHorizontal: 15,
    paddingBottom: 5,
    textAlign: "right",
  },
  itemContainer: {
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  parcelText: { fontSize: 18, fontWeight: "bold", color: "#222" },
  wardBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  wardBadgeText: { color: "#1976d2", fontSize: 12, fontWeight: "bold" },
  idText: { fontSize: 11, color: "#999", marginTop: 2 },
  subText: { fontSize: 13, color: "#666", marginTop: 4 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999" },
});
