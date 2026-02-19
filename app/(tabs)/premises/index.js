import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Modal,
  Portal,
  Surface,
} from "react-native-paper";

import { useGeo } from "../../../src/context/GeoContext";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import PremiseCard from "../../../src/features/premises/PremiseCard";

// 🎯 THE FIX: Direct import from the dedicated Context file
import { usePremiseFilter } from "../../../src/context/PremiseFilterContext";

export default function PremisesScreen() {
  const router = useRouter();
  const { all, loading } = useWarehouse();
  const { updateGeo } = useGeo();

  // 📝 LOCAL UI STATE
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPremise, setSelectedPremise] = useState(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [meterType, setMeterType] = useState("");

  // 🛡️ SOVEREIGN FILTER STATE (Decoupled)
  const { filterState, setFilterState, showSearch, setShowSearch } =
    usePremiseFilter();

  // 🏛️ FILTER LOGIC: Memoized for A06 Performance
  const displayPremises = useMemo(() => {
    let list = [...(all?.prems || [])];

    // Gate 1: Property Type
    if (filterState?.propertyTypes?.length > 0) {
      list = list.filter((p) =>
        filterState.propertyTypes.includes(p?.propertyType?.type),
      );
    }

    // Gate 2: Territorial Ward
    if (filterState?.wards?.length > 0) {
      list = list.filter((p) => {
        const erfData = (all?.erfs || []).find((erf) => erf.id === p?.erfId);
        const wardName = erfData?.admin?.ward?.name || "Unknown Ward";
        return filterState.wards.includes(wardName);
      });
    }

    // Gate 3: Search Query
    if (filterState?.searchQuery) {
      const query = filterState.searchQuery.toLowerCase();
      list = list.filter((p) => {
        const strName = p?.address?.strName?.toLowerCase() || "";
        const strNo = p?.address?.strNo || "";
        const erfNo = p?.erfNo || "";
        return (
          strName.includes(query) ||
          strNo.includes(query) ||
          erfNo.includes(query)
        );
      });
    }

    return list.sort((a, b) => {
      const timeA = new Date(a?.metadata?.updated?.at || 0).getTime();
      const timeB = new Date(b?.metadata?.updated?.at || 0).getTime();
      return timeB - timeA;
    });
  }, [
    all?.prems,
    all?.erfs,
    filterState.propertyTypes,
    filterState.wards,
    filterState.searchQuery,
  ]);

  // 🛰️ HANDLERS (The Navigation Arsenal)
  const handleConfirmMission = () => {
    if (!selectedPremise) return;
    setIsModalVisible(false);
    router.push({
      pathname: "/(tabs)/premises/form",
      params: {
        premiseId: selectedPremise?.id,
        address:
          `${selectedPremise?.address?.strNo || ""} ${selectedPremise?.address?.strName || ""} ${selectedPremise?.address?.strType || ""}`.trim(),
        erfNo: selectedPremise?.erfNo,
        action: JSON.stringify({
          access: hasAccess ? "yes" : "no",
          meterType: meterType,
        }),
      },
    });
  };

  const handleMapPress = useCallback(
    (p) => {
      const parentErf = all?.erfs?.find((e) => e.id === p?.erfId);
      updateGeo({
        selectedErf: parentErf || null,
        lastSelectionType: "ERF",
      });
      updateGeo({
        selectedPremise: p,
        lastSelectionType: "PREMISE",
      });
      router.replace("/(tabs)/maps");
    },
    [all?.erfs, router, updateGeo],
  );

  const handleDetailPress = useCallback(
    (p) => {
      router.push({
        pathname: "/erfs/form",
        params: { id: p?.erfId, premiseId: p?.id },
      });
    },
    [router],
  );

  const handleDiscover = useCallback(
    (p) => {
      const parentErf = all?.erfs?.find((e) => e.id === p.erfId);
      updateGeo({
        selectedPremise: p,
        selectedErf: parentErf || { id: p?.erfId, erfNo: p?.erfNo },
        lastSelectionType: "PREMISE",
      });
      setSelectedPremise(p);
      setIsModalVisible(true);
    },
    [all?.erfs, updateGeo],
  );

  const handleNaPress = useCallback(
    (p) => {
      router.push({
        pathname: "/premises/NaScreen",
        params: { premiseId: p?.id },
      });
    },
    [router],
  );

  const handleDuplicate = useCallback(
    (p) => {
      router.push({
        pathname: "/erfs/form",
        params: { id: p?.erfId, duplicateId: p?.id },
      });
    },
    [router],
  );

  // 📋 RENDER ITEM
  const renderPremiseItem = useCallback(
    ({ item }) => {
      const parentErf = all?.erfs?.find((e) => e.id === item?.erfId);
      const wardName = parentErf?.admin?.ward?.name || "W?";
      const wardNo = wardName.replace(/\D/g, "");

      return (
        <PremiseCard
          item={item}
          wardNo={wardNo}
          onMapPress={handleMapPress}
          onDiscover={handleDiscover}
          onDetailPress={handleDetailPress}
          onNaPress={handleNaPress}
          onDuplicate={handleDuplicate}
        />
      );
    },
    [
      all?.erfs,
      handleDetailPress,
      handleMapPress,
      handleDiscover,
      handleNaPress,
      handleDuplicate,
    ],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={displayPremises}
        keyExtractor={(item) => item?.id}
        estimatedItemSize={180}
        contentContainerStyle={{ padding: 12 }}
        renderItem={renderPremiseItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="office-building-marker-outline"
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.emptyText}>No premises found.</Text>
          </View>
        }
      />

      {/* 🏛️ DISCOVERY MODAL */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Mission Discovery
          </Text>
          <Surface style={styles.modalCard} elevation={1}>
            <Text variant="labelLarge">Access Status</Text>
            <View style={styles.toggleRow}>
              <Button
                mode={hasAccess ? "contained" : "outlined"}
                onPress={() => setHasAccess(true)}
                style={{ flex: 1, marginRight: 4 }}
              >
                ACCESS
              </Button>
              <Button
                mode={!hasAccess ? "contained" : "outlined"}
                onPress={() => setHasAccess(false)}
                style={{ flex: 1 }}
                buttonColor={!hasAccess ? "#B22222" : null}
              >
                NO ACCESS
              </Button>
            </View>
          </Surface>

          {hasAccess && (
            <Surface style={styles.modalCard} elevation={1}>
              <Text variant="labelLarge">Resource Type</Text>
              <View style={styles.toggleRow}>
                <Button
                  mode={meterType === "water" ? "contained" : "outlined"}
                  onPress={() => setMeterType("water")}
                  style={{ flex: 1, marginRight: 4 }}
                >
                  WATER
                </Button>
                <Button
                  mode={meterType === "electricity" ? "contained" : "outlined"}
                  onPress={() => setMeterType("electricity")}
                  style={{ flex: 1 }}
                >
                  ELEC
                </Button>
              </View>
            </Surface>
          )}

          <Button
            mode="contained"
            onPress={handleConfirmMission}
            style={styles.confirmButton}
          >
            START DISCOVERY
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#94A3B8", marginTop: 12, fontWeight: "600" },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: { textAlign: "center", fontWeight: "bold", marginBottom: 20 },
  modalCard: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  confirmButton: {
    marginTop: 10,
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
  },
});
