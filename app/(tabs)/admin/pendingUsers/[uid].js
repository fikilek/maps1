import { useAuth } from "@/src/hooks/useAuth";
import { useUpdateProfileMutation } from "@/src/redux/authApi";
import { useGetUsersQuery } from "@/src/redux/usersApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Divider,
  SegmentedButtons,
  Text,
} from "react-native-paper";
import { SpsHeader } from "../../../../src/features/sps/spsHeader";

export default function UserAuthorisationScreen() {
  const { uid } = useLocalSearchParams();
  const router = useRouter();
  const {
    user: manager,
    workbases: managerWorkbases,
    profile: managerProfile,
  } = useAuth();

  const { data: allUsers = [] } = useGetUsersQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [recruit, setRecruit] = useState(null);
  const [assignedRole, setAssignedRole] = useState("");

  useEffect(() => {
    const found = allUsers.find((u) => u.uid === uid);
    if (found) {
      setRecruit(found);
      setAssignedRole(found.employment?.role || "FWR");
    }
  }, [allUsers, uid]);

  const handleAction = async (approve = true) => {
    const authorizerName =
      managerProfile?.profile?.displayName || manager?.email || "Manager";

    try {
      if (approve) {
        await updateProfile({
          uid,
          update: {
            accountStatus: "ACTIVE",
            "onboarding.status": "COMPLETED",
            "employment.role": assignedRole, // 🎯 Final Role Assignment
            "access.workbases": managerWorkbases, // 🏹 Inheritance
            "access.activeWorkbase": managerWorkbases[0] || null,
            "metadata.updatedAt": new Date().toISOString(),
            "metadata.updatedByUser": authorizerName,
          },
        }).unwrap();
        Alert.alert("Success", "Operative mobilized to the field.");
      } else {
        // ⚔️ REJECTION LOGIC
        await updateProfile({
          uid,
          update: {
            accountStatus: "REJECTED",
            "onboarding.status": "REJECTED",
            "metadata.updatedAt": new Date().toISOString(),
            "metadata.updatedByUser": authorizerName,
          },
        }).unwrap();
        Alert.alert("Rejected", "Recruit has been barred from entry.");
      }
      router.back();
    } catch (err) {
      Alert.alert("Error", "Command execution failed.");
    }
  };

  if (!recruit) return null;

  return (
    <View style={styles.container}>
      <SpsHeader title="Review Recruit" subtitle={recruit.profile?.email} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <View style={styles.avatarContainer}>
            <Avatar.Text label={recruit.profile?.name[0]} size={80} />
            <Text style={styles.userName}>
              {recruit.profile?.name} {recruit.profile?.surname}
            </Text>
            <Text style={styles.userEmail}>{recruit.profile?.email}</Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>IDENTITY DATA</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cell:</Text>
            <Text>{recruit.contact?.cell || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Number:</Text>
            <Text>{recruit.profile?.idNumber || "Not Provided"}</Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>COMMAND CLASSIFICATION</Text>
          <Text style={styles.subLabel}>
            Set operational rank for this operative:
          </Text>
          <SegmentedButtons
            value={assignedRole}
            onValueChange={setAssignedRole}
            buttons={[
              {
                value: "FWR",
                label: "Field Worker (FWR)",
                icon: "account-hard-hat",
              },
              {
                value: "SPV",
                label: "Supervisor (SPV)",
                icon: "shield-account",
              },
            ]}
            style={styles.segmented}
          />
        </Card>

        <View style={styles.actionRow}>
          <Button
            mode="outlined"
            onPress={() => handleAction(false)}
            textColor="#dc2626"
            style={styles.btn}
            disabled={isLoading}
          >
            REJECT
          </Button>
          <Button
            mode="contained"
            onPress={() => handleAction(true)}
            buttonColor="#059669"
            style={[styles.btn, { flex: 2 }]}
            loading={isLoading}
            disabled={isLoading}
          >
            AUTHORIZE & MOBILIZE
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { padding: 16 },
  card: { padding: 20, borderRadius: 16, backgroundColor: "#fff" },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 12,
    color: "#1e293b",
  },
  userEmail: { color: "#64748b", fontWeight: "600" },
  divider: { marginVertical: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#94a3b8",
    marginBottom: 15,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: { fontWeight: "700", color: "#475569" },
  subLabel: { fontSize: 13, color: "#64748b", marginBottom: 10 },
  segmented: { marginTop: 5 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  btn: { flex: 1, borderRadius: 12 },
});
