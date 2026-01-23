import { CameraView, useCameraPermissions } from "expo-camera";
import { useFormikContext } from "formik";
import { useRef, useState } from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
} from "react-native-paper";

export const useAssetMedia = () => {
  const { setFieldValue } = useFormikContext();
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraVisible, setCameraVisible] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false); // 🎯 Track readiness
  const [activePath, setActivePath] = useState(null);

  const cameraRef = useRef(null);

  const takePhoto = async (path) => {
    setActivePath(path);
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setCameraVisible(true);
  };

  const handleCapture = async () => {
    // 🎯 Shield against capturing before ready or during processing
    if (cameraRef.current && isCameraReady && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6, // Slightly lower for faster field uploads
          skipProcessing: false,
        });
        setPreviewPhoto(photo.uri);
      } catch (e) {
        console.error("Capture Error", e);
        Alert.alert(
          "Camera Error",
          "Failed to capture image. Please try again.",
        );
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const acceptPhoto = () => {
    setFieldValue(activePath, previewPhoto);
    closeCamera();
  };

  const closeCamera = () => {
    setCameraVisible(false);
    setPreviewPhoto(null);
    setIsCameraReady(false);
  };

  const MediaPortal = () => (
    <Portal>
      <Modal
        visible={cameraVisible}
        onDismiss={closeCamera}
        contentContainerStyle={styles.fullModal}
      >
        {!previewPhoto ? (
          <View style={{ flex: 1 }}>
            {/* 🎯 CAMERA VIEW (No children allowed) */}
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              onCameraReady={() => setIsCameraReady(true)}
            />

            {/* 🎯 UI OVERLAY (Positioned Absolutely) */}
            <View style={styles.overlayContainer} pointerEvents="box-none">
              <View style={styles.reticle} />
              <Text style={styles.overlayText}>ALIGN ASSET CLEARLY</Text>

              <View style={styles.cameraControls}>
                <IconButton
                  icon="close"
                  iconColor="white"
                  size={30}
                  onPress={closeCamera}
                />

                <TouchableOpacity
                  style={[
                    styles.shutterBtn,
                    !isCameraReady && { opacity: 0.5 },
                  ]}
                  onPress={handleCapture}
                  disabled={!isCameraReady || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <View style={styles.shutterInner} />
                  )}
                </TouchableOpacity>

                <View style={{ width: 60 }} />
              </View>
            </View>
          </View>
        ) : (
          /* --- REVIEW MODE --- */
          <View style={styles.previewContainer}>
            <Image source={{ uri: previewPhoto }} style={styles.previewImage} />
            <View style={styles.reviewBar}>
              <Button
                mode="contained"
                buttonColor="#EF4444"
                onPress={() => setPreviewPhoto(null)}
                icon="camera-retake"
              >
                DISCARD
              </Button>
              <Button
                mode="contained"
                buttonColor="#22C55E"
                onPress={acceptPhoto}
                icon="check-bold"
              >
                ACCEPT
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );

  return { takePhoto, MediaPortal };
};

const styles = StyleSheet.create({
  fullModal: { flex: 1, backgroundColor: "black", margin: 0 },
  // 🎯 This container allows the UI to sit on top of the camera
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 50,
    zIndex: 10,
  },
  reticle: {
    width: 280,
    height: 200,
    borderWidth: 2,
    borderColor: "#34D399",
    borderRadius: 15,
    marginTop: "20%",
  },
  cameraControls: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 20,
  },
  // ... (keep shutterBtn and other styles as before)
});

// export const useAssetMedia = () => {
//   const { setFieldValue, values } = useFormikContext();
//   const [permission, requestPermission] = useCameraPermissions();

//   // Internal UI State
//   const [cameraVisible, setCameraVisible] = useState(false);
//   const [previewPhoto, setPreviewPhoto] = useState(null); // The "Review" state
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [activePath, setActivePath] = useState(null);

//   const cameraRef = useRef(null);

//   const takePhoto = async (path) => {
//     setActivePath(path);
//     if (!permission?.granted) {
//       const { granted } = await requestPermission();
//       if (!granted) {
//         Alert.alert(
//           "Permission Required",
//           "We need camera access to capture assets.",
//         );
//         return;
//       }
//     }
//     setCameraVisible(true);
//   };

//   const handleCapture = async () => {
//     if (cameraRef.current) {
//       setIsProcessing(true);
//       try {
//         const photo = await cameraRef.current.takePictureAsync({
//           quality: 0.7,
//           base64: true,
//         });
//         setPreviewPhoto(photo.uri); // Move to Review Standard
//       } catch (e) {
//         console.error("Capture Error", e);
//       } finally {
//         setIsProcessing(false);
//       }
//     }
//   };

//   const acceptPhoto = () => {
//     // Inject into Formik at the specific path (e.g., ast.media.astNo)
//     setFieldValue(activePath, previewPhoto);
//     closeCamera();
//   };

//   const closeCamera = () => {
//     setCameraVisible(false);
//     setPreviewPhoto(null);
//     setActivePath(null);
//   };

//   // 🏛️ The "NA Standard" Overlay & Review UI
//   const MediaPortal = () => (
//     <Portal>
//       <Modal
//         visible={cameraVisible}
//         onDismiss={closeCamera}
//         contentContainerStyle={styles.fullModal}
//       >
//         {!previewPhoto ? (
//           // --- CAMERA MODE ---
//           <CameraView ref={cameraRef} style={styles.camera}>
//             <View style={styles.overlay}>
//               <View style={styles.reticle} />
//               <Text style={styles.overlayText}>CENTER METER IN FRAME</Text>

//               <View style={styles.cameraControls}>
//                 <IconButton
//                   icon="close"
//                   iconColor="white"
//                   size={30}
//                   onPress={closeCamera}
//                 />
//                 <TouchableOpacity
//                   style={styles.shutterBtn}
//                   onPress={handleCapture}
//                 >
//                   {isProcessing ? (
//                     <ActivityIndicator color="#000" />
//                   ) : (
//                     <View style={styles.shutterInner} />
//                   )}
//                 </TouchableOpacity>
//                 <View style={{ width: 60 }} />
//               </View>
//             </View>
//           </CameraView>
//         ) : (
//           // --- REVIEW MODE (The "NA" Standard) ---
//           <View style={styles.previewContainer}>
//             <Image source={{ uri: previewPhoto }} style={styles.previewImage} />
//             <View style={styles.reviewBar}>
//               <Button
//                 mode="contained"
//                 buttonColor="#EF4444"
//                 onPress={() => setPreviewPhoto(null)}
//                 icon="camera-retake"
//                 style={styles.reviewBtn}
//               >
//                 DISCARD
//               </Button>
//               <Button
//                 mode="contained"
//                 buttonColor="#22C55E"
//                 onPress={acceptPhoto}
//                 icon="check-bold"
//                 style={styles.reviewBtn}
//               >
//                 ACCEPT
//               </Button>
//             </View>
//           </View>
//         )}
//       </Modal>
//     </Portal>
//   );

//   return { takePhoto, MediaPortal };
// };

// const styles = StyleSheet.create({
//   fullModal: { flex: 1, backgroundColor: "black", margin: 0 },
//   camera: { flex: 1 },
//   overlay: {
//     flex: 1,
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 40,
//   },
//   reticle: {
//     width: 280,
//     height: 280,
//     borderWidth: 2,
//     borderColor: "#34D399",
//     borderStyle: "dashed",
//     borderRadius: 20,
//   },
//   overlayText: {
//     color: "white",
//     fontWeight: "bold",
//     backgroundColor: "rgba(0,0,0,0.5)",
//     padding: 8,
//     borderRadius: 5,
//   },
//   cameraControls: {
//     flexDirection: "row",
//     width: "100%",
//     justifyContent: "space-around",
//     alignItems: "center",
//   },
//   shutterBtn: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: "white",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   shutterInner: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 2,
//     borderColor: "#000",
//   },
//   previewContainer: { flex: 1, backgroundColor: "#000" },
//   previewImage: { flex: 1, resizeMode: "contain" },
//   reviewBar: {
//     flexDirection: "row",
//     justifyContent: "space-evenly",
//     padding: 20,
//     backgroundColor: "rgba(0,0,0,0.8)",
//   },
//   reviewBtn: { flex: 1, marginHorizontal: 10 },
// });

// import * as ImagePicker from "expo-image-picker";
// import { getIn, useFormikContext } from "formik";
// import { Alert } from "react-native";

// export const useAssetMedia = () => {
//   const { setFieldValue, values } = useFormikContext();

//   const takePhoto = async (path) => {
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission Denied", "We need camera access to take photos.");
//       return;
//     }

//     const result = await ImagePicker.launchCameraAsync({
//       allowsEditing: true,
//       quality: 0.7, // Optimized for Firestore upload
//     });

//     if (!result.canceled) {
//       const newPhoto = result.assets[0].uri;
//       const existingMedia = getIn(values, path) || [];
//       // We store as an array to allow multiple photos per field if needed
//       setFieldValue(path, [...existingMedia, newPhoto]);
//     }
//   };

//   const removePhoto = (path, uri) => {
//     const existingMedia = getIn(values, path) || [];
//     setFieldValue(
//       path,
//       existingMedia.filter((item) => item !== uri),
//     );
//   };

//   return { takePhoto, removePhoto };
// };
