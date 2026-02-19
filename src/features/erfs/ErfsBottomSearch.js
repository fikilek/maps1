import { StyleSheet, View } from "react-native";
import { Searchbar, Surface, Text } from "react-native-paper";

export default function ErfsBottomSearch({
  searchQuery,
  setSearchQuery,
  count,
}) {
  return (
    <Surface style={styles.bottomBar} elevation={4}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.countText}>{`Total Erfs: ${count}`}</Text>
        </View>
        <Searchbar
          placeholder="Search Erf No or Address..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 25, // Extra padding for safe area
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  searchBar: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    height: 50,
  },
  searchInput: {
    fontSize: 14,
  },
});
