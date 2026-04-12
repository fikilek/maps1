import { MaterialCommunityIcons } from "@expo/vector-icons";
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
      anchor={{ x: 0.2, y: 0.2 }}
      zIndex={1200}
      tracksViewChanges={tracksViewChanges}
    >
      <View>
        <MaterialCommunityIcons
          name={isWater ? "water" : "lightning-bolt"}
          size={20}
          color={isWater ? "#3B82F6" : "#EAB308"}
        />
      </View>
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
