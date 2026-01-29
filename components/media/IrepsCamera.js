import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFormikContext } from "formik";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, IconButton } from "react-native-paper";
import ViewShot from "react-native-view-shot";

export const IrepsCamera = ({ tag, agentName, agentUid }) => {
  const { values, setFieldValue } = useFormikContext();

  const [permission, requestPermission] = useCameraPermissions();
  const [isVisible, setIsVisible] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);

  const handleOpen = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setIsVisible(true);
  };

  const handleCapture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        setPreviewPhoto(photo.uri);
      } catch (e) {
        console.error("Capture Error", e);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFinalAccept = async () => {
    if (viewShotRef.current) {
      try {
        const finalUri = await viewShotRef.current.capture();
        const timestamp = new Date().toISOString();

        const forensicMedia = {
          tag: tag || "unlabeled",
          uri: finalUri,
          url: null,
          type: "image",
          gps: { lat: -33.9249, lng: 18.4241 },
          created: { at: timestamp, byUser: agentName, byUid: agentUid },
          updated: { at: timestamp, byUser: agentName, byUid: agentUid },
        };

        // 🎯 IMPROVED: Filter out any existing photo with the same tag before adding the new one
        const otherMedia = (values.accessData.media || []).filter(
          (m) => m.tag !== tag,
        );
        setFieldValue("accessData.media", [...otherMedia, forensicMedia]);

        setIsVisible(false);
        setPreviewPhoto(null);
      } catch (e) {
        console.error("Save Error", e);
      }
    }
  };

  // const handleFinalAccept = async () => {
  //   if (viewShotRef.current) {
  //     try {
  //       const finalUri = await viewShotRef.current.capture();
  //       const timestamp = new Date().toISOString();

  //       const forensicMedia = {
  //         tag: tag || "unlabeled",
  //         uri: finalUri,
  //         url: null,
  //         type: "image",
  //         gps: { lat: -33.9249, lng: 18.4241 }, // Standard Reference
  //         created: { at: timestamp, byUser: agentName, byUid: agentUid },
  //         updated: { at: timestamp, byUser: agentName, byUid: agentUid },
  //       };

  //       const currentMedia = values.media || [];
  //       setFieldValue("media", [...currentMedia, forensicMedia]);

  //       setIsVisible(false);
  //       setPreviewPhoto(null);
  //     } catch (e) {
  //       console.error("Save Error", e);
  //     }
  //   }
  // };

  return (
    <View>
      <IconButton
        icon="camera-plus"
        mode="contained"
        containerColor="#34D399"
        iconColor="white"
        size={28}
        onPress={handleOpen}
      />

      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.container}>
          {previewPhoto ? (
            <View style={styles.previewWrapper}>
              <ViewShot
                ref={viewShotRef}
                options={{ format: "jpg", quality: 0.8 }}
                style={styles.shotContainer}
              >
                <Image
                  source={{ uri: previewPhoto }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />

                {/* 🎯 RESTORED FORENSIC RIBBON */}
                <View style={styles.ribbon}>
                  <View style={styles.ribbonRow}>
                    <MaterialCommunityIcons
                      name="tag-outline"
                      size={14}
                      color="#34D399"
                    />
                    <Text
                      style={[
                        styles.ribbonText,
                        { color: "#34D399", fontWeight: "bold" },
                      ]}
                    >
                      {" "}
                      TAG: {tag}
                    </Text>
                  </View>

                  <View style={styles.ribbonRow}>
                    <View style={styles.ribbonItem}>
                      <MaterialCommunityIcons
                        name="account-circle-outline"
                        size={12}
                        color="white"
                      />
                      <Text style={styles.ribbonText}> {agentName}</Text>
                    </View>
                    <View style={[styles.ribbonItem, { marginLeft: 10 }]}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={12}
                        color="white"
                      />
                      <Text style={styles.ribbonText}>
                        {" "}
                        {new Date().toLocaleTimeString()}
                      </Text>
                    </View>
                  </View>

                  {/* GPS Line (One Line) */}
                  <View style={styles.ribbonRow}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={12}
                      color="#FBBF24"
                    />
                    <Text style={styles.ribbonText}>
                      {" "}
                      GPS: -33.9249 / 18.4241
                    </Text>
                  </View>
                </View>
              </ViewShot>

              <View style={styles.reviewBar}>
                <Button
                  mode="outlined"
                  textColor="white"
                  style={styles.reviewBtn}
                  onPress={() => setPreviewPhoto(null)}
                >
                  RETAKE
                </Button>
                <Button
                  mode="contained"
                  buttonColor="#34D399"
                  style={styles.reviewBtn}
                  onPress={handleFinalAccept}
                >
                  ACCEPT
                </Button>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
              />
              <View style={styles.overlayContainer} pointerEvents="box-none">
                <Text style={styles.guideText}>ALIGN {tag?.toUpperCase()}</Text>
                <View style={styles.reticle} />
                <View style={styles.bottomSection}>
                  <IconButton
                    icon="close"
                    iconColor="white"
                    containerColor="rgba(0,0,0,0.3)"
                    onPress={() => setIsVisible(false)}
                  />
                  <TouchableOpacity
                    style={styles.shutterBtn}
                    onPress={handleCapture}
                  >
                    <View style={styles.shutterInner}>
                      {isProcessing && <ActivityIndicator color="red" />}
                    </View>
                  </TouchableOpacity>
                  <View style={{ width: 60 }} />
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  previewWrapper: { flex: 1, padding: 20, justifyContent: "center" },
  shotContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: { flex: 1 },
  ribbon: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 10,
  },
  ribbonRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  ribbonItem: { flexDirection: "row", alignItems: "center" },
  ribbonText: {
    color: "white",
    fontSize: 10,
    fontFamily: Platform.OS === "android" ? "monospace" : "Courier",
  },
  reviewBar: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
  },
  reviewBtn: { flex: 0.48 },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
  },
  guideText: {
    color: "white",
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 20,
  },
  reticle: {
    width: 280,
    height: 240,
    borderWidth: 2,
    borderColor: "#34D399",
    borderStyle: "dashed",
    borderRadius: 20,
  },
  bottomSection: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  shutterBtn: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "black",
  },
});
