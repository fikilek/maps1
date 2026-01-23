import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { useGeo } from "../../context/GeoContext";
import {
  useGetLocalMunicipalityByIdQuery,
  useGetWardsByLocalMunicipalityQuery,
} from "../../redux/geoApi";

// 1. Using the standard hook exactly like we did before
import { useGetErfsByLmPcodeQuery } from "../../redux/erfsApi";
import { erfMemory } from "../../storage/erfMemory";

import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector";
import MapContainer from "../../../components/maps/MapContainer";
import { geoMemory } from "../../storage/geoMemory";

export default function MapsScreen() {
  const { geoState, updateGeo } = useGeo();

  const activeWorkbaseId = geoState?.lmId || "";
  const activeWardId = geoState?.wardId || "";
  const activeErfId = geoState?.id || "";

  const [allErfs, setAllErfs] = useState(null);

  // 🏛️ 1. OFFLINE-FIRST WARDS (The GeoMemory Bridge)
  const wardsFromMMKV = useMemo(() => {
    return activeWorkbaseId ? geoMemory.getWards(activeWorkbaseId) : [];
  }, [activeWorkbaseId]);

  const { data: apiWards = [], isLoading: wardsLoading } =
    useGetWardsByLocalMunicipalityQuery(activeWorkbaseId, {
      skip: !activeWorkbaseId || wardsFromMMKV.length > 0,
    });

  const finalWards = wardsFromMMKV.length > 0 ? wardsFromMMKV : apiWards;

  // 🏛️ 2. ERF WAREHOUSE CHECK
  useEffect(() => {
    if (activeWorkbaseId) {
      const data = erfMemory.getErfsMetaList(activeWorkbaseId);
      setAllErfs(data || []);
    }
  }, [activeWorkbaseId]);

  const { data: cloudData, isSuccess } = useGetErfsByLmPcodeQuery(
    { lmPcode: activeWorkbaseId },
    { skip: !activeWorkbaseId || allErfs === null || allErfs.length > 0 },
  );

  useEffect(() => {
    if (isSuccess && cloudData) setAllErfs(cloudData);
  }, [isSuccess, cloudData]);

  // 🏛️ 3. THE UNIVERSAL BRIDGE (Matches ErfsScreen Exactly)
  const safeErfs = useMemo(() => {
    if (!activeWardId || !allErfs) return [];

    const source = allErfs.length > 0 ? allErfs : cloudData || [];

    return source.reduce((acc, erf) => {
      // Logic borrowed from your ESN screen for 100% parity
      const isMMKV = !!(erf.id && erf.erfNo);
      const isFirestore = !!(erf.erfId && erf.sg);

      if (isMMKV || isFirestore) {
        const id = isMMKV ? erf.id : erf.erfId;
        const pcode = isMMKV ? erf.wardPcode : erf.admin?.ward?.pcode;

        // ONLY pass erfs for the selected ward to the map
        if (pcode === activeWardId) {
          const parcel = erf.sg?.parcelNo;
          const portion = erf.sg?.portion;
          const displayNo = isMMKV
            ? erf.erfNo
            : portion > 0
              ? `${parcel}/${portion}`
              : `${parcel}`;

          acc.push({
            ...erf,
            id: id,
            erfNo: displayNo,
            wardPcode: pcode,
            lmName: isMMKV ? erf.lmName : erf.admin?.localMunicipality?.name,
          });
        }
      }
      return acc;
    }, []);
  }, [allErfs, cloudData, activeWardId]);

  // 🏛️ 4. SELECTION FINDERS
  const selectedWard = useMemo(
    () => finalWards.find((w) => w.id === activeWardId) || null,
    [finalWards, activeWardId],
  );

  const selectedErf = useMemo(
    () => safeErfs.find((e) => e.id === activeErfId) || null,
    [safeErfs, activeErfId],
  );

  // 🏛️ 1. LM FINDER (Warehouse First)
  // 🏛️ The Warehouse provides the DATA for that selection
  const lmFromMMKV = useMemo(() => {
    return activeWorkbaseId
      ? geoMemory.getMunicipality(activeWorkbaseId)
      : null;
  }, [activeWorkbaseId]);

  const { data: apiLmDetails } = useGetLocalMunicipalityByIdQuery(
    activeWorkbaseId,
    { skip: !activeWorkbaseId || !!lmFromMMKV },
  );

  // Auto-stock the shelf if it's a new LM the user hasn't visited before
  useEffect(() => {
    if (apiLmDetails) {
      geoMemory.saveMunicipality(apiLmDetails);
    }
  }, [apiLmDetails]);

  const finalLmDetails = lmFromMMKV || apiLmDetails;

  const [cameraRequestId, setCameraRequestId] = useState(0);

  // TEST CODE TO SEE INSIDE GEOMEMORY - DO NOT REMOVE
  useEffect(() => {
    if (activeWorkbaseId) {
      const storedWards = geoMemory.getWards(activeWorkbaseId);
      if (storedWards) {
        console.log(
          `✅ WAREHOUSE FOUND: ${storedWards.length} wards stored for ${activeWorkbaseId}`,
        );
        console.log(`📦 SAMPLE WARD:`, JSON.stringify(storedWards[0], null, 2));
      } else {
        console.warn(
          `❌ WAREHOUSE EMPTY: No wards found in MMKV for ${activeWorkbaseId}. That's why it's spinning!`,
        );
      }
    }
  }, [activeWorkbaseId]);

  // TEST CODE - DO NOT REMOVE
  useEffect(() => {
    if (activeWorkbaseId) {
      console.log(`🔍 Checking Warehouse for LM: ${activeWorkbaseId}`);
      const storedWards = geoMemory.getWards(activeWorkbaseId);
      if (storedWards && storedWards.length > 0) {
        console.log(`✅ WAREHOUSE VALID: Found ${storedWards.length} wards.`);
      } else {
        console.warn(
          `❌ WAREHOUSE EMPTY: Still nothing on shelf ${activeWorkbaseId}`,
        );
      }
    }
  }, [activeWorkbaseId]);

  return (
    <View style={{ flex: 1 }}>
      {/* <Button
        mode="contained"
        buttonColor="#dc2626"
        icon="trash-can"
        onPress={handleNuclearReset}
        style={{ margin: 10 }}
      >
        Nuclear Reset (Wipe MMKV)
      </Button> */}

      <MapContainer
        lm={finalLmDetails}
        selectedWard={selectedWard}
        wards={finalWards}
        erfs={safeErfs}
        selectedErf={selectedErf}
        cameraRequestId={cameraRequestId}
      />
      <GeoCascadingSelector
        onRefreshCamera={() => setCameraRequestId(Date.now())}
      />
      {/* <ErfDebugInspector /> */}
    </View>
  );
}
