// app/(tabs)/maps/index.js
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector";
import MapContainer from "../../../components/maps/MapContainer";

export default function MapsScreen() {
  const [cameraRequestId, setCameraRequestId] = useState(0);

  return (
    <View style={styles.container}>
      {/* 🧩 LAYER 1: The Map occupies the top/middle */}
      <View style={styles.mapWrapper}>
        <MapContainer cameraRequestId={cameraRequestId} />
      </View>

      {/* 🧩 LAYER 2: The GCC stays at the bottom */}
      <View style={styles.controlsWrapper}>
        <GeoCascadingSelector
          onRefreshCamera={() => setCameraRequestId(Date.now())}
        />
      </View>
    </View>
  );
}

// app/(tabs)/maps/index.js

// app/(tabs)/maps/index.js

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapWrapper: {
    flex: 1,
  },
});
