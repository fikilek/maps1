import { StyleSheet, View } from "react-native";
import FormInputMeterNo from "./FormInputMeterNo";

export const WaterMeterEntry = ({ disabled, liveLocation }) => {
  // const { setFieldValue, values } = useFormikContext();
  // const mediaPath = "ast.media.astNo"; // The target path
  // const photoUri = getIn(values, mediaPath);
  // const { profile } = useAuth();
  // const agentName = profile?.profile?.displayName || "Field Agent";

  // const [viewingUri, setViewingUri] = useState(null); // 🎯 For the full-screen view
  // console.log(`viewingUri`, viewingUri);

  // --- CAMERA & OVERLAY STATE (The NA Way) ---
  // const [showCamera, setShowCamera] = useState(false);
  // const [previewUri, setPreviewUri] = useState(null);
  // const [isCapturing, setIsCapturing] = useState(false);
  // const [permission, requestPermission] = useCameraPermissions();
  // const cameraRef = useRef(null);

  // const handleOpenScanner = async () => {
  //   if (!permission?.granted) {
  //     const { granted } = await requestPermission();
  //     if (!granted) return;
  //   }
  //   setShowCamera(true);
  // };

  // const handleCapture = async () => {
  //   if (cameraRef.current && !isCapturing) {
  //     setIsCapturing(true);
  //     try {
  //       const photo = await cameraRef.current.takePictureAsync({
  //         quality: 0.7,
  //       });
  //       setPreviewUri(photo.uri);
  //     } catch (e) {
  //       Alert.alert("Error", "Failed to take photo");
  //     } finally {
  //       setIsCapturing(false);
  //     }
  //   }
  // };

  // const acceptPhoto = () => {
  //   setFieldValue(mediaPath, previewUri);
  //   closeAll();
  // };

  // const closeAll = () => {
  //   setShowCamera(false);
  //   setPreviewUri(null);
  // };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.inputWrapper}>
          <FormInputMeterNo
            label="METER NUMBER"
            name="ast.astData.astNo"
            disabled={disabled}
          />
        </View>

        {/* <IconButton
          icon="camera"
          mode="contained"
          containerColor="#1E293B"
          iconColor="white"
          onPress={handleOpenScanner}
          disabled={disabled}
          style={styles.inlineMediaBtn}
        /> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ribbon: { marginTop: 10 },
  thumbWrapper: { width: 80, height: 80, position: "relative" },
  thumb: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  deleteBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    padding: 2,
  },
  modalFull: { flex: 1, margin: 0, backgroundColor: "black" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 40,
  },
  reticle: {
    width: 280,
    height: 200,
    borderWidth: 2,
    borderColor: "#00FF00",
    borderRadius: 20,
    marginTop: 40,
  },
  camControls: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  shutter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterIn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWeight: 2,
    borderColor: "#000",
  },
  reviewBar: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-evenly",
  },

  metadataOverlay: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD700", // Gold/Yellow for importance
  },
  metadataBrand: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingBottom: 4,
    marginBottom: 6,
  },
  brandText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  metaText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },

  previewContainer: {
    flex: 1,
    backgroundColor: "#111827", // Dark Slate background
    justifyContent: "center",
    alignItems: "center",
    padding: 20, // 🎯 This creates the margins for the image
  },
  previewImageStandard: {
    width: "100%",
    height: "75%", // 🎯 Leaves room for the bottom bar and top
    borderRadius: 12,
    backgroundColor: "#000",
  },
  watermarkBottomLeft: {
    position: "absolute",
    bottom: 120, // 🎯 Anchored above the review buttons
    left: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FFD700",
  },
  watermarkBrand: {
    color: "#FFD700",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  watermarkText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },

  viewerControls: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  dismissBtn: {
    width: "80%",
    borderRadius: 12,
    paddingVertical: 4,
  },

  container: {
    marginBottom: 20,
    width: "100%",
  },

  row: {
    flexDirection: "row",
    alignItems: "center", // 🎯 Start with center
    gap: 8,
    width: "100%",
    // If the buttons still look high, we use a "Nudge"
    paddingTop: 8,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  inlineMediaBtn: {
    height: 50,
    width: 50,
    borderRadius: 8,
    margin: 0,
    padding: 0,
    // 🎯 TACTICAL NUDGE:
    // If buttons are too high, increase this number.
    // If they are too low, decrease it.
    marginTop: 6,
  },
});

// {/* --- PHOTO RIBBON --- */}
// {photoUri && (
//   <View style={styles.ribbon}>
//     <View style={styles.thumbWrapper}>
//       <TouchableOpacity onPress={() => setViewingUri(photoUri)}>
//         <Image source={{ uri: photoUri }} style={styles.thumb} />
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={styles.deleteBadge}
//         onPress={() => setFieldValue(mediaPath, null)}
//       >
//         <MaterialCommunityIcons name="close" size={14} color="white" />
//       </TouchableOpacity>
//     </View>
//   </View>
// )}

// {/* --- CAMERA PORTAL (The NA Logic) --- */}
// <Portal>
//   <Modal
//     visible={showCamera}
//     onDismiss={closeAll}
//     contentContainerStyle={styles.modalFull}
//   >
//     {!previewUri ? (
//       <View style={{ flex: 1 }}>
//         <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
//         <View style={styles.overlay}>
//           <View style={styles.reticle} />
//           <View style={styles.camControls}>
//             <IconButton
//               icon="close"
//               iconColor="white"
//               size={30}
//               onPress={closeAll}
//             />
//             <TouchableOpacity
//               style={styles.shutter}
//               onPress={handleCapture}
//             >
//               {isCapturing ? (
//                 <ActivityIndicator color="#000" />
//               ) : (
//                 <View style={styles.shutterIn} />
//               )}
//             </TouchableOpacity>
//             <View style={{ width: 60 }} />
//           </View>
//         </View>
//       </View>
//     ) : (
//       // ... inside your Modal after the : (preview mode)
//       <View style={styles.previewContainer}>
//         <Image
//           source={{ uri: previewUri }} // 🎯 CHANGE THIS from photoUri to previewUri
//           style={styles.previewImageStandard} // 🎯 Ensure it uses the LARGE style
//           resizeMode="contain"
//         />

//         {/* 🎯 WATERMARK: Anchored Bottom-Left (NA Standard) */}
//         <View style={styles.watermarkBottomLeft} pointerEvents="none">
//           <Text style={styles.watermarkBrand}>FIELD EVIDENCE</Text>

//           <View style={styles.metaRow}>
//             <MaterialCommunityIcons
//               name="map-marker"
//               size={12}
//               color="#FFD700"
//             />
//             <Text style={styles.watermarkText}>
//               GPS:
//               {liveLocation
//                 ? `${liveLocation.lat.toFixed(6)}, ${liveLocation.lng.toFixed(6)}`
//                 : "SEARCHING SATELLITES..."}
//             </Text>
//           </View>

//           <View style={styles.metaRow}>
//             <MaterialCommunityIcons
//               name="home-city"
//               size={12}
//               color="#FFD700"
//             />
//             <Text style={styles.watermarkText}>
//               ERF: {values.erfNo || "N/A"}
//             </Text>
//           </View>

//           <View style={styles.metaRow}>
//             <MaterialCommunityIcons
//               name="account"
//               size={12}
//               color="#FFD700"
//             />
//             <Text style={styles.watermarkText}>USER: {agentName}</Text>
//           </View>

//           <View style={styles.metaRow}>
//             <MaterialCommunityIcons
//               name="clock-outline"
//               size={12}
//               color="#FFD700"
//             />
//             <Text style={styles.watermarkText}>
//               DATE: {new Date().toLocaleDateString()}{" "}
//               {new Date().toLocaleTimeString()}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.reviewBar}>
//           <Button
//             mode="contained"
//             buttonColor="#EF4444"
//             onPress={() => setPreviewUri(null)}
//             icon="camera-retake"
//           >
//             RETAKE
//           </Button>
//           <Button
//             mode="contained"
//             buttonColor="#22C55E"
//             onPress={acceptPhoto}
//             icon="check"
//           >
//             ACCEPT
//           </Button>
//         </View>
//       </View>
//     )}
//   </Modal>

//   <Modal
//     visible={!!viewingUri}
//     onDismiss={() => setViewingUri(null)}
//     contentContainerStyle={styles.modalFull}
//   >
//     <View style={styles.previewContainer}>
//       {/* 🎯 1. Use viewingUri and the LARGE style */}
//       <Image
//         source={{ uri: viewingUri }} // 🎯 FIX: Use the state variable here
//         style={styles.previewImageStandard}
//         resizeMode="contain"
//       />

//       {/* 🎯 2. The Evidence Overlay */}
//       <View style={styles.watermarkBottomLeft} pointerEvents="none">
//         <Text style={styles.watermarkBrand}>PREVIEW EVIDENCE</Text>

//         {/* GPS ROW */}
//         <View style={styles.metaRow}>
//           <MaterialCommunityIcons
//             name="map-marker"
//             size={12}
//             color="#FFD700"
//           />
//           <Text style={styles.watermarkText}>
//             GPS:
//             {liveLocation
//               ? `${liveLocation.lat.toFixed(6)}, ${liveLocation.lng.toFixed(6)}`
//               : "SEARCHING SATELLITES..."}
//           </Text>
//         </View>

//         {/* ERF ROW */}
//         <View style={styles.metaRow}>
//           <MaterialCommunityIcons
//             name="home-city"
//             size={12}
//             color="#FFD700"
//           />
//           <Text style={styles.watermarkText}>
//             ERF: {values.erfNo || "N/A"}
//           </Text>
//         </View>

//         {/* USER ROW */}
//         <View style={styles.metaRow}>
//           <MaterialCommunityIcons
//             name="account"
//             size={12}
//             color="#FFD700"
//           />
//           <Text style={styles.watermarkText}>USER: {agentName}</Text>
//         </View>

//         {/* TIME ROW */}
//         <View style={styles.metaRow}>
//           <MaterialCommunityIcons
//             name="clock-outline"
//             size={12}
//             color="#FFD700"
//           />
//           <Text style={styles.watermarkText}>
//             TIME: {new Date().toLocaleDateString()}{" "}
//             {new Date().toLocaleTimeString()}
//           </Text>
//         </View>
//       </View>
//     </View>
//   </Modal>
// </Portal>
