import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { Button } from "react-native-paper";
import { useGeo } from "../context/GeoContext";
import { erfMemory } from "../storage/erfMemory";
import { geoMemory } from "../storage/geoMemory";
import { premiseMemory } from "../storage/premiseMemory";

export const HandleNuclearReset = () => {
  const { setGeoState } = useGeo();
  const router = useRouter();

  const handleNuclearReset = () => {
    Alert.alert(
      "☢️ Nuclear Reset",
      "This will permanently delete ALL local data (Erfs, Premises, and Geo metadata). This cannot be undone. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "WIPE EVERYTHING",
          style: "destructive",
          onPress: () => {
            erfMemory.clearAll();
            geoMemory.clearAll();
            premiseMemory.clearAll();
            setGeoState({
              selectedLm: null,
              selectedWard: null,
              selectedErf: null,
              selectedPremise: null,
              selectedMeter: null,
            });
            router.replace("/");
          },
        },
      ],
    );
  };

  return (
    <Button
      mode="contained"
      buttonColor="#dc2626"
      icon="trash-can"
      onPress={handleNuclearReset}
      style={{ margin: 10 }}
    >
      Nuclear Reset (Wipe MMKV)
    </Button>
  );
};
