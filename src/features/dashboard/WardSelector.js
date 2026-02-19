// src/features/dashboard/WardSelector.js
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

const WARDS = ["ALL", "W1", "W2", "W3", "W4", "W5", "W6"];

export const WardSelector = ({ activeWard, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {WARDS.map((ward) => (
        <TouchableOpacity
          key={ward}
          onPress={() => onSelect(ward === "ALL" ? null : ward)}
          style={[
            styles.tab,
            (activeWard === ward || (ward === "ALL" && !activeWard)) &&
              styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              (activeWard === ward || (ward === "ALL" && !activeWard)) &&
                styles.activeText,
            ]}
          >
            {ward}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  content: { paddingHorizontal: 16 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f8fafc",
  },
  activeTab: { backgroundColor: "#1e293b" },
  tabText: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  activeText: { color: "#fff" },
});
