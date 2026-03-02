import { useRouter } from "expo-router";
import { useRef } from "react";
import { Alert } from "react-native";
import { Button } from "react-native-paper";
import { useDispatch } from "react-redux";

import { useGeo } from "../context/GeoContext";
import { reduxKV } from "../redux/mmkv";
import { persistor } from "../redux/store";

import { astsApi } from "../redux/astsApi";
import { authApi } from "../redux/authApi";
import { erfsApi } from "../redux/erfsApi";
import { geoApi } from "../redux/geoApi";
import { premisesApi } from "../redux/premisesApi";
import { salesApi } from "../redux/salesApi";
import { settingsApi } from "../redux/settingsApi";
import { spApi } from "../redux/spApi";
import { trnsApi } from "../redux/trnsApi";
import { usersApi } from "../redux/usersApi";

export const HandleNuclearReset = () => {
  const { resetGeo } = useGeo();
  const router = useRouter();
  const dispatch = useDispatch();
  const wipingRef = useRef(false);

  const doWipe = async () => {
    if (wipingRef.current) return;
    wipingRef.current = true;

    try {
      console.log("☢️ [FRESH-SLATE]: Starting wipe...");

      // 🧠 Stop persistence while wiping
      persistor.pause();
      await persistor.flush();

      // 🔥 Clear RTK Query RAM
      dispatch(erfsApi.util.resetApiState());
      dispatch(premisesApi.util.resetApiState());
      dispatch(astsApi.util.resetApiState());
      dispatch(trnsApi.util.resetApiState());
      dispatch(usersApi.util.resetApiState());
      dispatch(salesApi.util.resetApiState());
      dispatch(settingsApi.util.resetApiState());
      dispatch(spApi.util.resetApiState());
      dispatch(geoApi.util.resetApiState());
      dispatch(authApi.util.resetApiState());

      // 🌍 Reset Geo Context
      resetGeo();

      // 💾 Remove persisted Redux state
      await persistor.purge();

      // 💣 HARD WIPE MMKV (SAFE in your app)
      reduxKV.clearAll();

      // ▶️ Resume persistence
      persistor.persist();

      console.log("✅ [FRESH-SLATE]: Completed.");

      router.replace("/");
    } catch (e) {
      console.error("❌ Reset failed:", e);
      Alert.alert("Reset failed", String(e?.message || e));
    } finally {
      wipingRef.current = false;
    }
  };

  return (
    <Button
      mode="contained"
      buttonColor="#dc2626"
      icon="trash-can"
      onPress={() =>
        Alert.alert(
          "☢️ Fresh Slate Reset",
          "This will wipe ALL local data. Proceed?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "WIPE EVERYTHING", style: "destructive", onPress: doWipe },
          ],
        )
      }
      style={{ margin: 10 }}
    >
      Fresh Slate Reset
    </Button>
  );
};
