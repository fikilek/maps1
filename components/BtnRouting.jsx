import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export default function BtnRouting({ destinationRoute, title }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        console.log("BtnRouting ----navigate on press", destinationRoute);
        router.replace(destinationRoute);
      }}
    >
      <Text style={{ color: "blue", fontWeight: "500" }}>{title}</Text>
    </Pressable>
  );
}
