import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Marker } from "react-native-maps";

const SelectedMeter = ({
  isWater,
  meterNo,
  coordinates,
  shortAdr,
  erfNo,
  astId,
}) => {
  return (
    <Marker
      key={`ast-label-${astId}`}
      coordinate={coordinates}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={2000}
      // tracksViewChanges={false}
    >
      <View style={{ padding: 5 }}>
        <View
          style={{
            borderColor: isWater ? "#3B82F6" : "#EAB308",
            borderWidth: 0.5,
            padding: 2,
            borderRadius: 5,
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name={isWater ? "water" : "lightning-bolt"}
            size={15}
            color={isWater ? "#3B82F6" : "#EAB308"}
          />
          <Text style={{ fontSize: 8 }}>{meterNo}</Text>
          <Text style={{ fontSize: 5 }}>{shortAdr}</Text>
          <Text style={{ fontSize: 5 }}>{`Erf:${erfNo}`}</Text>
        </View>
      </View>
    </Marker>
  );
};

export default SelectedMeter;
