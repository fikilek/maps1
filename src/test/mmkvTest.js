import { Alert, Button } from "react-native";
import { erfMemory } from "../storage/erfMemory";
import { premiseMemory } from "../storage/premiseMemory";

const MmkvTest = () => {
  const handleMmkv = () => {
    Alert.alert("MMKV Testt", [
      { text: "Cancel", style: "cancel" },
      {
        text: "WIPE EVERYTHING",
        style: "destructive",
        onPress: () => runStorageDiagnostic(),
      },
    ]);
  };

  const runStorageDiagnostic = () => {
    const targetLm = "ZA1048";
    const targetErfId = "W048C039000500000214000000";

    console.log(`🔍 [DIAGNOSTIC]: Checking Vaults for ${targetLm}`);

    // 1. Check Premises Vault
    const storedPremises = premiseMemory.getLmList(targetLm);
    const premiseExists = storedPremises.find((p) => p.erfId === targetErfId);

    console.log("-----------------------------------------");
    console.log(
      `🏠 [PREMISE VAULT]: Found ${storedPremises.length} premises total.`,
    );
    if (premiseExists) {
      console.log(
        `✅ SUCCESS: New Premise found in MMKV for Erf ${targetErfId}`,
      );
    } else {
      console.log(`❌ FAIL: New Premise NOT found in MMKV.`);
    }

    // 2. Check Erf Vault
    // Assuming erfMemory has a getErf function or similar
    const storedErfs = erfMemory.getErfs(targetLm); // Adjust based on your actual function name
    const targetErf = storedErfs?.metaEntries?.find(
      (e) => e.id === targetErfId,
    );

    console.log("-----------------------------------------");
    if (targetErf) {
      console.log(`📍 [ERF VAULT]: Erf ${targetErfId} located.`);
      console.log(`🔗 Linked Premises in Vault:`, targetErf.premises || "None");

      if (targetErf.premises?.includes(premiseExists?.id)) {
        console.log(
          "✅ SUCCESS: Erf in MMKV is correctly linked to the new Premise.",
        );
      } else {
        console.log("⚠️ WARNING: Erf exists but linking is missing in MMKV.");
      }
    } else {
      console.log(`❌ FAIL: Erf ${targetErfId} not found in MMKV cache.`);
    }
    console.log("-----------------------------------------");
  };

  return (
    <Button
      mode="contained"
      buttonColor="#0db6d8"
      icon="trash-can"
      onPress={handleMmkv}
      style={{ margin: 10 }}
      title="MMKV Test"
    >
      MMKV Test
    </Button>
  );
};

export default MmkvTest;
