import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGetAstByIdQuery } from "../../../src/redux/astsApi";

export default function AstMediaScreen() {
  const { id: docId, astNo } = useLocalSearchParams();
  const router = useRouter();

  // 🏛️ TARGETED STRIKE: Fetch the Asset directly
  const { data: asset, isLoading, isError } = useGetAstByIdQuery(docId);

  // 🎯 THE ARRAY: Pulling from ast.media
  const mediaList = asset?.media || [];

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Unlocking Evidence Locker...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 🏛️ METER IDENTITY HEADER */}
      <View style={styles.idHeader}>
        <View style={styles.accentBar} />
        <View>
          <Text style={styles.idLabel}>AST MEDIA</Text>
          <Text style={styles.idValue}>{astNo}</Text>
        </View>
        <MaterialCommunityIcons
          name="shield-check"
          size={32}
          color="#10B981"
          style={styles.shield}
        />
      </View>

      <View style={styles.grid}>
        {mediaList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="camera-off-outline"
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.emptyText}>No Visual Media for Asset</Text>
          </View>
        ) : (
          mediaList.map((photo, index) => (
            <View key={index} style={styles.photoCard}>
              <Image
                source={{ uri: photo.url }}
                style={styles.image}
                resizeMode="cover"
              />

              {/* 🏷️ TACTICAL TAG */}
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>
                  {photo.tag?.toUpperCase() || "UNTAGGED"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748B", fontWeight: "700" },

  idHeader: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  accentBar: {
    width: 4,
    height: 40,
    backgroundColor: "#3B82F6",
    marginRight: 16,
    borderRadius: 2,
  },
  idLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  idValue: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  shield: { marginLeft: "auto", opacity: 0.5 },

  grid: {
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoCard: {
    width: "100%",
    height: 500,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#FFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: { width: "100%", height: "100%" },
  tagBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { color: "#FFF", fontSize: 9, fontWeight: "900" },
  dateOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 8,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  dateText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  addMediaBtn: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    margin: 16,
    padding: 18,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  addMediaText: { color: "#FFF", fontWeight: "900", letterSpacing: 1 },
});
