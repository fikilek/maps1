import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector";
import MapContainer from "../../../components/maps/MapContainer";
import { useAuth } from "../../hooks/useAuth";
import {
  useGetLocalMunicipalityByIdQuery,
  useGetWardsByLocalMunicipalityQuery,
} from "../../redux/geoApi";

export default function MapsScreen() {
  const {
    activeWorkbase,
    activeWorkbaseId,
    isLoading: authLoading,
  } = useAuth();

  const [selection, setSelection] = useState({ lm: null, ward: null });

  // 1. Fetch the FULL LM document (This includes the geometry points)
  const { data: lmDetails } = useGetLocalMunicipalityByIdQuery(
    activeWorkbaseId,
    {
      skip: !activeWorkbaseId,
    }
  );

  // 2. Fetch the Wards
  const { data: wards = [] } = useGetWardsByLocalMunicipalityQuery(
    activeWorkbaseId,
    { skip: !activeWorkbaseId }
  );

  // Determine which LM object to use:
  // Priority: 1. Manual selection, 2. Full DB details (with geometry), 3. Auth fallback
  const displayLm = selection.lm || lmDetails || activeWorkbase;

  if (authLoading && !activeWorkbaseId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>Accessing Workbase...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        // Passing displayLm ensures that as soon as lmDetails loads,
        // the geometry is passed down to the BoundaryLayer
        lm={displayLm}
        ward={selection.ward}
        wards={wards}
      />

      <GeoCascadingSelector
        activeWorkbase={activeWorkbase}
        onChange={setSelection}
      />
    </View>
  );
}
