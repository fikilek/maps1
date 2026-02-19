import { Feather, FontAwesome6, Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

export default function PremiseMedia() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 🛠️ Tactical Work-in-Progress Icon */}
      <View style={{ flexDirection: "row", gap: 20 }}>
        <Octicons name="file-media" size={70} color="#cbd5e1" />
        <FontAwesome6 name="microphone-lines" size={70} color="black" />
        <Feather name="video" size={70} color="black" />
      </View>

      <Text style={styles.title}>PREMISE MEDIA GALLERY</Text>

      <Text style={styles.subtitle}>
        The Premise Media Review system is currently being energized.
      </Text>

      {/* 🛡️ Status Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>FUNCTIONALITY COMING SOON</Text>
      </View>

      <Button
        mode="contained"
        onPress={() => router.back()}
        style={styles.btn}
        labelStyle={styles.btnLabel}
      >
        RETURN TO MISSION
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 20,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
  },
  btn: {
    marginTop: 40,
    backgroundColor: "#6654dd",
    borderRadius: 10,
    width: "100%",
    height: 48,
    justifyContent: "center",
  },
  btnLabel: {
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
