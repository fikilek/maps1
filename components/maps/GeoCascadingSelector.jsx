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
  activeWorkbaseId,
  onChange,
  disabled = false,
}) => {
  /* =========================
     DATA
  ========================= */
  const { data: lm } = useGetLocalMunicipalityByIdQuery(activeWorkbaseId, {
    skip: !activeWorkbaseId,
  });

  const { data: wards = [], isLoading } = useGetWardsByLocalMunicipalityQuery(
    lm?.id,
    {
      skip: !lm?.id,
    }
  );

  /* =========================
     LOCAL UI STATE
  ========================= */
  const [wardId, setWardId] = useState(null);
  const [wardDialogOpen, setWardDialogOpen] = useState(false);

  const selectedWard = useMemo(
    () => wards.find((w) => w.id === wardId) || null,
    [wards, wardId]
  );

  /* =========================
     EMIT CHANGE (CONTRACT)
  ========================= */
  useEffect(() => {
    if (!lm) return;

    onChange?.({
      lm,
      ward: selectedWard,
    });
  }, [lm, selectedWard]);

  /* =========================
     RENDER GUARDS
  ========================= */
  if (!lm) {
    return (
      <View style={{ padding: 16 }}>
        <ActivityIndicator />
      </View>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <View style={{ padding: 12 }}>
      {/* WORKBASE (LOCKED) */}
      <List.Section>
        <List.Subheader>Workbase</List.Subheader>
        <List.Item
          title={lm.name}
          left={(props) => <List.Icon {...props} icon="map" />}
        />
      </List.Section>

      {/* WARD SELECT */}
      <List.Section>
        <List.Subheader>Ward</List.Subheader>

        <List.Item
          title={selectedWard?.name ?? "Select ward"}
          description={
            selectedWard ? `Code: ${selectedWard.code}` : "No ward selected"
          }
          onPress={() => !disabled && setWardDialogOpen(true)}
          left={(props) => <List.Icon {...props} icon="map-marker" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      {/* WARD DIALOG */}
      <Portal>
        <Dialog
          visible={wardDialogOpen}
          onDismiss={() => setWardDialogOpen(false)}
        >
          <Dialog.Title>Select Ward</Dialog.Title>

          <Dialog.Content>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <FlatList
                data={wards}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <List.Item
                    title={item.name}
                    description={`Ward ${item.code}`}
                    onPress={() => {
                      setWardId(item.id);
                      setWardDialogOpen(false);
                    }}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          item.id === wardId
                            ? "check-circle"
                            : "checkbox-blank-circle-outline"
                        }
                      />
                    )}
                  />
                )}
              />
            )}
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
