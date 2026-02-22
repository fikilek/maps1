import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, View } from "react-native"; // 🎯 FIXED: View from react-native
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

export const TrnMiniMap = ({ gps }) => {
  // 🛡️ Added logs to catch the data in the console
  // console.log("MiniMap GPS Receiver:", gps);

  if (!gps?.lat || !gps?.lng) {
    console.log("📍 MiniMap: Missing Coordinates");
    return null;
  }

  return (
    <View style={styles.mapContainer}>
      <Text style={styles.sectionLabel}>LOCATION VERIFICATION</Text>
      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          scrollEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          initialRegion={{
            latitude: Number(gps.lat), // 🎯 Ensure it's a number
            longitude: Number(gps.lng),
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
        >
          <Marker
            coordinate={{
              latitude: Number(gps.lat),
              longitude: Number(gps.lng),
            }}
          >
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={30}
              color="#EF4444"
            />
          </Marker>
        </MapView>

        {/* 🎯 Badge moved INSIDE mapWrapper to respect 'absolute' positioning */}
        <View style={styles.gpsBadge}>
          <Text style={styles.gpsText}>
            {`${Number(gps.lat).toFixed(6)}, ${Number(gps.lng).toFixed(6)}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 🗺️ THE GEOGRAPHIC SIGNATURE CONTAINER
  mapContainer: {
    marginTop: 10,
    width: "100%",
  },

  // 🛰️ THE FRAME: Provides the "Sovereign" look
  mapWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 20, // 🎯 Matches our Card/Modal aesthetics
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F1F5F9", // Placeholder color while tiles load
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  // 🛡️ THE COORDINATE BADGE (The "Data Overlay")
  gpsBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(15, 23, 42, 0.85)", // 🎯 Dark "Glass" effect
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  gpsText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", // 🎯 Forensic Look
    letterSpacing: 0.5,
  },

  // 🎯 MAP SECTION LABEL
  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  // 🏹 PIN STYLE (If not using custom marker)
  customMarker: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
});
