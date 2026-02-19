import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { Button } from "react-native-paper";
import { useDispatch } from "react-redux";
import { useGeo } from "../context/GeoContext";
import { astsApi } from "../redux/astsApi";
import { erfsApi } from "../redux/erfsApi";
import { premisesApi } from "../redux/premisesApi";
import { erfMemory } from "../storage/erfMemory";
import { geoMemory } from "../storage/geoMemory";
import { premiseMemory } from "../storage/premiseMemory";

export const HandleNuclearReset = () => {
  const { updateGeo } = useGeo(); // 🎯 Swap setGeoState for updateGeo
  const router = useRouter();
  const dispatch = useDispatch();

  const handleNuclearReset = () => {
    Alert.alert(
      "☢️ Nuclear Reset",
      "This will permanently delete ALL local data. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "WIPE EVERYTHING",
          style: "destructive",
          onPress: () => {
            console.log("☢️ [NUCLEAR]: Initiating wipe...");

            // 1. CLEAR REDUX CACHE (RAM)
            dispatch(erfsApi.util.resetApiState());
            dispatch(premisesApi.util.resetApiState());
            dispatch(astsApi.util.resetApiState());

            // 2. CLEAR CONTEXT (Using the Doctrine)
            // We use updateGeo with nulls. This ensures the flight signal
            // clears and all cascade rules in the provider run.
            updateGeo({
              selectedLm: null,
              selectedWard: null,
              selectedErf: null,
              selectedPremise: null,
              selectedMeter: null,
              lastSelectionType: null, // 🛡️ Stops the Pilot from trying to fly
            });

            // 3. WIPE MMKV (DISK)
            erfMemory.clearAll();
            geoMemory.clearAll();
            premiseMemory.clearAll();

            console.log("✅ [NUCLEAR]: Disk and RAM zeroed out.");

            // 4. EJECT & REBOOT
            // router.replace("/") is good, but sometimes a full refresh is safer
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
