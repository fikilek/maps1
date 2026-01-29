import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useGeo } from "../../../src/context/GeoContext";
import { useGetTrnsByLmPcodeQuery } from "../../../src/redux/trnsApi";

export default function TrnsLayout() {
  const { geoState } = useGeo();
  const lmPcode = geoState?.selectedLm?.id;

  // 🎯 Live counter for Transactions
  const { data: trns } = useGetTrnsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );
  const totalTrns = trns?.length || 0;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F8FAFC" },
          headerLeft: () => (
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>TRNS</Text>
              {/* 🎯 The Live Counter Badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalTrns}</Text>
              </View>
            </View>
          ),
          headerTitle: "", // Hide default center title
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
    backgroundColor: "#EAB308", // Yellow/Gold to match the TRNS/Discovery vibe
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    marginTop: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
