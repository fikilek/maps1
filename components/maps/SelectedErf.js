import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

const SelectedErf = ({ coordinate, erfNo, onPress }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [erfNo]);

  return (
    <Marker
      coordinate={coordinate}
      pinColor="blue"
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.4, y: 0.3 }}
    >
      <View
        style={{
          backgroundColor: "white",
          padding: 4,
          borderWidth: 1,
          borderColor: "blue",
          borderRadius: 4,
        }}
      >
        <Text style={styles.text}>{erfNo}</Text>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 8,
    textAlign: "center",
  },
});

export default SelectedErf;
