import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Chip, Text } from "react-native-paper";
import { useAuth } from "../../../../src/hooks/useAuth";
import { useUpdateProfileMutation } from "../../../../src/redux/authApi";
import { useGetServiceProvidersQuery } from "../../../../src/redux/spApi";
import { useGetUsersQuery } from "../../../../src/redux/usersApi";

export default function PendingAuthorizations() {
  const loggedUser = useAuth();
  const { user, isMNG, isSPU, isADM, profile: authProfile } = loggedUser;

  const router = useRouter();

  // 🛰️ 1. Fetch all Service Providers to identify the "Family Tree"
  const { data: allSps } = useGetServiceProvidersQuery();

  // 🛰️ 2. Fetch all users in the pending state
  const { data: allUsers, isLoading: usersLoading } = useGetUsersQuery();
  // console.log(`PendingAuthorizations --allUsers`, allUsers);

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const filteredRecruits = useMemo(() => {
    if (!allUsers || !allSps) return [];

    const pendingPool = allUsers.filter(
      (u) => u.onboarding?.status === "AWAITING-MNG-CONFIRMATION",
    );

    if (isSPU || isADM) return pendingPool;

    if (isMNG) {
      const mySpId = user.employment?.serviceProvider?.id;

      // 🛰️ Identify the SUBS (Children) who list the Manager's SP as a client
      const mySubs = allSps
        .filter((sp) => sp.clients?.some((c) => c.id === mySpId))
        .map((sp) => sp.id);

      // 🛡️ The MNG sees recruits from their own SP AND their Sub-contractor SPs
      const authorizedSpIds = [mySpId, ...mySubs];

      return pendingPool.filter((recruit) =>
        authorizedSpIds.includes(recruit.employment?.serviceProvider?.id),
      );
    }

    return [];
  }, [allUsers, allSps, user, isMNG, isSPU, isADM]);
  // console.log(`PendingAuthorizations --filteredRecruits`, filteredRecruits);

  const handleAuthorize = (recruit) => {
    // 🛰️ SIGNAL RECOVERY: Direct inheritance from the Manager's logs
    const managerWorkbases = loggedUser.workbases || [];

    Alert.alert(
      "Mobilise Operative",
      `Authorize ${recruit.profile.name} and grant inheritance of ${managerWorkbases.length} workbases?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "CONFIRM AUTHORIZATION",
          onPress: async () => {
            try {
              const authorizerName =
                authProfile?.profile?.displayName ||
                user?.displayName ||
                "System Admin";

              // 🎯 TACTICAL ALIGNMENT: Calling the actual endpoint name
              await updateProfile({
                uid: recruit.uid,
                update: {
                  accountStatus: "ENABLED",
                  "onboarding.status": "COMPLETED",
                  "access.workbases": managerWorkbases,
                  "metadata.updatedAt": new Date().toISOString(),
                  "metadata.updatedByUser": authorizerName,
                },
              }).unwrap();

              Alert.alert(
                "Success",
                "Territory inherited. Operative mobilized.",
              );
            } catch (err) {
              console.log(`Update failure :`, err);
              Alert.alert(
                "Error",
                "The Garrison failed to sync the inheritance.",
              );
            }
          },
        },
      ],
    );
  };

  if (usersLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );

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
              title={`${item.profile.name} ${item.profile.surname}`}
              subtitle={item.profile.email}
              left={(props) => (
                <Avatar.Text
                  {...props}
                  label={item.profile.name[0]}
                  style={{
                    backgroundColor:
                      item.employment.role === "SPV" ? "#8b5cf6" : "#2563eb",
                  }}
                />
              )}
            />
            <Card.Content>
              <View style={styles.badgeRow}>
                <Chip icon="office-building" style={styles.chip}>
                  {item.employment.serviceProvider?.name}
                </Chip>
                <Chip icon="account-hard-hat" style={styles.chip}>
                  {item.employment.role}
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
    borderWeight: 1,
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
