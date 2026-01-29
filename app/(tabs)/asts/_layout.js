import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGeo } from "../../../src/context/GeoContext";
import { useGetAstsByLmPcodeQuery } from "../../../src/redux/astsApi";

export default function AstsLayout() {
  const { geoState } = useGeo();
  const lmPcode = geoState?.selectedLm?.id;

  // 🎯 Fetching here ensures the Header has access to the length
  const { data: asts } = useGetAstsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );
  const totalMeters = asts?.length || 0;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F8FAFC" },
          headerLeft: () => (
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>ASTS</Text>
              {/* 🎯 The Counter Badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalMeters}</Text>
              </View>
            </View>
          ),
          headerTitle: "",
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity style={styles.iconButton}>
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={22}
                  color="#1E293B"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton}>
                <MaterialCommunityIcons
                  name="filter-variant"
                  size={22}
                  color="#1E293B"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B",
  },
  badge: {
    backgroundColor: "#3B82F6", // Power Blue
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    marginTop: 4, // Aligns it slightly better with the baseline
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#FFF",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
