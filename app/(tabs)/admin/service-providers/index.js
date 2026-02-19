import { useAuth } from "@/src/hooks/useAuth";
import { useGetServiceProvidersQuery } from "@/src/redux/spApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Badge, Divider, IconButton, Surface } from "react-native-paper";
import { SpsHeader } from "../../../../src/features/sps/spsHeader";

export default function ServiceProvidersListScreen() {
  const router = useRouter();
  const { isSPU, isADM, isMNG } = useAuth();
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'tree'

  const { data: sps = [], isLoading } = useGetServiceProvidersQuery();

  // 🛡️ REFIED LOGIC: Calculating children and user counts
  const processedSPs = useMemo(() => {
    return [...sps]
      .map((sp) => {
        // Find children (Who lists THIS SP as their client?)
        const children = sps.filter((other) =>
          other.clients?.some((c) => c.id === sp.id),
        );

        return {
          ...sp,
          childCount: children.length,
          // For now, placeholder for user counts until we link the user registry
          userCount: Math.floor(Math.random() * 10),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.metadata?.createAt || 0) -
          new Date(a.metadata?.createAt || 0),
      );
  }, [sps]);

  const renderSPCard = ({ item }) => (
    <Surface style={styles.card} elevation={1}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.spName}>{item.profile.tradingName}</Text>
          <Text style={styles.spReg}>{item.profile.tradingNumber}</Text>
        </View>
        <IconButton
          icon="pencil-outline"
          size={20}
          onPress={() => router.push(`/admin/service-providers/${item.id}`)}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="account-group"
            size={16}
            color="#64748b"
          />
          <Text style={styles.statText}>{item.userCount} Users</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="sitemap" size={16} color="#2563eb" />
          <Text style={styles.statText}>{item.childCount} Subs</Text>
        </View>
        <Badge style={styles.statusBadge}>{item.status}</Badge>
      </View>

      <Divider style={styles.divider} />

      <Text style={styles.clientLabel}>ALLIED CLIENTS:</Text>
      <View style={styles.clientBox}>
        {item.clients?.map((client) => (
          <View key={client.id} style={styles.clientChip}>
            <Text style={styles.clientChipText}>{client.name}</Text>
          </View>
        ))}
      </View>
    </Surface>
  );

  // 1. First, we need a helper to organize the data into a hierarchy
  const buildTree = (data) => {
    const map = {};
    data.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    const tree = [];
    data.forEach((item) => {
      // Check if this SP has a client that is ALSO in our SP registry
      const parentSp = item.clients?.find((client) => map[client.id]);

      if (parentSp) {
        map[parentSp.id].children.push(map[item.id]);
      } else {
        // If no parent SP is found, this is a Root/MNC entity (like Rste)
        tree.push(map[item.id]);
      }
    });
    return tree;
  };

  // 2. In your component, use this logic
  const treeData = useMemo(() => buildTree(processedSPs), [processedSPs]);

  // 3. The Tree Renderer (Indented Cards)
  const renderTreeItem = (node, depth = 0) => (
    <View key={node.id}>
      <Surface
        style={[
          styles.card,
          {
            marginLeft: depth * 24,
            borderLeftWidth: depth > 0 ? 4 : 0,
            borderLeftColor: "#2563eb",
          },
        ]}
        elevation={depth === 0 ? 1 : 0}
      >
        <View style={styles.cardHeader}>
          <View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {depth > 0 && (
                <MaterialCommunityIcons
                  name="subdirectory-arrow-right"
                  size={16}
                  color="#2563eb"
                />
              )}
              <Text
                style={[styles.spName, { fontSize: depth === 0 ? 18 : 15 }]}
              >
                {node.profile.tradingName}
              </Text>
            </View>
            <Text style={styles.spReg}>
              {depth === 0 ? "MNC / LEAD" : `SUB-CONTRACTOR LEVEL ${depth}`}
            </Text>
          </View>
          <IconButton
            icon="pencil-outline"
            size={18}
            onPress={() => router.push(`/admin/service-providers/${node.id}`)}
          />
        </View>

        {/* Show Client name only if it's a Sub */}
        {depth > 0 && (
          <Text style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
            Reporting to:{" "}
            <Text style={{ fontWeight: "bold" }}>{node.clients[0]?.name}</Text>
          </Text>
        )}
      </Surface>

      {/* Recursively render children */}
      {node.children &&
        node.children.map((child) => renderTreeItem(child, depth + 1))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 🎯 HEADER COMMAND */}

      <SpsHeader
        title="Service Providers"
        subtitle={`${processedSPs.length} Entities Enlisted`}
        showBack={true}
        actions={
          <>
            <IconButton
              icon="format-list-bulleted"
              onPress={() => setViewMode("list")}
            />
            <IconButton
              icon="family-tree"
              onPress={() => setViewMode("tree")}
            />
          </>
        }
      />

      {viewMode === "list" ? (
        <FlashList
          data={processedSPs}
          renderItem={renderSPCard}
          estimatedItemSize={150}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {treeData.map((node) => renderTreeItem(node))}
        </ScrollView>
      )}

      {/* 🎯 NICE ADD BUTTON */}
      {(isSPU || isADM || isMNG) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/admin/service-providers/createSp")}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.fabText}></Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  headerActions: { flexDirection: "row" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  spName: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  spReg: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    alignItems: "center",
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  statusBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontWeight: "800",
  },
  divider: { marginVertical: 12, backgroundColor: "#f1f5f9" },
  clientLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#94a3b8",
    marginBottom: 8,
  },
  clientBox: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  clientChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clientChipText: { fontSize: 10, fontWeight: "700", color: "#475569" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
    gap: 8,
  },
  fabText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
