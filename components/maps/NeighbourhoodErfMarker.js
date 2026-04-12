import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

function NeighbourhoodErfMarkerBase({ coordinate, erfNo, onPress }) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  console.log(`NeighbourhoodErfMarker -- erfNo`, erfNo);

  useEffect(() => {
    setTracksViewChanges(true);

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [erfNo, coordinate?.latitude, coordinate?.longitude]);

  if (coordinate?.latitude == null || coordinate?.longitude == null) {
    return null;
  }

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
    >
      <View style={styles.neighborhoodLabel}>
        <Text style={styles.neighborhoodLabelText}>{erfNo || "N/A"}</Text>
      </View>
    </Marker>
  );
}

const areEqual = (prev, next) => {
  return (
    prev.erfNo === next.erfNo &&
    prev.coordinate?.latitude === next.coordinate?.latitude &&
    prev.coordinate?.longitude === next.coordinate?.longitude
  );
};

const NeighbourhoodErfMarker = memo(NeighbourhoodErfMarkerBase, areEqual);

NeighbourhoodErfMarker.displayName = "NeighbourhoodErfMarker";
export default NeighbourhoodErfMarker;

const styles = StyleSheet.create({
  neighborhoodLabel: {
    backgroundColor: "white",
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#94a3b8",
    elevation: 4,
  },
  neighborhoodLabelText: {
    fontSize: 8,
    fontWeight: "400",
    color: "#1e293b",
  },
});
