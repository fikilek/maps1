import MapView from "react-native-maps";

export default function BaseMap({ mapRef, children }) {
  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider="google"
      initialRegion={{
        latitude: -33.9,
        longitude: 23.0,
        latitudeDelta: 0.6,
        longitudeDelta: 0.6,
      }}
    >
      {children} {/* ⬅️ THIS IS CRITICAL */}
    </MapView>
  );
}
