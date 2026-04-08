import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.92;

function ForensicImageCard({ uri }) {
  const [imageHeight, setImageHeight] = useState(420);

  useEffect(() => {
    if (!uri) return;

    Image.getSize(
      uri,
      (imgWidth, imgHeight) => {
        if (!imgWidth || !imgHeight) return;

        const scaledHeight = (imgHeight / imgWidth) * CARD_WIDTH;
        setImageHeight(scaledHeight);
      },
      (error) => {
        console.warn("Could not resolve image size", error);
      },
    );
  }, [uri]);

  return (
    <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
      </View>
    </View>
  );
}

export default function IrepsMediaViewer({ media = [], tags = [] }) {
  const filteredMedia = media
    .filter((item) => tags.includes(item.tag))
    .map((item) => ({ ...item, uri: item?.url || item?.uri }));

  if (filteredMedia?.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="camera-off" size={24} color="#CBD5E1" />
        <Text style={styles.emptyText}>No Forensic Evidence Captured</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredMedia.map((photo, index) => (
          <ForensicImageCard key={index} uri={photo.uri} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },

  scrollContent: {
    gap: 12,
    marginTop: 8,
    paddingBottom: 20,
    alignItems: "center",
  },

  cardWrapper: {
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
  },

  imageWrap: {
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: "100%",
    height: "100%",
  },

  emptyState: {
    height: 120,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    gap: 8,
  },

  emptyText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
  },
});
