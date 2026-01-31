import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

const CustomErf = ({ gps, text }) => {
  const markerRef = useRef(null);
  console.log(`CustomErf --new gps`, gps);

  // Force the callout to show when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.showCallout();
      }
    }, 1000); // Give map time to render

    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      ref={markerRef}
      coordinate={gps}
      // Remove pinColor when using custom view
      // pinColor="blue" // ← Remove this line
      tracksViewChanges={false}
      // Force callout to be visible
      title="Your Location" // Optional: Default title
      description="San Francisco, CA" // Optional: Default description
    >
      {/* Blue Dot - SIMPLER VERSION */}
      <View style={styles.blueDot} />
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  blueDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#be1e43", // iOS blue
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default CustomErf;
