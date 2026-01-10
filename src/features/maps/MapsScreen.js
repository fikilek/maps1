// src/features/maps/MapsScreen.js
import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector";
import MapContainer from "../../../components/maps/MapContainer";
import { useAuth } from "../../hooks/useAuth";

import { useGetErfsByWardQuery } from "../../redux/erfsApi";
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

  /* -------------------------
     SELECTION STATE (AUTHORITATIVE)
  -------------------------- */
  const [wardId, setWardId] = useState(null);
  const [erfId, setErfId] = useState(null);
  const [cameraRequestId, setCameraRequestId] = useState(0);

  /* -------------------------
     GEO DATA
  -------------------------- */
  const { data: lmDetails } = useGetLocalMunicipalityByIdQuery(
    activeWorkbaseId,
    { skip: !activeWorkbaseId }
  );
  // console.log(`MapsScreen ---lmDetails`, lmDetails);

  const { data: wards = [], isLoading: wardsLoading } =
    useGetWardsByLocalMunicipalityQuery(activeWorkbaseId, {
      skip: !activeWorkbaseId,
    });
  // console.log(`MapsScreen ---wards?.length`, wards?.length);

  const selectedWard = useMemo(
    () => wards.find((w) => w.id === wardId) || null,
    [wards, wardId]
  );
  // console.log(`MapsScreen ---selectedWard`, selectedWard);

  const wardPcode = selectedWard?.id ?? null;
  // console.log(`MapsScreen ---wardPcode`, wardPcode);

  /* -------------------------
  ERFS (FETCHED ONCE HERE)
  -------------------------- */
  const { data: erfs = [], isLoading: erfsLoading } = useGetErfsByWardQuery(
    wardPcode ? { wardPcode } : undefined,
    {
      skip: !wardPcode,
    }
  );
  // console.log(`MapsScreen ---erfs`, erfs);

  const safeErfs = useMemo(() => {
    if (!wardPcode) return [];
    return erfs;
  }, [wardPcode, erfs]);
  // console.log(`MapsScreen ---safeErfs`, safeErfs);

  const selectedErf = useMemo(() => {
    if (!erfId) return null;
    return safeErfs.find((e) => e.id === erfId) || null;
  }, [erfId, safeErfs]);
  // console.log(`MapsScreen ---selectedErf`, selectedErf);

  const displayLm = lmDetails || activeWorkbase;
  // console.log(`MapsScreen ---displayLm`, displayLm);

  if (authLoading && !activeWorkbaseId) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Accessing workbase…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        lm={displayLm}
        selectedWard={selectedWard}
        wards={wards}
        erfs={safeErfs}
        selectedErf={selectedErf}
        cameraRequestId={cameraRequestId}
      />

      <GeoCascadingSelector
        lm={displayLm}
        wards={wards}
        erfs={safeErfs}
        erfsLoading={erfsLoading}
        wardsLoading={wardsLoading}
        selectedWardId={wardId}
        selectedErfId={erfId}
        onSelectWard={(id) => {
          setWardId(id);
          setErfId(null);
          setCameraRequestId(Date.now());
        }}
        onSelectErf={(id) => {
          setErfId(id);
          setCameraRequestId(Date.now());
        }}
        onSelectMunicipality={() => {
          setWardId(null); // Clear ward
          setErfId(null); // Clear erf
          setCameraRequestId(Date.now()); // 🔥 Trigger the camera!
        }}
        onRefreshCamera={() => setCameraRequestId(Date.now())}
      />
    </View>
  );
}
