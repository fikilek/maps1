import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Button, Text } from "react-native-paper";
import GeoCascadingSelector from "../../components/maps/GeoCascadingSelector";
import { useActiveWorkbase } from "../hooks/useActiveWorkbase";
import { useGetWardsByLocalMunicipalityQuery } from "../redux/geoApi";

export default function MapsScreen() {
  console.log("MapsScreen ----START");

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

  useEffect(() => {
    console.log(` `);
    console.log("MapsScreen ----selection UPDATED", selection);
    console.log(` `);
  }, [selection]);

  const onChange = (partialSelection) => {
    console.log(` `);
    console.log("MapsScreen ----selection", selection);
    console.log(` `);

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
      <Button mode="contained">Test Paper</Button>
      <Text>Hello Paper</Text>

      {/* MAP */}
      {/* <MapContainer
        lm={selection.lm}
        ward={selection.ward}
        wards={wards} // ✅ PASS DATA
      /> */}

      {/* GEO SELECTOR PANEL */}
      <GeoCascadingSelector
        activeWorkbaseId={activeWorkbaseId}
        // onChange={setSelection}
        onChange={onChange}
      />
    </View>
  );
}
