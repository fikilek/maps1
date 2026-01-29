import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  List,
  Portal,
  RadioButton,
  Searchbar,
  Surface,
  Text,
} from "react-native-paper";

const ErfFilterHeader = ({
  search,
  setSearch,
  selectedWard,
  setSelectedWard,
  availableWards,
  filteredCount,
  totalCount,
}) => {
  const [visible, setVisible] = useState(false);

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  // 🛡️ TACTICAL SANITIZER: Ensure we are showing a string label
  // If selectedWard is the "ALL" string, use it. If it's an object, use the name.
  const displayWardName =
    typeof selectedWard === "string"
      ? selectedWard
      : selectedWard?.name || selectedWard?.code || "Select Ward";

  return (
    <Surface style={styles.header} elevation={2}>
      <View style={styles.row}>
        <Searchbar
          placeholder="Search"
          onChangeText={setSearch}
          value={`${search}`} // 🛡️ Force string
          style={styles.searchBar}
          placeholderTextColor="#888"
        />
        <View style={styles.statsBar}>
          <View>
            <Text style={styles.statsText}>
              {/* 🛡️ SANITIZED */}
              {`${displayWardName} Erfs `}
              <Text style={styles.boldText}>{`${filteredCount}`}</Text>
            </Text>
            <Text style={styles.statsText}>
              {`LM Erfs: `}
              <Text style={styles.boldText}>{`${totalCount}`}</Text>
            </Text>
          </View>
        </View>

        <Button
          mode="outlined"
          onPress={showDialog}
          style={styles.wardButton}
          icon="filter-variant"
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {/* 🛡️ SANITIZED */}
          {`${displayWardName}`}
        </Button>
      </View>

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
          <Dialog.Title>Select Ward</Dialog.Title>
          <Dialog.ScrollArea
            style={[styles.scrollArea, { paddingHorizontal: 0, height: 300 }]}
          >
            <FlashList
              data={availableWards}
              // 🛡️ Ensure key is a string ID
              keyExtractor={(item, index) => `${item?.id || item || index}`}
              estimatedItemSize={60}
              renderItem={({ item }) => {
                // 🛡️ Handle "ALL" string vs Ward object
                const isAll = item === "ALL";
                const itemLabel = isAll
                  ? "All Wards"
                  : `${item?.name || item?.code || "Ward"}`;
                const itemValue = isAll ? "ALL" : item?.id || item;

                // Determine if checked (comparing strings or IDs)
                const isChecked = isAll
                  ? selectedWard === "ALL"
                  : selectedWard?.id === item?.id;

                return (
                  <List.Item
                    title={`${itemLabel}`}
                    onPress={() => {
                      setSelectedWard(item);
                      hideDialog();
                    }}
                    left={() => (
                      <RadioButton
                        value={`${itemValue}`}
                        status={isChecked ? "checked" : "unchecked"}
                        onPress={() => {
                          setSelectedWard(item);
                          hideDialog();
                        }}
                      />
                    )}
                  />
                );
              }}
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

// const ErfFilterHeader = ({
//   search,
//   setSearch,
//   selectedWard,
//   setSelectedWard,
//   availableWards,
//   filteredCount,
//   totalCount,
// }) => {
//   const [visible, setVisible] = useState(false);
//   // console.log(`ErfFilterHeader ----availableWards`, availableWards);
//   // console.log(`ErfFilterHeader ----selectedWard`, selectedWard);

//   const showDialog = () => setVisible(true);
//   const hideDialog = () => setVisible(false);

//   // Helper for the button label
//   // const wardLabel = selectedWard === "ALL" ? "All Wards" : selectedWard;

//   return (
//     <Surface style={styles.header} elevation={2}>
//       {/* --- UNIFORM ROW --- */}
//       <View style={styles.row}>
//         <Searchbar
//           placeholder="Search"
//           onChangeText={setSearch}
//           value={search}
//           style={styles.searchBar}
//           placeholderTextColor="#888" // Custom placeholder color
//         />
//         <View style={styles.statsBar}>
//           <View>
//             <Text style={styles.statsText}>
//               {selectedWard} Erfs
//               <Text style={styles.boldText}>{filteredCount}</Text>
//             </Text>
//             <Text style={styles.statsText}>
//               LM Erfs: <Text style={styles.boldText}>{totalCount}</Text>
//             </Text>
//           </View>

//           {search !== "" && (
//             <TouchableOpacity
//               onPress={() => setSearch("")}
//               style={styles.clearBtn}
//             >
//               <Text style={styles.clearSearchText}>Clear Search</Text>
//             </TouchableOpacity>
//           )}
//         </View>

//         <Button
//           mode="outlined"
//           onPress={showDialog}
//           style={styles.wardButton}
//           icon="filter-variant"
//           contentStyle={styles.buttonContent}
//           labelStyle={styles.buttonLabel}
//         >
//           {selectedWard}
//         </Button>
//       </View>

//       {/* --- WARD SELECTION MODAL --- */}
//       {/* --- WARD SELECTION MODAL --- */}
//       <Portal>
//         <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
//           <Dialog.Title>Select Ward</Dialog.Title>

//           {/* 1. Add paddingHorizontal: 0 and a fixed height or flex to ScrollArea */}
//           <Dialog.ScrollArea
//             style={[styles.scrollArea, { paddingHorizontal: 0, height: 300 }]}
//           >
//             <FlashList
//               data={availableWards}
//               keyExtractor={(item) => item}
//               // 2. FlashList MUST have an estimatedItemSize for the first render
//               estimatedItemSize={60}
//               renderItem={({ item }) => (
//                 <List.Item
//                   title={
//                     item === "ALL" ? "All Wards" : `Ward ${item.slice(-2)}`
//                   }
//                   onPress={() => {
//                     setSelectedWard(item);
//                     hideDialog();
//                   }}
//                   left={() => (
//                     <RadioButton
//                       value={item}
//                       status={selectedWard === item ? "checked" : "unchecked"}
//                       onPress={() => {
//                         setSelectedWard(item);
//                         hideDialog();
//                       }}
//                     />
//                   )}
//                 />
//               )}
//             />
//           </Dialog.ScrollArea>

//           <Dialog.Actions>
//             <Button onPress={hideDialog}>Cancel</Button>
//           </Dialog.Actions>
//         </Dialog>
//       </Portal>
//     </Surface>
//   );
// };

export default ErfFilterHeader;

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
  statsText: {
    color: "#939393ff",
  },
  subStatsText: {
    color: "#939393ff",
  },
  boldText: {
    color: "#413694ff",
    fontWeight: "900",
  },
});
