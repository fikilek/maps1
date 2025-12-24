import { useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

const BtnRouting = (props) => {
  const { destinationRoute, title, color = "indigo" } = props;
  // console.log(`destinationRoute`, destinationRoute);
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        console.log(`Routing to: ${destinationRoute}`);
        router.push(destinationRoute);
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "bold", color: color }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default BtnRouting;
