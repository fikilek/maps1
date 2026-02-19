import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

const SelectedErf = ({ coordinate, erfNo }) => {
  // console.log(`SelectedErf ----mounted`);
  return (
    <Marker
      coordinate={coordinate}
      pinColor="blue" // Makes the pin blue
      // tracksViewChanges={false} // Optional: prevents blinking
      titleVisibility={"visible "}
      titel="ErfNo"
      anchor={{ x: 0.4, y: 0.3 }}
    >
      <View
        style={{
          backgroundColor: "white",
          padding: 2,
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
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  textContainer: {
    // marginTop: 40, // Position text below the marker (adjust as needed)
    alignItems: "center",
    position: "absolute",
    top: 45,
    // bottom: 45,
  },
  textBackground: {
    backgroundColor: "#4285F4",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    // position: "absolute",
    // top: 50,
    // bottom: 50,
    // zIndex: 200,
  },
  text: {
    // color: "white",
    fontSize: 10,
    // fontWeight: "bold",
    textAlign: "center",
  },
});

export default SelectedErf;
