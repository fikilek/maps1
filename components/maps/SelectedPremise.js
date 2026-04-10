import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

const SelectedPremise = ({ coordinate, erfNo, adrLn1, adrLn2, premiseId }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    premiseId,
    erfNo,
    adrLn1,
    adrLn2,
    coordinate?.latitude,
    coordinate?.longitude,
  ]);

  return (
    <Marker
      key={`premise-marker-${premiseId}`}
      coordinate={coordinate}
      anchor={{ x: 0.4, y: 0.3 }}
      zIndex={6500}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.premiseMarkerContainer}>
        <View style={styles.premiseLabel}>
          <Text style={styles.premiseLabelText}>Erf:{erfNo}</Text>
          <Text style={styles.premiseLabelText}>{adrLn1}</Text>
          {!!adrLn2 && <Text style={styles.premiseLabelText}>{adrLn2}</Text>}
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
    ...StyleSheet.absoluteFillObject,
  },
  gcsOverlay: {
    position: "absolute",
    bottom: 30,
    left: 10,
    right: 10,
    zIndex: 10,
    elevation: 10,
  },
  markerText: {
    fontSize: 10,
    backgroundColor: "white",
  },

  premiseMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  markerPill: {
    borderColor: "#ffffff",
    shadowColor: "#622ea1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 6,
  },

  premiseCircle: {
    borderRadius: 15,
    backgroundColor: "#507adc",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#622ea1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 6,
  },
  premiseLabel: {
    backgroundColor: "#507adc",
    padding: 4,
    borderRadius: 4,
    // marginTop: 2,
  },
  premiseLabelText: {
    fontSize: 6,
    fontWeight: "500",
    color: "#ffffff",
  },
});

export default SelectedPremise;

// import { StyleSheet, Text, View } from "react-native";
// import { Marker } from "react-native-maps";

// const SelectedPremise = ({ coordinate, erfNo, adrLn1, adrLn2, premiseId }) => {
//   // console.log(`SelectedPremise ----coordinate`, coordinate);
//   return (
//     <Marker
//       key={`premise-marker-${premiseId}`}
//       coordinate={coordinate}
//       anchor={{ x: 0.4, y: 0.3 }}
//       zIndex={6500}
//       // tracksViewChanges={false}
//     >
//       <View style={styles.premiseMarkerContainer}>
//         <View style={styles.premiseLabel}>
//           <Text style={styles.premiseLabelText}>Erf:{erfNo}</Text>
//           <Text style={styles.premiseLabelText}>{`${adrLn1}`}</Text>
//         </View>
//       </View>
//     </Marker>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject, // 🎯 This makes the map the background
//   },
//   gcsOverlay: {
//     position: "absolute", // 🎯 This pulls the GCS out of the flex flow
//     bottom: 30, // 🎯 Anchors it to the bottom
//     left: 10,
//     right: 10,
//     zIndex: 10,
//     elevation: 10,
//   },
//   markerText: {
//     fontSize: 10,
//     backgroundColor: "white",
//   },

//   premiseMarkerContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   markerPill: {
//     borderColor: "#ffffff",
//     shadowColor: "#622ea1",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.5,
//     shadowRadius: 2,
//     elevation: 6,
//   },

//   premiseCircle: {
//     borderRadius: 15,
//     backgroundColor: "#507adc",
//     borderWidth: 2,
//     borderColor: "#ffffff",
//     shadowColor: "#622ea1",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.5,
//     shadowRadius: 2,
//     elevation: 6,
//   },
//   premiseLabel: {
//     backgroundColor: "#507adc",
//     padding: 8,
//     borderRadius: 4,
//     marginTop: 2,
//   },
//   premiseLabelText: {
//     fontSize: 6,
//     fontWeight: "500",
//     color: "#ffffff",
//   },
// });

// export default SelectedPremise;
