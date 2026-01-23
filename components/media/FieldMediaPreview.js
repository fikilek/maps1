import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getIn, useFormikContext } from "formik";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

export const FieldMediaPreview = ({ path }) => {
  const { values, setFieldValue } = useFormikContext();

  // 🎯 Get the specific photo from the nested path
  const photoUri = getIn(values, path);

  if (!photoUri) return null; // Keep UI clean if no photo exists

  const handleDelete = () => {
    setFieldValue(path, null);
  };

  return (
    <View style={styles.ribbonContainer}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: photoUri }} style={styles.thumbnail} />

        {/* 🎯 THE DELETE BADGE (Elite Control) */}
        <TouchableOpacity
          style={styles.deleteBadge}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={14} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ribbonContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    overflow: "visible", // 🎯 Crucial for the badge to hang off the edge
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  deleteBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444", // Danger Red
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
