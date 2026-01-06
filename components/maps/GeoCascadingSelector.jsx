import { useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  List,
  Portal,
} from "react-native-paper";

import {
  useGetLocalMunicipalityByIdQuery,
  useGetWardsByLocalMunicipalityQuery,
} from "../../src/redux/geoApi";

const GeoCascadingSelector = ({
  activeWorkbase,
  onChange,
  disabled = false,
}) => {
  const activeWorkbaseId = activeWorkbase?.id;

  // 1. Fetch Geometry/Details
  const { data: lmDetails, isLoading: lmLoading } =
    useGetLocalMunicipalityByIdQuery(activeWorkbaseId, {
      skip: !activeWorkbaseId,
    });

  // 2. Fetch Wards
  const { data: wards = [], isLoading: wardsLoading } =
    useGetWardsByLocalMunicipalityQuery(activeWorkbaseId, {
      skip: !activeWorkbaseId,
    });

  const [wardId, setWardId] = useState(null);
  const [wardDialogOpen, setWardDialogOpen] = useState(false);

  // Reset ward if municipality changes
  useEffect(() => {
    if (activeWorkbaseId) setWardId(null);
  }, [activeWorkbaseId]);

  const selectedWard = useMemo(
    () => wards.find((w) => w.id === wardId) || null,
    [wards, wardId]
  );

  // Emit changes to parent
  useEffect(() => {
    if (activeWorkbase || lmDetails) {
      onChange?.({
        lm: lmDetails || activeWorkbase,
        ward: selectedWard,
      });
    }
  }, [lmDetails, activeWorkbase, selectedWard]);

  /* =========================
      RENDER
  ========================= */
  return (
    <View style={{ padding: 12, backgroundColor: "rgba(255,255,255,0.9)" }}>
      {/* MUNICIPALITY SECTION */}
      {/* MUNICIPALITY SECTION */}
      <List.Item
        title={activeWorkbase?.name || "Initializing..."}
        description={
          lmLoading
            ? "Loading map boundaries..."
            : "Tap to zoom to Municipality"
        }
        onPress={() => {
          // 1. Clear the local ward selection
          setWardId(null);
          // 2. The useEffect in this component will automatically
          //    emit the lmDetails to the parent, triggering the zoom.
        }}
        left={(props) => (
          <List.Icon {...props} icon="office-building" color="#4CAF50" />
        )}
        right={() => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {lmLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <List.Icon icon="magnify-plus" color="#4CAF50" />
            )}
          </View>
        )}
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          elevation: 2,
        }}
      />

      {/* WARD SECTION */}
      <List.Item
        title={selectedWard ? `Ward ${selectedWard.code}` : "Select Ward"}
        description={
          !activeWorkbaseId
            ? "Waiting for workbase..."
            : wardsLoading
            ? "Fetching wards..."
            : selectedWard?.name || `${wards.length} wards available`
        }
        onPress={() => !disabled && activeWorkbaseId && setWardDialogOpen(true)}
        left={(props) => (
          <List.Icon
            {...props}
            icon="map-marker-radius"
            color={selectedWard ? "#2196F3" : "#9e9e9e"}
          />
        )}
        right={(props) => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {wardsLoading && (
              <ActivityIndicator size="small" style={{ marginRight: 8 }} />
            )}
            <List.Icon {...props} icon="chevron-down" />
          </View>
        )}
        style={{
          marginTop: 8,
          backgroundColor: "#fff",
          borderRadius: 8,
          elevation: 2,
        }}
      />

      {/* WARD DIALOG */}
      <Portal>
        <Dialog
          visible={wardDialogOpen}
          onDismiss={() => setWardDialogOpen(false)}
        >
          <Dialog.Title>Select Ward</Dialog.Title>
          <Dialog.Content style={{ maxHeight: 400 }}>
            <FlatList
              data={wards}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <List.Item
                  title={`Ward ${item.code}`}
                  description={item.name}
                  onPress={() => {
                    setWardId(item.id);
                    setWardDialogOpen(false);
                  }}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        item.id === wardId ? "check-circle" : "circle-outline"
                      }
                      color={item.id === wardId ? "#2196F3" : "#ccc"}
                    />
                  )}
                />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setWardDialogOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default GeoCascadingSelector;
