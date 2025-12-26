import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import GeoCascadingSelector from "../../components/maps/GeoCascadingSelector";
import MapContainer from "../../components/maps/MapContainer";
import { useActiveWorkbase } from "../hooks/useActiveWorkbase";

export default function MapsScreen() {
  console.log("MapsScreen ----START");

  /* =========================
  ACTIVE WORKBASE (LM ID)
  ========================= */
  const activeWorkbaseId = useActiveWorkbase();
  console.log("MapsScreen ----activeWorkbaseId", activeWorkbaseId);

  /* =========================
     GEO SELECTION STATE
  ========================= */
  const [selection, setSelection] = useState({
    lm: null,
    town: null,
    ward: null,
    erf: null,
  });

  /* =========================
     HARD GUARD
  ========================= */
  if (!activeWorkbaseId) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <View style={{ flex: 1 }}>
      {/* MAP */}
      <MapContainer
        lm={selection.lm}
        town={selection.town}
        ward={selection.ward}
        erf={selection.erf}
      />

      {/* GEO SELECTOR PANEL */}
      <GeoCascadingSelector
        activeWorkbaseId={activeWorkbaseId}
        onChange={setSelection}
      />
    </View>
  );
}
