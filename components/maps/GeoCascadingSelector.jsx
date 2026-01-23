// components/maps/GeoCascadingSelector.js
import { FlashList } from "@shopify/flash-list";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  TextInput,
} from "react-native-paper";
import { useGeo } from "../../src/context/GeoContext";
import {
  useGetLocalMunicipalityByIdQuery,
  useGetWardsByLocalMunicipalityQuery,
} from "../../src/redux/geoApi";
import { erfMemory } from "../../src/storage/erfMemory";
import { geoMemory } from "../../src/storage/geoMemory";

export default function GeoCascadingSelector({ onRefreshCamera = () => {} }) {
  const [wardDialogOpen, setWardDialogOpen] = useState(false);
  const [erfDialogOpen, setErfDialogOpen] = useState(false);
  const [erfSearch, setErfSearch] = useState("");

  const activeStyle = { color: "#2563eb", fontWeight: "bold" };

  // 🏛️ ACCESS SUPREME SOURCE OF TRUTH
  const { geoState, updateGeo } = useGeo();
  const { lmId, wardId, id } = geoState;

  // 1. 🛰️ API FETCH: Official LM Data (Knysna)
  const { data: activeWorkbase } = useGetLocalMunicipalityByIdQuery(lmId, {
    skip: !lmId,
  });

  // 2. 🛰️ API FETCH: Ward List (Background Sync)
  const { data: apiWards = [], isLoading: wardsLoading } =
    useGetWardsByLocalMunicipalityQuery(lmId, {
      skip: !lmId,
    });

  // 3. 📦 WAREHOUSE: Get all Erfs from MMKV (Meta Only)
  const erfs = useMemo(() => {
    return lmId ? erfMemory.getErfsMetaList(lmId) : [];
  }, [lmId]);

  // 4. 📦 WAREHOUSE FETCH: The Instant Ward Source
  const wards = useMemo(() => {
    const storedWards = geoMemory.getWards(lmId);
    // Favor API data if available, otherwise fall back to MMKV warehouse
    return apiWards.length > 0 ? apiWards : storedWards || [];
  }, [apiWards, lmId]);

  // 💾 AUTOMATIC SYNC: Save API results to MMKV whenever they arrive
  useEffect(() => {
    if (apiWards.length > 0 && lmId) {
      console.log(
        `💾 geoMemory: Warehousing ${apiWards.length} wards for ${lmId}`,
      );
      geoMemory.saveWards(lmId, apiWards);
    }
  }, [apiWards, lmId]);

  // 🔍 RESOLVE: Get selected objects for UI display
  const selectedWard = useMemo(() => {
    return wards.find((w) => w.id === wardId) || null;
  }, [wards, wardId]);

  const selectedErf = useMemo(() => {
    return erfs.find((e) => e.id === id) || null;
  }, [erfs, id]);

  // 5. 🔍 FILTER: Handle Erf List by Ward + Search String
  const filteredErfs = useMemo(() => {
    if (!wardId) return [];
    let list = erfs.filter((e) => e.wardPcode === wardId);

    if (erfSearch.trim()) {
      const q = erfSearch.toLowerCase();
      list = list.filter(
        (e) =>
          (e.erfNo?.toString() || "").toLowerCase().includes(q) ||
          (e.id || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [erfs, wardId, erfSearch]);

  // 🎯 REPORTING: Update GeoContext for Ward changes
  const handleWardSelect = (ward) => {
    updateGeo({
      selectedWard: ward,
      id: null,
      selectedErf: null,
    });
    setWardDialogOpen(false);
    onRefreshCamera();
  };

  // 🎯 REPORTING: Update GeoContext for Erf changes
  const handleErfSelect = (erf) => {
    updateGeo({
      id: erf.id,
      selectedErf: erf,
    });
    setErfDialogOpen(false);
    onRefreshCamera();
  };

  return (
    <View style={{ padding: 12, backgroundColor: "rgba(255,255,255,0.95)" }}>
      {/* 🏛️ 1. MUNICIPALITY */}
      <List.Item
        title={activeWorkbase?.name || "Local Municipality"}
        titleStyle={activeStyle}
        description="Active Workbase"
        left={(p) => (
          <List.Icon {...p} icon="office-building" color="#2563eb" />
        )}
        onPress={() => {
          updateGeo({ sekectedWard: null, id: null, selectedErf: null });
          onRefreshCamera();
        }}
      />

      {/* 🏛️ 2. WARD SELECTION */}
      <View>
        <List.Item
          title={
            selectedWard
              ? `Ward ${selectedWard.code || selectedWard.number}`
              : "Select Ward"
          }
          titleStyle={selectedWard ? activeStyle : {}}
          description={
            wardsLoading && wards.length === 0
              ? "Loading..."
              : `${wards.length} wards available`
          }
          onPress={() => setWardDialogOpen(true)}
          left={(p) => (
            <List.Icon
              {...p}
              icon="map-marker-radius"
              color={selectedWard ? "#2563eb" : p.color}
            />
          )}
          right={(p) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {selectedWard && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconButton
                    icon="target"
                    iconColor="#2563eb"
                    size={20}
                    onPress={() => onRefreshCamera()}
                  />
                  <IconButton
                    icon="close-circle-outline"
                    iconColor="#dc2626"
                    size={24}
                    onPress={() => {
                      updateGeo({
                        selectedWard: null,
                        id: null,
                        selectedErf: null,
                      });
                      onRefreshCamera();
                    }}
                  />
                </View>
              )}
              {wardsLoading && wards.length === 0 ? (
                <ActivityIndicator size="small" />
              ) : (
                <List.Icon {...p} icon="chevron-down" />
              )}
            </View>
          )}
        />
      </View>

      {/* 🏛️ 3. ERF SELECTION */}
      <View>
        <List.Item
          title={selectedErf ? `ERF ${selectedErf.erfNo}` : "Select ERF"}
          titleStyle={selectedErf ? activeStyle : {}}
          disabled={!wardId}
          description={
            !wardId ? "Select ward first" : `${filteredErfs.length} ERFs found`
          }
          onPress={() => filteredErfs.length && setErfDialogOpen(true)}
          left={(p) => (
            <List.Icon
              {...p}
              icon="home-map-marker"
              color={selectedErf ? "#2563eb" : p.color}
            />
          )}
          right={(p) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {selectedErf && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconButton
                    icon="target"
                    iconColor="#2563eb"
                    size={20}
                    onPress={() => onRefreshCamera()}
                  />
                  <IconButton
                    icon="close-circle-outline"
                    iconColor="#dc2626"
                    size={24}
                    onPress={() => {
                      updateGeo({ id: null, selectedErf: null });
                      onRefreshCamera();
                    }}
                  />
                </View>
              )}
              <List.Icon {...p} icon="chevron-down" />
            </View>
          )}
        />
      </View>

      <Portal>
        <Dialog
          visible={wardDialogOpen}
          onDismiss={() => setWardDialogOpen(false)}
        >
          <Dialog.Title>Select Ward</Dialog.Title>
          <Dialog.Content style={{ height: 400 }}>
            <FlashList
              data={wards}
              keyExtractor={(i) => i.id}
              estimatedItemSize={50}
              renderItem={({ item }) => (
                <List.Item
                  title={`Ward ${item.code || item.number}`}
                  onPress={() => handleWardSelect(item)}
                />
              )}
            />
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={erfDialogOpen}
          onDismiss={() => setErfDialogOpen(false)}
        >
          <Dialog.Title>Select ERF</Dialog.Title>
          <Dialog.Content style={{ height: 400 }}>
            <TextInput
              mode="outlined"
              placeholder="Search ERF Number..."
              value={erfSearch}
              onChangeText={setErfSearch}
              style={{ marginBottom: 10 }}
            />
            <FlashList
              data={filteredErfs}
              keyExtractor={(i) => i.id}
              estimatedItemSize={60}
              renderItem={({ item }) => (
                <List.Item
                  title={`ERF ${item.erfNo}`}
                  description={`ID: ${item.id}`}
                  onPress={() => handleErfSelect(item)}
                />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setErfDialogOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
