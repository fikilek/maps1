import { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

function NeighbourhoodMeterMarkerBase({
  coordinate,
  isWater = false,
  isAnomaly = false,
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isWater, isAnomaly, coordinate?.latitude, coordinate?.longitude]);

  if (coordinate?.latitude == null || coordinate?.longitude == null) {
    return null;
  }

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.1, y: 0.1 }}
      zIndex={1200}
      tracksViewChanges={tracksViewChanges}
    >
      <View
        style={[
          styles.meterMarkerCircle,
          {
            backgroundColor: isWater ? "#3B82F6" : "#EAB308",
            borderColor: isAnomaly ? "#EF4444" : "#FFFFFF",
            borderWidth: isAnomaly ? 2 : 1,
          },
        ]}
      />
    </Marker>
  );
}

const areEqual = (prev, next) => {
  return (
    prev.isWater === next.isWater &&
    prev.isAnomaly === next.isAnomaly &&
    prev.coordinate?.latitude === next.coordinate?.latitude &&
    prev.coordinate?.longitude === next.coordinate?.longitude
  );
};

const NeighbourhoodMeterMarker = memo(NeighbourhoodMeterMarkerBase, areEqual);

NeighbourhoodMeterMarker.displayName = "NeighbourhoodMeterMarker";
export default NeighbourhoodMeterMarker;

const styles = StyleSheet.create({
  meterMarkerCircle: {
    width: 10,
    height: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
});
