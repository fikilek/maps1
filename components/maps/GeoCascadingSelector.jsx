// components/maps/GeoCascadingSelector.js
import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  TextInput,
} from "react-native-paper";

export default function GeoCascadingSelector({
  lm,
  wards,
  erfs,
  wardsLoading,
  erfsLoading,
  selectedWardId,
  selectedErfId,
  onSelectWard,
  onSelectErf,
  onSelectMunicipality,
  onRefreshCamera = () => {},
}) {
  const [wardDialogOpen, setWardDialogOpen] = useState(false);
  const [erfDialogOpen, setErfDialogOpen] = useState(false);
  const [erfSearch, setErfSearch] = useState("");

  const selectedWard = useMemo(
    () => wards.find((w) => w.id === selectedWardId) || null,
    [wards, selectedWardId]
  );

  const selectedErf = useMemo(
    () => erfs.find((e) => e.id === selectedErfId) || null,
    [erfs, selectedErfId]
  );

  const filteredErfs = useMemo(() => {
    if (!erfSearch.trim()) return erfs;
    const q = erfSearch.toLowerCase();
    return erfs.filter((e) => (e.erfId || e.id).toLowerCase().includes(q));
  }, [erfs, erfSearch]);

  // Shared Blue Style
  const activeStyle = { color: "#2563eb", fontWeight: "bold" };

  return (
    <View style={{ padding: 12, backgroundColor: "rgba(255,255,255,0.95)" }}>
      {/* LM - Municipality is always "active" context */}
      <List.Item
        title={lm?.name || "Local Municipality"}
        titleStyle={activeStyle}
        description="Active Municipality"
        left={(p) => (
          <List.Icon {...p} icon="office-building" color="#2563eb" />
        )}
        onPress={() => onSelectMunicipality()}
      />
      {/* WARD */}
      // Inside GeoCascadingSelector.js
      {/* WARD */}
      <View style={{ position: "relative" }}>
        <List.Item
          title={selectedWard ? `Ward ${selectedWard.code}` : "Select Ward"}
          titleStyle={selectedWard ? activeStyle : {}}
          description={
            wardsLoading ? "Loading wards…" : `${wards.length} wards`
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
              {selectedWard && !wardsLoading && (
                <View style={{ flexDirection: "row", marginRight: 8 }}>
                  {/* 1. Zoom specifically to the selected Ward */}
                  <IconButton
                    icon="target"
                    iconColor="#2563eb"
                    size={24}
                    onPress={(e) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      // To force a zoom to the WARD specifically, we need to clear the ERF first
                      // OR ensure the Camera Controller prioritizes this request.
                      onSelectErf(null);
                      onRefreshCamera();
                    }}
                  />
                  {/* 2. Dismiss Ward and go back to LM */}
                  <IconButton
                    icon="close-circle-outline"
                    iconColor="#dc2626"
                    size={24}
                    onPress={(e) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      onSelectErf(null); // Clear child first
                      onSelectWard(null); // Clear ward to fall back to LM
                      onRefreshCamera();
                    }}
                  />
                </View>
              )}
              {wardsLoading ? (
                <ActivityIndicator />
              ) : (
                <List.Icon {...p} icon="chevron-down" />
              )}
            </View>
          )}
        />
      </View>
      {/* ERF */}
      <View style={{ position: "relative" }}>
        <List.Item
          title={
            selectedErf ? `ERF ${selectedErf?.sg?.parcelNo}` : "Select ERF"
          }
          titleStyle={selectedErf ? activeStyle : {}}
          description={
            !selectedWard
              ? "Select ward first"
              : erfsLoading
              ? "Loading ERFs…"
              : `${erfs.length} ERFs`
          }
          onPress={() => erfs.length && setErfDialogOpen(true)}
          left={(p) => (
            <List.Icon
              {...p}
              icon="home-map-marker"
              color={selectedErf ? "#2563eb" : p.color}
            />
          )}
          right={(p) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {selectedErf && !erfsLoading && (
                <View style={{ flexDirection: "row", marginRight: 8 }}>
                  <IconButton
                    icon="target-variant"
                    iconColor="#2563eb"
                    size={24}
                    onPress={(e) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      onRefreshCamera();
                    }}
                  />
                  <IconButton
                    icon="close-circle-outline"
                    iconColor="#dc2626"
                    size={24}
                    onPress={(e) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      onSelectErf(null);
                    }}
                  />
                </View>
              )}
              {erfsLoading ? (
                <ActivityIndicator />
              ) : (
                <List.Icon {...p} icon="chevron-down" />
              )}
            </View>
          )}
        />
      </View>
      <Portal>
        {/* WARD DIALOG */}
        <Dialog
          visible={wardDialogOpen}
          onDismiss={() => setWardDialogOpen(false)}
        >
          <Dialog.Title>Select Ward</Dialog.Title>
          <Dialog.Content>
            <FlatList
              data={wards}
              keyExtractor={(i) => i.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <List.Item
                  title={`Ward ${item.code}`}
                  onPress={() => {
                    onSelectWard(item.id);
                    setWardDialogOpen(false);
                  }}
                />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setWardDialogOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* ERF DIALOG */}
        <Dialog
          visible={erfDialogOpen}
          onDismiss={() => setErfDialogOpen(false)}
        >
          <Dialog.Title>Select ERF</Dialog.Title>
          <Dialog.Content style={{ height: 400 }}>
            <TextInput
              mode="outlined"
              placeholder="Search ERF…"
              value={erfSearch}
              onChangeText={setErfSearch}
              style={{ marginBottom: 10 }}
            />
            <FlatList
              data={filteredErfs}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <List.Item
                  title={item?.sg?.parcelNo}
                  onPress={() => {
                    onSelectErf(item.id);
                    setErfDialogOpen(false);
                  }}
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
