import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85; // 🎯 Gives a "hint" of the next photo

export default function IrepsMediaViewer({
  media = [],
  tags = [],
  address = "",
}) {
  // 🎯 Filter and Map 'url' to 'uri'
  const filteredMedia = media
    .filter((item) => tags.includes(item.tag))
    .map((item) => ({ ...item, uri: item?.url }));

  if (filteredMedia?.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="camera-off" size={24} color="#CBD5E1" />
        <Text style={styles.emptyText}>No Forensic Evidence Captured</Text>
      </View>
    );
  }

  // 🛡️ Reference for metadata (usually taken from the first photo in the series)
  const basePhoto = filteredMedia[0];
  // console.log(`IrepsMediaViewer --basePhoto`, basePhoto);
  // console.log(`basePhoto`, JSON.stringify(basePhoto, null, 2));

  const rawAt = basePhoto?.created?.at;
  // Check if it's the { __time__: "..." } object or a raw string
  const createdAt = rawAt?.__time__ || rawAt || new Date().toISOString();

  // const createdAt = basePhoto?.created?.at;

  const timeLabel = createdAt
    ? format(new Date(createdAt), "MMM dd, yyyy · HH:mm")
    : "N/A";
  const agentName = basePhoto?.created?.byUser || "Unknown Agent";

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12} // 🎯 Clean snapping logic
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {filteredMedia.map((photo, index) => (
          <View key={index} style={styles.cardWrapper}>
            <Image
              source={{ uri: photo.uri }}
              style={styles.fullImage}
              resizeMode="cover"
            />
            <View style={styles.tagOverlay}>
              <MaterialCommunityIcons
                name="camera-marker"
                size={14}
                color="#FFF"
              />
              <Text style={styles.tagText}>
                {photo.tag === "noAccessPhoto"
                  ? `EVIDENCE ${index + 1}: NO ACCESS`
                  : `${photo.tag.toUpperCase()} ${index + 1}`}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 📊 METADATA BLOCK (Anchored to the batch) */}
      <View style={styles.metaDataBlock}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={14}
            color="#64748B"
          />
          <Text style={styles.metaText}>{agentName}</Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color="#64748B"
          />
          <Text style={styles.metaText}>{timeLabel}</Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color="#64748B"
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  scrollContent: {
    paddingRight: 20, // 🎯 Space to allow the last card to feel finished
    gap: 12,
    marginTop: 8,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: 220,
    // borderRadius: 16,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fullImage: { width: "100%", height: "100%" },
  tagOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tagText: { color: "#FFF", fontSize: 10, fontWeight: "900", letterSpacing: 1 },

  metaDataBlock: {
    marginTop: 12,
    paddingHorizontal: 4,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
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
  emptyText: { fontSize: 11, color: "#94A3B8", fontWeight: "700" },
});

// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { format } from "date-fns";
// import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

// const { width } = Dimensions.get("window");

// export default function IrepsMediaViewer({
//   media = [],
//   tags = [],
//   address = "",
// }) {
//   // 🎯 Filter and Map 'url' to 'uri'
//   const filteredMedia = media
//     .filter((item) => tags.includes(item.tag))
//     .map((item) => ({ ...item, uri: item.url }));

//   if (filteredMedia.length === 0) {
//     return (
//       <View style={styles.emptyState}>
//         <MaterialCommunityIcons name="camera-off" size={24} color="#CBD5E1" />
//         <Text style={styles.emptyText}>No Forensic Evidence Captured</Text>
//       </View>
//     );
//   }

//   // 🛡️ Optimized for the Single-Photo Constraint
//   const photo = filteredMedia[0];
//   console.log(`photo`, photo);

//   // 🕒 Extracting Date (Handling the Firestore __time__ string)
//   const createdAt = photo.created?.at?.__time__ || photo.created?.at;
//   const timeLabel = createdAt
//     ? format(new Date(createdAt), "MMM dd, yyyy · HH:mm")
//     : "N/A";
//   const agentName = photo?.created?.byUser || "Unknown Agent";

//   return (
//     <View style={styles.container}>
//       <View style={styles.fullWidthWrapper}>
//         <Image
//           source={{ uri: photo.uri }}
//           style={styles.fullImage}
//           resizeMode="cover"
//         />
//         <View style={styles.tagOverlay}>
//           <MaterialCommunityIcons name="camera-check" size={14} color="#FFF" />
//           <Text style={styles.tagText}>
//             {photo.tag === "noAccessPhoto"
//               ? "EVIDENCE: NO ACCESS"
//               : photo.tag.toUpperCase()}
//           </Text>
//         </View>
//       </View>

//       {/* 📊 METADATA BLOCK */}
//       <View style={styles.metaDataBlock}>
//         <View style={styles.metaRow}>
//           <MaterialCommunityIcons
//             name="account-circle-outline"
//             size={14}
//             color="#64748B"
//           />
//           <Text style={styles.metaText}>{agentName}</Text>
//         </View>

//         <View style={styles.metaRow}>
//           <MaterialCommunityIcons
//             name="clock-outline"
//             size={14}
//             color="#64748B"
//           />
//           <Text style={styles.metaText}>{timeLabel}</Text>
//         </View>

//         <View style={styles.metaRow}>
//           <MaterialCommunityIcons
//             name="map-marker-outline"
//             size={14}
//             color="#64748B"
//           />
//           <Text style={styles.metaText} numberOfLines={1}>
//             {address}
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { width: "100%" },
//   fullWidthWrapper: {
//     width: "100%",
//     height: 220,
//     borderRadius: 16,
//     backgroundColor: "#F1F5F9",
//     overflow: "hidden",
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     marginTop: 8,
//   },
//   fullImage: { width: "100%", height: "100%" },
//   tagOverlay: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "rgba(15, 23, 42, 0.75)",
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 6,
//   },
//   tagText: { color: "#FFF", fontSize: 10, fontWeight: "900", letterSpacing: 1 },

//   // 🛡️ Styles for Metadata
//   metaDataBlock: {
//     marginTop: 10,
//     paddingHorizontal: 4,
//     gap: 4,
//   },
//   metaRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   metaText: {
//     fontSize: 12,
//     color: "#475569",
//     fontWeight: "600",
//   },

//   emptyState: {
//     height: 120,
//     backgroundColor: "#F8FAFC",
//     borderRadius: 16,
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderStyle: "dashed",
//     borderColor: "#CBD5E1",
//     gap: 8,
//   },
//   emptyText: { fontSize: 11, color: "#94A3B8", fontWeight: "700" },
// });
