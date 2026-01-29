import { CameraView, useCameraPermissions } from "expo-camera";
import { useFormikContext } from "formik";
import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ActivityIndicator,
  IconButton,
  Modal,
  Portal,
} from "react-native-paper";
import { useAuth } from "./useAuth";

export const useAssetMedia = () => {
  const auth = useAuth();

  const agentUid = auth?.user?.uid || "unknown_uid";
  const agentName = auth?.profile?.profile?.displayName || "Field Agent";

  const { setFieldValue, values } = useFormikContext();
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

  const acceptPhoto = (tag, gps) => {
    const forensicMedia = {
      tag: tag,
      uri: previewPhoto,
      url: null, // To be filled by Firebase upload later
      type: "image",
      gps: gps || { lat: 0, lng: 0 }, // Fallback if no lock
      created: {
        at: new Date().toISOString(),
        byUser: agentName, // Get from Auth context
        byUid: agentUid, // Get from Auth context
      },
    };

    // Push to the Master Formik Array
    setFieldValue("media", [...(values.media || []), forensicMedia]);
    closeCamera();
  };

  // const acceptPhoto = () => {
  //   setFieldValue(activePath, previewPhoto);
  //   closeCamera();
  // };

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
        // 🎯 Use full screen, no margins
        contentContainerStyle={{ flex: 1, backgroundColor: "black", margin: 0 }}
      >
        {/* 🎯 THE GATE: Only render the CameraView if we are visible AND not in preview */}

        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            // Important for some Android builds
            responsiveOrientationWhenInactive={true}
            onCameraReady={() => setIsCameraReady(true)}
          />

          {/* 🎯 THE OVERLAY: Put it AFTER the CameraView in the code */}
          <View style={styles.overlayContainer} pointerEvents="box-none">
            <View style={{ marginTop: 50 }}>
              <Text style={styles.overlayText}>ALIGN ASSET CLEARLY</Text>
            </View>

            <View style={styles.reticle} />

            <View style={styles.cameraControls}>
              <IconButton
                icon="close"
                iconColor="white"
                containerColor="rgba(0,0,0,0.5)"
                onPress={closeCamera}
              />

              <TouchableOpacity
                style={styles.shutterBtn}
                onPress={handleCapture}
                disabled={!isCameraReady}
              >
                <View style={styles.shutterInner}>
                  {isProcessing && <ActivityIndicator color="red" />}
                </View>
              </TouchableOpacity>

              <View style={{ width: 50 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
  return { takePhoto, MediaPortal };
};

const styles = StyleSheet.create({
  fullModal: {
    flex: 1,
    backgroundColor: "black",
    margin: 0,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between", // Pushes content to Top, Center, and Bottom
    alignItems: "center",
    paddingBottom: 40,
    zIndex: 10,
  },
  reticle: {
    width: 280,
    height: 200,
    borderWidth: 2,
    borderColor: "#34D399", // IREPS Green
    borderStyle: "dashed",
    borderRadius: 15,
  },
  overlayText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraControls: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
});

// const styles = StyleSheet.create({
//   fullModal: {
//     flex: 1,
//     backgroundColor: "black",
//     margin: 0,
//   },
//   overlayContainer: {
//     ...StyleSheet.absoluteFillObject, // 🎯 Sit on top of camera
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 60, // Give room for status bars
//     zIndex: 10,
//   },
//   reticle: {
//     width: 280,
//     height: 280,
//     borderWidth: 2,
//     borderColor: "#34D399",
//     borderStyle: "dashed",
//     borderRadius: 20,
//     marginTop: "20%",
//   },
//   overlayText: {
//     color: "white",
//     fontWeight: "bold",
//     backgroundColor: "rgba(0,0,0,0.5)",
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     overflow: "hidden",
//   },
//   cameraControls: {
//     flexDirection: "row",
//     width: "100%",
//     justifyContent: "space-around",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   shutterBtn: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "white",
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4.65,
//     elevation: 8,
//   },
//   shutterInner: {
//     width: 66,
//     height: 66,
//     borderRadius: 33,
//     borderWidth: 2,
//     borderColor: "#000",
//   },
//   previewContainer: { flex: 1, backgroundColor: "#000" },
//   previewImage: { flex: 1, resizeMode: "contain" },
//   reviewBar: {
//     flexDirection: "row",
//     justifyContent: "space-evenly",
//     paddingBottom: 40,
//     paddingTop: 20,
//     backgroundColor: "black",
//   },
// });

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

// const styles = StyleSheet.create({
//   fullModal: { flex: 1, backgroundColor: "black", margin: 0 },
//   // 🎯 This container allows the UI to sit on top of the camera
//   overlayContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 50,
//     zIndex: 10,
//   },
//   reticle: {
//     width: 280,
//     height: 200,
//     borderWidth: 2,
//     borderColor: "#34D399",
//     borderRadius: 15,
//     marginTop: "20%",
//   },
//   cameraControls: {
//     flexDirection: "row",
//     width: "100%",
//     justifyContent: "space-around",
//     alignItems: "center",
//     paddingBottom: 20,
//   },
// });

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
