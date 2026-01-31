import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

const SelectedErf = ({ coordinate, erfNo }) => {
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

// import { StyleSheet } from "react-native";
// import { Marker } from "react-native-maps";

// const SelectedErf = ({ gps, erfNo }) => {
//   console.log(`SelectedErf ---gps`, gps);
//   return (
//     <Marker
//       coordinate={gps}
//       // tracksViewChanges={false} // Prevents blinking
//       // anchor={{ x: 0, y: 1 }} // Bottom-left corner
//     >
//       {/* Blue dot at the GPS point */}
//       {/* <View style={styles.blueDot}>
//         <View style={styles.innerWhiteDot} />
//       </View> */}

//       {/* Text label anchored to bottom-left of blue dot */}
//       {/* <View style={styles.textContainer}>
//         <View style={styles.textBackground}>
//           <Text style={styles.text}>{erfNo}</Text>
//         </View>
//       </View> */}
//     </Marker>
//   );
// };

// const styles = StyleSheet.create({
//   blueDot: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: "#4285F4", // Google blue
//     borderWidth: 3,
//     borderColor: "white",
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//     elevation: 4,
//     // position: "absolute",
//     // top: -10, // Adjust to position relative to text
//     // left: -10,
//   },
//   innerWhiteDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "white",
//   },
//   textContainer: {
//     // position: "absolute",
//     // top: 10, // Position text below the dot
//     // left: 10,
//   },
//   textBackground: {
//     backgroundColor: "#4285F4",
//     borderRadius: 4,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderWidth: 2,
//     borderColor: "white",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 3,
//   },
//   text: {
//     color: "white",
//     fontSize: 14,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
// });

// export default SelectedErf;
