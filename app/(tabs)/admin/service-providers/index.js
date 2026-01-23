import { useAuth } from "@/src/hooks/useAuth";
import { useGetServiceProvidersQuery } from "@/src/redux/spApi";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

export default function ServiceProvidersListScreen() {
  const router = useRouter();
  const { isSPU, isADM } = useAuth();

  const { data: sps = [], isLoading, error } = useGetServiceProvidersQuery();
  console.log(`ServiceProvidersListScreen ----sps`, sps);

  // ✅ filter real SPs only
  const realSPs = sps
    .filter((sp) => sp?.profile?.name && sp?.status?.lifecycle)
    .sort(
      (a, b) =>
        (b.meta?.createdAt?.seconds || 0) - (a.meta?.createdAt?.seconds || 0)
    );

  return (
    <View style={styles.container}>
      {/* 🔒 CREATE BUTTON */}
      {(isSPU || isADM) && (
        <Button
          mode="contained"
          icon="plus"
          style={styles.createBtn}
          onPress={() => router.push("/(tabs)/admin/service-providers/create")}
        >
          Register Service Provider
        </Button>
      )}

      {/* CONTENT */}
      {isLoading && <Text style={styles.info}>Loading service providers…</Text>}

      {error && (
        <Text style={styles.error}>Failed to load service providers</Text>
      )}

      {!isLoading && realSPs.length === 0 && (
        <Text style={styles.info}>No Service Providers yet.</Text>
      )}

      <FlashList
        data={realSPs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.profile.name}</Text>

            <Text style={styles.meta}>Type: {item.profile.classification}</Text>

            <Text style={styles.meta}>Status: {item.status.lifecycle}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  createBtn: {
    marginBottom: 16,
  },
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ffe2e2ff",
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  info: {
    textAlign: "center",
    color: "#666",
    marginTop: 24,
  },
  error: {
    textAlign: "center",
    color: "red",
    marginTop: 24,
  },
});
