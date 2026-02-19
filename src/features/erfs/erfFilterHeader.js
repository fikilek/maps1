import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, Dialog, Portal, Surface } from "react-native-paper";

const ErfFilterHeader = ({
  selectedWard,
  setSelectedWard,
  availableWards,
  filteredCount,
  totalCount,
  selectedErf, // 🎯 Pass the selection in
  onScrollToSelected, // 🎯 Pass the scroll action in
  // 🎯 NEW PROPS FOR SORTING
  sortOrder = "DESC",
  onToggleSort,
}) => {
  const [visible, setVisible] = useState(false);
  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  // console.log(`ErfFilterHeader ----filteredCount`, filteredCount);
  // console.log(`ErfFilterHeader ----totalCount`, totalCount);
  // console.log(`ErfFilterHeader ----selectedErf`, selectedErf);

  const displayWardName =
    selectedWard === "ALL" || !selectedWard
      ? "All Wards"
      : selectedWard?.name || selectedWard?.code || "Ward";

  return (
    <Surface style={styles.header} elevation={1}>
      <View style={styles.row}>
        {/* 🎯 LEFT: WARD SELECTION */}
        <View style={styles.leftCol}>
          {/* <Text style={styles.label}>Active Ward</Text> */}
          <Button
            mode="outlined"
            onPress={showDialog}
            style={styles.wardButton}
            icon="filter-variant"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            compact
          >
            {displayWardName}
          </Button>
        </View>

        {/* Sort Btn  - Sort by upadatedAt descening andascending order */}
        {/* 🚀 NEW: SORT TOGGLE (Between Ward and Center) */}
        {/* <TouchableOpacity
          style={styles.sortCol}
          onPress={onToggleSort}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name={
              sortOrder === "DESC"
                ? "sort-calendar-descending"
                : "sort-calendar-ascending"
            }
            size={26}
            color="#2563eb"
          />
          <Text style={styles.sortText}>{sortOrder}</Text>
        </TouchableOpacity> */}

        {/* 🎯 CENTER: THE TARGET LOCATOR (SelectedErfBtn) */}
        {selectedErf && (
          <View style={styles.centerCol}>
            <TouchableOpacity
              style={styles.targetBtn}
              onPress={onScrollToSelected}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: "70%",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 10 }}>Selected Erf</Text>
                <Text
                  style={styles.targetText}
                >{`ERF ${selectedErf?.erfNo}`}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 📊 RIGHT: TACTICAL STATS */}
        <View style={styles.rightCol}>
          <View style={styles.statsBox}>
            <Text style={styles.statsText}>
              {`${displayWardName} Erfs: `}
              <Text style={styles.boldText}>{filteredCount}</Text>
            </Text>
            <View style={styles.divider} />
            <Text style={styles.statsText}>
              {`LM Total Erfs: `}
              <Text style={styles.boldText}>{totalCount}</Text>
            </Text>
          </View>
        </View>
      </View>

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
          <Dialog.Title style={styles.modalTitle}>Select Ward</Dialog.Title>

          <Dialog.ScrollArea
            style={[styles.scrollArea, { paddingHorizontal: 0 }]}
          >
            <FlashList
              data={["ALL", ...(availableWards || [])]}
              keyExtractor={(item, index) => `${item?.id || item || index}`}
              estimatedItemSize={60}
              renderItem={({ item }) => {
                const isAll = item === "ALL";
                const isSelected = isAll
                  ? selectedWard === "ALL" || !selectedWard
                  : selectedWard?.id === item?.id;

                const label = isAll
                  ? "All Wards (Reset)"
                  : `${item?.name || item?.code || "Ward"}`;

                return (
                  <TouchableOpacity
                    style={[
                      styles.wardItem,
                      isSelected && { backgroundColor: "#eff6ff" }, // Light blue highlight
                    ]}
                    onPress={() => {
                      setSelectedWard(isAll ? null : item);
                      hideDialog();
                    }}
                  >
                    <View style={styles.itemInner}>
                      <Text
                        style={[
                          styles.wardText,
                          isAll && { color: "#6366f1", fontWeight: "900" }, // Indigo for "ALL"
                          isSelected &&
                            !isAll && { color: "#2563eb", fontWeight: "bold" },
                        ]}
                      >
                        {label}
                      </Text>

                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={isAll ? "#6366f1" : "#2563eb"}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={hideDialog} textColor="#94a3b8">
              CLOSE
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
};

export default ErfFilterHeader;

const styles = StyleSheet.create({
  targetBtn: {
    backgroundColor: "#00BFFF", // Deep Sky Blue
    flexDirection: "row",
    alignItems: "center",
    // paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 5,
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    height: "100%",
  },
  targetText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 4,
  },
  description: {
    color: "gray", // Change description color
    fontSize: 14, // Change description font size
    fontStyle: "italic", // Make description italic
  },
  header: {
    padding: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  row: {
    // flex: 1,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
  },

  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  wardButton: {
    borderColor: "#cbd5e1",
    borderRadius: 8,
    // flex: 1,
  },
  buttonContent: {
    height: 36,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  statsBox: {
    backgroundColor: "#f8fafc",
    // padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    // width: "100%",
  },
  statsText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "right",
  },
  boldText: {
    color: "#413694",
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    // marginVertical: 4,
  },

  dialog: {
    borderRadius: 20,
    backgroundColor: "white",
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    textAlign: "center",
    paddingVertical: 10,
  },
  scrollArea: {
    height: 350,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  wardItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  itemInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wardText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
  },
  sortText: {
    fontSize: 6,
    fontWeight: "900",
    color: "#2563eb",
    marginTop: -2,
  },
  sortCol: {
    // flex: 0.1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#f1f5f9",
    // marginHorizontal: 4,
  },
  centerCol: {
    flex: 0.3,
    alignItems: "center",
    justifyContent: "center",
  },
  leftCol: {
    flex: 0.25,
    justifyContent: "center",
  },
  rightCol: {
    flex: 0.4,
  },
});
