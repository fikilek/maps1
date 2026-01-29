import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export const FieldMediaPreview = ({ label, mediaObject, onCapture }) => {
  // Check states:
  // 1. No media yet
  // 2. Local only (Uploading/Pending)
  // 3. Synced (Has Cloud URL)

  const isSynced = !!mediaObject?.url;
  const isPending = !!mediaObject?.uri && !mediaObject?.url;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.previewBox,
          isPending && styles.borderPending,
          isSynced && styles.borderSynced,
        ]}
        onPress={onCapture}
      >
        {mediaObject?.uri || mediaObject?.url ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: mediaObject.url || mediaObject.uri }}
              style={[styles.image, isPending && { opacity: 0.6 }]}
            />

            {/* Visual Status Indicator */}
            <View style={styles.badgeContainer}>
              {isPending ? (
                <View style={styles.pendingBadge}>
                  <ActivityIndicator size={12} color="white" />
                  <Text style={styles.badgeText}>SYNCING</Text>
                </View>
              ) : (
                <View style={styles.syncedBadge}>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={14}
                    color="white"
                  />
                  <Text style={styles.badgeText}>SECURED</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons
              name="camera-plus"
              size={32}
              color="#94A3B8"
            />
            <Text style={styles.placeholderText}>CAPTURE EVIDENCE</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  previewBox: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  borderPending: { borderColor: "#F59E0B", borderStyle: "dotted" }, // Amber for pending
  borderSynced: { borderColor: "#22C55E", borderStyle: "solid" }, // Green for synced
  imageWrapper: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%", contentFit: "cover" },
  placeholder: { alignItems: "center" },
  placeholderText: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "700",
  },
  badgeContainer: { position: "absolute", bottom: 8, right: 8 },
  pendingBadge: {
    flexDirection: "row",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  syncedBadge: {
    flexDirection: "row",
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  badgeText: { color: "white", fontSize: 9, fontWeight: "900" },
});

// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { getIn, useFormikContext } from "formik";
// import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

// export const FieldMediaPreview = ({ path }) => {
//   const { values, setFieldValue } = useFormikContext();

//   // 🎯 Get the specific photo from the nested path
//   const photoUri = getIn(values, path);

//   if (!photoUri) return null; // Keep UI clean if no photo exists

//   const handleDelete = () => {
//     setFieldValue(path, null);
//   };

//   return (
//     <View style={styles.ribbonContainer}>
//       <View style={styles.imageWrapper}>
//         <Image source={{ uri: photoUri }} style={styles.thumbnail} />

//         {/* 🎯 THE DELETE BADGE (Elite Control) */}
//         <TouchableOpacity
//           style={styles.deleteBadge}
//           onPress={handleDelete}
//           activeOpacity={0.7}
//         >
//           <MaterialCommunityIcons name="close" size={14} color="white" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   ribbonContainer: {
//     marginTop: 8,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   imageWrapper: {
//     width: 80,
//     height: 80,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: "#E2E8F0",
//     overflow: "visible", // 🎯 Crucial for the badge to hang off the edge
//     position: "relative",
//   },
//   thumbnail: {
//     width: "100%",
//     height: "100%",
//     borderRadius: 10,
//   },
//   deleteBadge: {
//     position: "absolute",
//     top: -8,
//     right: -8,
//     backgroundColor: "#EF4444", // Danger Red
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 2,
//   },
// });
