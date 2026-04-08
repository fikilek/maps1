import { useAuth } from "@/src/hooks/useAuth";
import { useGetServiceProvidersQuery } from "@/src/redux/spApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  const { profile, isSPU, isADM, isMNG, isSPV } = useAuth();
  const [viewMode, setViewMode] = useState("list");

  const {
    data: serviceProviders = [],
    isLoading,
    isFetching,
  } = useGetServiceProvidersQuery();

  const visibleServiceProviders = useMemo(() => {
    if (isSPU || isADM) {
      return serviceProviders;
    }

    const viewerSpId = profile?.employment?.serviceProvider?.id;

    if (!viewerSpId) {
      return [];
    }

    if (isMNG || isSPV) {
      const allowedSpIds = resolveVisibleServiceProviderIds(
        viewerSpId,
        serviceProviders,
      );

      return serviceProviders.filter((sp) => allowedSpIds.includes(sp.id));
    }

    return [];
  }, [serviceProviders, profile, isSPU, isADM, isMNG, isSPV]);

  const processedServiceProviders = useMemo(() => {
    return [...visibleServiceProviders]
      .map((serviceProvider) => {
        const children = visibleServiceProviders.filter(
          (otherServiceProvider) =>
            otherServiceProvider?.clients?.some(
              (client) => client?.id === serviceProvider?.id,
            ),
        );

        return {
          ...serviceProvider,
          childCount: children.length,
        };
      })
      .sort(
        (a, b) =>
          new Date(b?.metadata?.updatedAt || 0) -
          new Date(a?.metadata?.updatedAt || 0),
      );
  }, [visibleServiceProviders]);

  const renderServiceProviderCard = ({ item }) => (
    <Surface style={styles.card} elevation={1}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.spName}>
            {item?.profile?.tradingName || "NAv"}
          </Text>
          <Text style={styles.spReg}>
            {item?.profile?.registrationNumber || "NAv"}
          </Text>
        </View>

        <IconButton
          icon="pencil-outline"
          size={20}
          onPress={() => router.push(`/admin/service-providers/${item.id}`)}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="sitemap" size={16} color="#2563eb" />
          <Text style={styles.statText}>{item.childCount} Subs</Text>
        </View>

        <Badge style={styles.statusBadge}>{item?.status || "NAv"}</Badge>
      </View>

      <Divider style={styles.divider} />

      <Text style={styles.clientLabel}>ALLIED CLIENTS:</Text>
      <View style={styles.clientBox}>
        {(item?.clients || []).map((client, index) => (
          <View
            key={`${item.id}-${client?.id || client?.name || index}`}
            style={styles.clientChip}
          >
            <Text style={styles.clientChipText}>{client?.name || "NAv"}</Text>
          </View>
        ))}
      </View>
    </Surface>
  );

  const buildTree = (data) => {
    const map = {};

    data.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    const tree = [];

    data.forEach((item) => {
      const parentSp = item?.clients?.find((client) => map[client?.id]);

      if (parentSp) {
        map[parentSp.id].children.push(map[item.id]);
      } else {
        tree.push(map[item.id]);
      }
    });

    return tree;
  };

  const treeData = useMemo(
    () => buildTree(processedServiceProviders),
    [processedServiceProviders],
  );

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
                {node?.profile?.tradingName || "NAv"}
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

        {depth > 0 && (
          <Text style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
            Reporting to:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {node?.clients?.find((client) =>
                processedServiceProviders.some((sp) => sp.id === client?.id),
              )?.name || "NAv"}
            </Text>
          </Text>
        )}
      </Surface>

      {node.children &&
        node.children.map((child) => renderTreeItem(child, depth + 1))}
    </View>
  );

  if (isLoading || isFetching) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator animating={true} color="#2563eb" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SpsHeader
        title="Service Providers"
        subtitle={`${processedServiceProviders.length} Entities Enlisted`}
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
          data={processedServiceProviders}
          renderItem={renderServiceProviderCard}
          estimatedItemSize={150}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {treeData.map((node) => renderTreeItem(node))}
        </ScrollView>
      )}

      {(isSPU || isADM || isMNG) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/admin/service-providers/formCreateSp")}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.fabText}></Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function resolveVisibleServiceProviderIds(rootSpId, allServiceProviders = []) {
  const allowed = new Set([rootSpId]);
  const queue = [rootSpId];

  while (queue.length > 0) {
    const currentSpId = queue.shift();

    allServiceProviders.forEach((serviceProvider) => {
      const clients = serviceProvider?.clients || [];

      const isSubcOfCurrent = clients.some(
        (client) =>
          client?.clientType === "SP" &&
          client?.relationshipType === "SUBC" &&
          client?.id === currentSpId,
      );

      if (isSubcOfCurrent && !allowed.has(serviceProvider.id)) {
        allowed.add(serviceProvider.id);
        queue.push(serviceProvider.id);
      }
    });
  }

  return Array.from(allowed);
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

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

  spName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
  },

  spReg: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    alignItems: "center",
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },

  statusBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontWeight: "800",
  },

  divider: {
    marginVertical: 12,
    backgroundColor: "#f1f5f9",
  },

  clientLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#94a3b8",
    marginBottom: 8,
  },

  clientBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  clientChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  clientChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },

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

  fabText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
});
