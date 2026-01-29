import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IrepsCamera } from "./IrepsCamera";

export const IrepsMedia = ({ tag, agentName, agentUid }) => {
  const { values, setFieldValue } = useFormikContext();
  const [isPreviewVisible, setIsPreviewVisible] = useState(false); // 🎯 State for full-screen toggle

  const capturedPhoto = (values?.accessData?.media || []).find(
    (m) => m?.tag === tag,
  );

  const removeImage = () => {
    const newMedia = (values?.accessData?.media || []).filter(
      (m) => m?.tag !== tag,
    );
    setFieldValue("accessData.media", newMedia);
  };

  return (
    <View style={styles.container}>
      {/* LEFT: The Camera Button */}
      <View style={styles.cameraBox}>
        <IrepsCamera tag={tag} agentName={agentName} agentUid={agentUid} />
      </View>

      {/* RIGHT: The Forensic Ribbon */}
      <View style={styles.ribbonSlot}>
        {capturedPhoto ? (
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => setIsPreviewVisible(true)} // 🎯 Open Full Screen
            activeOpacity={0.8}
          >
            <Image
              key={capturedPhoto?.uri}
              source={{ uri: capturedPhoto?.uri }}
              style={styles.thumbnail}
            />

            <View style={styles.infoArea}>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="tag" size={12} color="#34D399" />
                <Text style={styles.tagText}> {tag}</Text>
              </View>
              <Text style={styles.statusText}>FORENSIC CAPTURE OK</Text>
              <Text style={styles.timeText}>
                {capturedPhoto?.created?.at
                  ? new Date(capturedPhoto.created.at).toLocaleTimeString()
                  : "--:--"}
              </Text>
            </View>

            <TouchableOpacity onPress={removeImage} style={styles.deleteBtn}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#EF4444"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              NO {tag?.toUpperCase()} CAPTURED
            </Text>
          </View>
        )}
      </View>

      {/* 🎯 FULL SCREEN PREVIEW MODAL */}
      <Modal
        visible={isPreviewVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsPreviewVisible(false)}
      >
        <View style={styles.fullScreenContainer}>
          <Image
            source={{ uri: capturedPhoto?.uri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />

          {/* Close Overlay */}
          <TouchableOpacity
            style={styles.closePreviewBtn}
            onPress={() => setIsPreviewVisible(false)}
          >
            <MaterialCommunityIcons name="close-box" size={40} color="white" />
            <Text style={styles.closeText}>CLOSE PREVIEW</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... existing styles for container, cameraBox, etc. ...
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cameraBox: { flex: 0.2, alignItems: "center" },
  ribbonSlot: { flex: 0.8, marginLeft: 10 },
  photoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 6,
    height: 90,
  },
  thumbnail: { width: 65, height: 78, borderRadius: 6, resizeMode: "cover" },
  infoArea: { flex: 1, paddingLeft: 12, justifyContent: "center" },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  tagText: { color: "#34D399", fontSize: 10, fontWeight: "bold" },
  statusText: { color: "#ffffff", fontSize: 9, fontWeight: "600" },
  timeText: {
    color: "#94a3b8",
    fontSize: 8,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "white",
    borderRadius: 10,
  },
  placeholder: {
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },
  placeholderText: { fontSize: 9, color: "#64748b", fontWeight: "bold" },

  // 🎯 FULL SCREEN STYLES
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  closePreviewBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    alignItems: "center",
  },
  closeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: -5,
  },
});
