import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  List,
  Portal,
  RadioButton,
  Searchbar,
  Surface,
} from "react-native-paper";

const ErfFilterHeader = ({
  search,
  setSearch,
  selectedWard,
  setSelectedWard,
  availableWards,
}) => {
  const [visible, setVisible] = useState(false);

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  // Helper for the button label
  const wardLabel =
    selectedWard === "ALL" ? "All Wards" : `Ward ${selectedWard.slice(-2)}`;

  return (
    <Surface style={styles.header} elevation={2}>
      {/* --- UNIFORM ROW --- */}
      <View style={styles.row}>
        <Searchbar
          placeholder="Search Erf..."
          onChangeText={setSearch}
          value={search}
          style={styles.searchBar}
        />

        <Button
          mode="outlined"
          onPress={showDialog}
          style={styles.wardButton}
          icon="filter-variant"
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {wardLabel}
        </Button>
      </View>

      {/* --- WARD SELECTION MODAL --- */}
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
          <Dialog.Title>Select Ward</Dialog.Title>
          <Dialog.ScrollArea style={styles.scrollArea}>
            <FlatList
              data={availableWards}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <List.Item
                  title={
                    item === "ALL" ? "All Wards" : `Ward ${item.slice(-2)}`
                  }
                  onPress={() => {
                    setSelectedWard(item);
                    hideDialog();
                  }}
                  left={() => (
                    <RadioButton
                      value={item}
                      status={selectedWard === item ? "checked" : "unchecked"}
                      onPress={() => {
                        setSelectedWard(item);
                        hideDialog();
                      }}
                    />
                  )}
                />
              )}
            />
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 10,
    backgroundColor: "white",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBar: {
    flex: 2, // Search takes more space
    height: 48,
    backgroundColor: "#f5f5f5",
    elevation: 0,
  },
  wardButton: {
    flex: 1, // Button takes less space
    height: 48,
    justifyContent: "center",
    borderColor: "#ccc",
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 12,
  },
  scrollArea: {
    paddingHorizontal: 0,
    maxHeight: 400, // Keep modal from covering whole screen
  },
  dialog: {
    borderRadius: 12,
  },
});

export default ErfFilterHeader;
