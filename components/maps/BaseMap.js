import { StyleSheet } from "react-native";
import MapView from "react-native-maps";

export default function BaseMap({ mapRef, children }) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      mapType="standard"
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {children}
    </MapView>
  );
}
