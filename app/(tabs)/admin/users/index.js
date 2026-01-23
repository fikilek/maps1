import { useRouter } from "expo-router";
import { useState } from "react";
import {
  // Button,
  Pressable,
  StyleSheet,
  // Text,
  View,
} from "react-native";
import { Button, List, Modal, Portal, Text } from "react-native-paper";

import { FlashList } from "@shopify/flash-list";
import { useAuth } from "../../../../src/hooks/useAuth";
import { useGetUsersQuery } from "../../../../src/redux/usersApi";

export default function UsersListScreen() {
  console.log(`UsersListScreen ----mounted`);

  const [roleFilter, setRoleFilter] = useState("ALL");
  console.log(`UsersListScreen ----roleFilter`, roleFilter);
  const [filterVisible, setFilterVisible] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);

  const MODAL_TEXT_COLOR = "#666";

  const router = useRouter();

  const { user, isSPU, isADM } = useAuth();
  // console.log(`UsersListScreen ----user`, user);
  // console.log(`UsersListScreen ----isSPU`, isSPU);

  const { data: users = [], isLoading, error } = useGetUsersQuery();
  // console.log(`UsersListScreen ----users`, users);

  const filteredUsers =
    roleFilter === "ALL" ? users : users.filter((u) => u.role === roleFilter);
  console.log(`UsersListScreen ----filteredUsers`, filteredUsers);

  if (isLoading) {
    return <Text style={styles.center}>Loading users...</Text>;
  }

  if (error) {
    return <Text style={styles.center}>Failed to load users</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.filterTrigger}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={{ color: "grey" }} variant="labelLarge">
            Filter: {roleFilter}
          </Text>
        </Pressable>
        <View style={styles.actions}>
          {isSPU && (
            <Button
              mode="contained"
              compact
              onPress={() => router.push("/admin/users/create-admin")}
              style={styles.actionBtn}
            >
              + Admin
            </Button>
          )}

          {(isSPU || isADM) && (
            <Button
              mode="contained"
              compact
              onPress={() => router.push("/admin/users/create-manager")}
              style={styles.actionBtn}
            >
              + Manager
            </Button>
          )}
        </View>
      </View>

      <FlashList
        data={filteredUsers}
        keyExtractor={(item) => item.auth.uid}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>
              {item.profile.name} {item.profile.surname}
            </Text>

            <Text style={styles.meta}>Role: {item.role}</Text>

            <Text style={styles.meta}>Org: {item.organization}</Text>

            <Text style={styles.meta}>
              Workbase:{" "}
              {item.access.activeWorkbase
                ? item.access.activeWorkbase
                : "Not selected"}
            </Text>

            <Text style={styles.status}>{item.onboarding.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.center}>No users found</Text>}
      />
      <Portal>
        <Modal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text
            variant="titleMedium"
            style={[styles.modalTitle, { color: MODAL_TEXT_COLOR }]}
          >
            Select Role Filter
          </Text>

          {["ALL", "SPU", "ADM", "MNG", "SPV", "FWR"].map((role) => (
            <List.Item
              key={role}
              title={role}
              titleStyle={{ color: MODAL_TEXT_COLOR }}
              onPress={() => {
                setRoleFilter(role);
                setFilterVisible(false);
              }}
              right={(props) =>
                role === roleFilter ? (
                  <List.Icon {...props} icon="check" />
                ) : null
              }
            />
          ))}

          <Button onPress={() => setFilterVisible(false)}>Cancel</Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  row: {
    paddingVertical: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: "#eee",
    backgroundColor: "#f6fed8ff",
    borderRadius: 5,
    marginVertical: 2,
    padding: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
    color: "#555",
  },
  status: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  filterTrigger: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f2f2f2",
    // marginBottom: 12,
  },

  modal: {
    backgroundColor: "white",
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },

  modalTitle: {
    marginBottom: 8,
  },
});
