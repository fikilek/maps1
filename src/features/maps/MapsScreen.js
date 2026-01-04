import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector";
import MapContainer from "../../../components/maps/MapContainer";
import { useActiveWorkbase } from "../../hooks/useActiveWorkbase";
import { useGetWardsByLocalMunicipalityQuery } from "../../redux/geoApi";

export default function MapsScreen() {
  console.log("MapsScreen ---- mounted");

  /* =========================
  ACTIVE WORKBASE (LM ID)
  ========================= */
  const activeWorkbaseId = useActiveWorkbase();
  // console.log("MapsScreen ----activeWorkbaseId", activeWorkbaseId);

  /* =========================
     GEO SELECTION STATE
  ========================= */
  const [selection, setSelection] = useState({
    lm: null,
    // town: null,
    ward: null,
    erf: null,
  });

  const { data: wards = [] } = useGetWardsByLocalMunicipalityQuery(
    activeWorkbaseId,
    {
      skip: !activeWorkbaseId,
    }
  );

  const onChange = (partialSelection) => {
    setSelection((prev) => ({
      ...prev,
      ...partialSelection,
    }));
  };

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
        ward={selection.ward}
        wards={wards} // ✅ PASS DATA
      />

      {/* GEO SELECTOR PANEL */}
      <GeoCascadingSelector
        activeWorkbaseId={activeWorkbaseId}
        onChange={onChange}
      />
    </View>
  );
}
