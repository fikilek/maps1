import { useFormikContext } from "formik";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

export const MediaRibbon = () => {
  const { values, setFieldValue } = useFormikContext();

  const removePhoto = (index) => {
    const updatedMedia = values.media.filter((_, i) => i !== index);
    setFieldValue("media", updatedMedia);
  };

  if (!values.media || values.media.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.ribbon}
    >
      {values.media.map((item, index) => (
        <View key={index} style={styles.thumbContainer}>
          <Image source={{ uri: item.uri }} style={styles.thumbnail} />
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
          <IconButton
            icon="close-circle"
            iconColor="#EF4444"
            size={20}
            style={styles.deleteBtn}
            onPress={() => removePhoto(index)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  ribbon: { marginVertical: 10, paddingLeft: 16 },
  thumbContainer: { marginRight: 12, position: "relative" },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  tagBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  tagText: { color: "white", fontSize: 10, fontWeight: "bold" },
  deleteBtn: { position: "absolute", top: -10, right: -10, margin: 0 },
});
