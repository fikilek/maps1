import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import { useAuth } from "../../../../src/hooks/useAuth";

function StorageCard({ title, subtitle, icon, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardLeft}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={icon} size={24} color="#0f172a" />
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#94a3b8"
        />
      </Surface>
    </TouchableOpacity>
  );
}

export default function LocalStorageScreen() {
  const router = useRouter();
  const { isSPU, isADM, isMNG, isSPV, isFWR } = useAuth();

  const canViewStorage = isSPU || isADM || isMNG || isSPV || isFWR;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Local Storage",
          headerTitleStyle: { fontSize: 16, fontWeight: "900" },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Surface style={styles.heroCard} elevation={1}>
          <View style={styles.heroHeader}>
            <MaterialCommunityIcons
              name="database-cog-outline"
              size={22}
              color="#0f172a"
            />
            <Text style={styles.heroTitle}>Offline Storage Management</Text>
          </View>

          <Text style={styles.heroSubtitle}>
            Manage offline ward ERFs availability and queued form submissions.
          </Text>
        </Surface>

        {canViewStorage ? (
          <View style={styles.cardsWrap}>
            <StorageCard
              title="Ward ERFs Storage"
              subtitle="Ward ERFs sync & management"
              icon="map-search-outline"
              onPress={() =>
                router.push("/(tabs)/admin/storage/ward-erfs-sync")
              }
            />

            <StorageCard
              title="Forms Storage"
              subtitle="Offline forms submission queue"
              icon="file-document-outline"
              onPress={() =>
                router.push("/(tabs)/admin/storage/forms-submission-queue")
              }
            />
          </View>
        ) : (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text style={styles.emptyTitle}>Access Restricted</Text>
            <Text style={styles.emptySubtitle}>
              You do not have permission to view local storage tools.
            </Text>
          </Surface>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },

  cardsWrap: {
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  cardLeft: {
    marginRight: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
});
