import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Chip, Text } from "react-native-paper";
import { useAuth } from "../../../../src/hooks/useAuth";
import { useGetServiceProvidersQuery } from "../../../../src/redux/spApi";
import { useGetUsersQuery } from "../../../../src/redux/usersApi";

function getServiceProviderParentSpClient(serviceProvider) {
  const clients = Array.isArray(serviceProvider?.clients)
    ? serviceProvider.clients
    : [];

  return (
    clients.find(
      (client) =>
        client?.clientType === "SP" &&
        client?.relationshipType === "SUBC" &&
        client?.id,
    ) || null
  );
}

function getDirectSubcChildren(parentSpId, allServiceProviders = []) {
  return allServiceProviders.filter((serviceProvider) => {
    const parentSpClient = getServiceProviderParentSpClient(serviceProvider);
    return parentSpClient?.id === parentSpId;
  });
}

function collectMngTreeServiceProviderIds(
  rootSpId,
  allServiceProviders = [],
  visitedIds = new Set(),
) {
  if (!rootSpId) return [];
  if (visitedIds.has(rootSpId)) return [];

  visitedIds.add(rootSpId);

  const childProviders = getDirectSubcChildren(rootSpId, allServiceProviders);

  const childIds = childProviders.flatMap((childProvider) =>
    collectMngTreeServiceProviderIds(
      childProvider.id,
      allServiceProviders,
      visitedIds,
    ),
  );

  return [rootSpId, ...childIds];
}

export default function PendingAuthorizations() {
  const router = useRouter();
  const { isMNG, isSPU, isADM, profile: authProfile } = useAuth();

  const { data: allSps = [], isLoading: spsLoading } =
    useGetServiceProvidersQuery();

  const { data: allUsers = [], isLoading: usersLoading } = useGetUsersQuery();

  const filteredRecruits = useMemo(() => {
    if (!Array.isArray(allUsers) || !Array.isArray(allSps)) return [];

    const pendingPool = allUsers.filter(
      (user) => user?.onboarding?.status === "AWAITING-MNG-CONFIRMATION",
    );

    if (isSPU || isADM) {
      return pendingPool;
    }

    if (isMNG) {
      const mySpId = authProfile?.employment?.serviceProvider?.id || null;
      if (!mySpId) return [];

      const authorizedSpIds = collectMngTreeServiceProviderIds(
        mySpId,
        allSps,
        new Set(),
      );

      return pendingPool.filter((recruit) =>
        authorizedSpIds.includes(recruit?.employment?.serviceProvider?.id),
      );
    }

    return [];
  }, [allUsers, allSps, authProfile, isMNG, isSPU, isADM]);

  const isLoading = usersLoading || spsLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={filteredRecruits}
        estimatedItemSize={150}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={() => (
          <Text style={styles.listHeader}>
            {filteredRecruits.length} Operative
            {filteredRecruits.length !== 1 ? "s" : ""} awaiting review
          </Text>
        )}
        renderItem={({ item }) => (
          <Card style={styles.card} elevation={2}>
            <Card.Title
              title={`${item?.profile?.name || "NAv"} ${
                item?.profile?.surname || ""
              }`.trim()}
              subtitle={item?.profile?.email || "NAv"}
              left={(props) => (
                <Avatar.Text
                  {...props}
                  label={item?.profile?.name?.[0] || "?"}
                  style={{
                    backgroundColor:
                      item?.employment?.role === "SPV" ? "#8b5cf6" : "#2563eb",
                  }}
                />
              )}
            />

            <Card.Content>
              <View style={styles.badgeRow}>
                <Chip icon="office-building" style={styles.chip}>
                  {item?.employment?.serviceProvider?.name || "NAv"}
                </Chip>
                <Chip icon="account-hard-hat" style={styles.chip}>
                  {item?.employment?.role || "NAv"}
                </Chip>
              </View>
            </Card.Content>

            <Card.Actions style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() =>
                  router.push({
                    pathname: "/admin/pendingUsers/[uid]",
                    params: { uid: item.uid },
                  })
                }
                icon="account-search"
              >
                REVIEW RECRUIT
              </Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={64}
              color="#cbd5e1"
            />
            <Text style={styles.emptyText}>
              No pending authorizations for your command.
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  chip: { backgroundColor: "#f1f5f9", height: 32 },
  actions: { paddingBottom: 12, paddingRight: 12 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: {
    marginTop: 16,
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: 14,
  },
});
