import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

const SelectedErf = ({ coordinate, erfNo, onPress }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [erfNo, coordinate?.latitude, coordinate?.longitude]);

  if (coordinate?.latitude == null || coordinate?.longitude == null) {
    return null;
  }

  return (
    <Marker
      key={`selected-erf-${erfNo}-${coordinate.latitude}-${coordinate.longitude}`}
      coordinate={coordinate}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.4, y: 0.3 }}
      zIndex={9999}
    >
      <View style={styles.label}>
        <Text style={styles.text}>{erfNo || "N/A"}</Text>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  label: {
    backgroundColor: "white",
    padding: 4,
    borderWidth: 1,
    borderColor: "blue",
    borderRadius: 4,
  },
  text: {
    fontSize: 8,
    textAlign: "center",
  },
});

export default SelectedErf;
