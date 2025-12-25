import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useActiveWorkbase } from "../../src/hooks/useActiveWorkbase";

import GeoSelectorPanel from "../../components/maps/GeoCascadingSelector";
import MapContainer from "../../components/maps/MapContainer";

export default function MapsScreen() {
  console.log(" ");
  console.log(" ");
  console.log("MapsScreen ----SATART START");
  console.log("MapsScreen ----SATART START");
  const activeWorkbaseId = useActiveWorkbase();

  const [selection, setSelection] = useState({
    lm: null,
    town: null,
    ward: null,
    erf: null,
  });

  if (!activeWorkbaseId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" style={{ paddingVertical: 20 }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        lm={selection.lm}
        town={selection.town}
        ward={selection.ward}
        erf={selection.erf}
      />

      <GeoSelectorPanel
        activeWorkbaseId={activeWorkbaseId}
        onChange={setSelection}
      />
    </View>
  );
}
