import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

const SelectedPremise = ({ coordinate, erfNo, adrLn1, adrLn2, premiseId }) => {
  // console.log(`SelectedPremise ----coordinate`, coordinate);
  return (
    <Marker
      key={`premise-marker-${premiseId}`}
      coordinate={coordinate}
      // 🎯 Anchor to the center-bottom
      // anchor={{ x: 0.5, y: 1 }}
      anchor={{ x: 0.4, y: 0.3 }}
      zIndex={1500}
      // tracksViewChanges={false}
    >
      <View style={styles.premiseMarkerContainer}>
        {/* 🔘 THE SOVEREIGN CIRCLE */}
        {/* <View style={styles.premiseCircle}>
          <MaterialCommunityIcons
            name="home-variant" // 🏠 Cleaner, less "noisy" icon
            size={22}
            color="#ffffff"
          />
        </View> */}

        {/* 🏷️ THE FLOATING LABEL (Below the circle) */}
        <View style={styles.premiseLabel}>
          <Text style={styles.premiseLabelText}>Erf:{erfNo}</Text>
          <Text style={styles.premiseLabelText}>{`${adrLn1}`}</Text>
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject, // 🎯 This makes the map the background
  },
  gcsOverlay: {
    position: "absolute", // 🎯 This pulls the GCS out of the flex flow
    bottom: 30, // 🎯 Anchors it to the bottom
    left: 10,
    right: 10,
    // On Android, the Map is very "greedy" with touches.
    // We must give the overlay a zIndex and Elevation to stay on top.
    zIndex: 10,
    elevation: 10,
  },
  markerText: {
    fontSize: 10,
    // fontWeight: "900",
    // color: "#1e293b",
    // marginLeft: 2,
    backgroundColor: "white",
  },

  premiseMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Erf Marker
  markerContainer: {
    // borderRadius: 15,
    // backgroundColor: "#507adc",
    // borderWidth: 2,
    // borderColor: "#ffffff",
    // // alignItems: "center",
    // // justifyContent: "center",
    // shadowColor: "#622ea1",
    // // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.5,
    // shadowRadius: 2,
    // elevation: 6,
  },
  markerPill: {
    // borderRadius: 15,
    // backgroundColor: "#507adc",
    // borderWidth: 2,
    borderColor: "#ffffff",
    // alignItems: "center",
    // justifyContent: "center",
    shadowColor: "#622ea1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 6,
  },

  // Premise Marker
  premiseCircle: {
    // width: 60,
    // height: 60,
    borderRadius: 15,
    backgroundColor: "#507adc",
    borderWidth: 2,
    borderColor: "#ffffff",
    // alignItems: "center",
    // justifyContent: "center",
    shadowColor: "#622ea1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 6,
  },
  premiseLabel: {
    backgroundColor: "#507adc",
    // paddingHorizontal: 2,
    // paddingVertical: 2,
    padding: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  premiseLabelText: {
    fontSize: 6,
    fontWeight: "500",
    color: "#ffffff",
    // alignSelf: "center",
    // textTransform: "uppercase",
  },
});

export default SelectedPremise;
