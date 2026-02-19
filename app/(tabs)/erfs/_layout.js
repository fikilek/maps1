import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGeo } from "../../../src/context/GeoContext";

export default function ErfsLayout() {
  const router = useRouter();
  const { geoState } = useGeo();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      {/* 🏛️ THE ENHANCED DETAIL HEADER */}
      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerErfLabel}>
                ERF {geoState?.selectedErf?.erfNo || "Detail"}
              </Text>
            </View>
          ),
          // 🎯 A. CUSTOM SEXY BACK BTN
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={46} color="#1e293b" />
            </TouchableOpacity>
          ),
          // 🎯 C. 'ADD ANOTHER PREMISE' ICON BTN
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/erfs/form?id=${route.params.id}`)}
              style={styles.addHeaderBtn}
            >
              <MaterialCommunityIcons
                name="plus-box"
                size={48}
                color="#059669"
              />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="form"
        options={{
          title: "Capture Premise",
          presentation: "modal",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerErfLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: 1,
  },
  backBtn: {
    marginLeft: 5,
    padding: 5,
  },
  addHeaderBtn: {
    marginRight: 10,
    padding: 5,
  },
  cancelText: {
    color: "#DC3545",
    marginLeft: 10,
    fontWeight: "600",
  },
});
