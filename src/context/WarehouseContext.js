// src/context/WarehouseContext.js

import { createContext, useContext, useEffect, useMemo } from "react";
import { useGeo } from "./GeoContext";

import { useGetAstsByLmPcodeQuery } from "../redux/astsApi";
import { useGetErfsByLmPcodeWardPcodeQuery } from "../redux/erfsApi";
import { useGetWardsByLocalMunicipalityQuery } from "../redux/geoApi";
import { useGetPremisesByLmPcodeQuery } from "../redux/premisesApi";
import { useGetTrnsByLmPcodeQuery } from "../redux/trnsApi";

import {
  buildGeoLibrary,
  selectFilteredErfs,
  selectFilteredMeters,
  selectFilteredPrems,
  selectFilteredTrns,
  selectFilteredWards,
} from "./warehouseSelectors";

export const WarehouseContext = createContext(null);

export const WarehouseProvider = ({ children }) => {
  const { geoState, updateGeo } = useGeo();
  const { selectedLm, selectedWard } = geoState;

  const lmPcode = selectedLm?.id || null;

  // 1) Load wards for selected LM
  const { data: wardsList = [], isLoading: wardsLoading } =
    useGetWardsByLocalMunicipalityQuery(lmPcode, {
      skip: !lmPcode,
    });

  // 2) Keep only wards that truly belong to this LM
  const wards = useMemo(() => {
    if (!lmPcode) return [];

    return (wardsList || []).filter((w) => {
      const parentLm =
        w?.parents?.localMunicipalityId ||
        w?.parents?.localMunicipality?.pcode ||
        w?.admin?.localMunicipality?.pcode ||
        null;

      if (parentLm) return parentLm === lmPcode;

      return String(w?.id || "").startsWith(lmPcode);
    });
  }, [wardsList, lmPcode]);

  // 3) Deterministic fallback ward
  const fallbackWard = useMemo(() => {
    if (!wards.length) return null;
    return [...wards].sort((a, b) => (a.code ?? 0) - (b.code ?? 0))[0] || null;
  }, [wards]);

  // 4) Validate whether selectedWard belongs to current LM
  const selectedWardIsValid = useMemo(() => {
    if (!lmPcode || !selectedWard?.id) return false;

    return wards.some(
      (w) =>
        (w?.id && w.id === selectedWard.id) ||
        (w?.pcode && w.pcode === selectedWard.id) ||
        (w?.id && w.id === selectedWard.pcode),
    );
  }, [lmPcode, selectedWard?.id, selectedWard?.pcode, wards]);

  // 5) Heal ward when missing or invalid
  useEffect(() => {
    if (!lmPcode) return;
    if (!fallbackWard) return;

    if (selectedWardIsValid) return;

    updateGeo({
      selectedWard: fallbackWard,
      lastSelectionType: "WARD",
    });
  }, [lmPcode, fallbackWard, selectedWardIsValid, updateGeo]);

  // 6) Active ward key
  const activeWard = selectedWardIsValid ? selectedWard : fallbackWard;
  const wardPcode = activeWard?.pcode || activeWard?.id || null;

  // 7) Load active ward ERFs
  const { data: wardErfs, isLoading: erfsLoading } =
    useGetErfsByLmPcodeWardPcodeQuery(
      { lmPcode, wardPcode },
      { skip: !lmPcode || !wardPcode },
    );

  const expectedPackKey =
    lmPcode && wardPcode ? `${lmPcode}__${wardPcode}` : null;

  const currentPackKey =
    wardErfs?.sync?.wardCacheKey ||
    wardErfs?.sync?.packKey ||
    wardErfs?.sync?.key ||
    null;

  const packKeyMatches =
    !!expectedPackKey && currentPackKey === expectedPackKey;

  // 8) Other LM-scoped pipelines
  const { data: cloudPrems = [], isLoading: premsLoading } =
    useGetPremisesByLmPcodeQuery(lmPcode, { skip: !lmPcode });

  const { data: cloudMeters = [], isLoading: metersLoading } =
    useGetAstsByLmPcodeQuery(lmPcode, { skip: !lmPcode });

  const { data: cloudTrns = [], isLoading: trnsLoading } =
    useGetTrnsByLmPcodeQuery(lmPcode, { skip: !lmPcode });

  const warehouse = useMemo(() => {
    const allWards = wards;

    // ERFs are ONLY the active ward ERFs now
    const allErfs = packKeyMatches ? wardErfs?.metaEntries || [] : [];
    const allPrems = cloudPrems || [];
    const allMeters = cloudMeters || [];
    const allTrns = cloudTrns || [];

    const wardErfsSync = packKeyMatches
      ? (wardErfs?.sync ?? {
          status: "idle",
          lmPcode,
          wardPcode,
          wardCacheKey: expectedPackKey,
          lastSyncAt: 0,
          firstSnapshotAt: 0,
          lastError: null,
          size: 0,
        })
      : {
          status: expectedPackKey ? "syncing" : "idle",
          lmPcode,
          wardPcode,
          wardCacheKey: expectedPackKey,
          size: 0,
          lastSyncAt: 0,
          firstSnapshotAt: 0,
          lastError: null,
        };

    const wardsSync = {
      status: !lmPcode
        ? "idle"
        : !selectedWardIsValid && allWards.length === 0
          ? "syncing"
          : "ready",
      lmPcode,
      firstSnapshotAt: allWards.length > 0 ? Date.now() : 0,
      lastSyncAt: allWards.length > 0 ? Date.now() : 0,
      lastError: null,
    };

    const erfById = new Map(allErfs.map((e) => [e.id, e]));

    const geoLibrary = buildGeoLibrary({
      wards: allWards,
      erfGeoEntries: packKeyMatches ? wardErfs?.geoEntries || {} : {},
    });

    const filteredWards = selectFilteredWards({ wards: allWards }, geoState);
    const filteredErfs = selectFilteredErfs({ erfs: allErfs }, geoState);
    const filteredPrems = selectFilteredPrems(
      { prems: allPrems, erfById },
      geoState,
    );
    const filteredMeters = selectFilteredMeters(
      { meters: allMeters },
      geoState,
    );
    const filteredTrns = selectFilteredTrns({ trns: allTrns }, geoState);

    return {
      all: {
        wards: allWards,
        erfs: allErfs,
        prems: allPrems,
        meters: allMeters,
        trns: allTrns,
        geoLibrary,
      },
      filtered: {
        wards: filteredWards,
        erfs: filteredErfs,
        prems: filteredPrems,
        meters: filteredMeters,
        trns: filteredTrns,
      },
      sync: {
        wards: wardsSync,
        erfs: wardErfsSync,
      },
    };
  }, [
    wards,
    wardErfs,
    packKeyMatches,
    cloudPrems,
    cloudMeters,
    cloudTrns,
    geoState,
    lmPcode,
    wardPcode,
    expectedPackKey,
    wardsLoading,
    selectedWardIsValid,
  ]);

  const loading =
    (!!lmPcode && wardsLoading) ||
    (!!lmPcode && !!wardPcode && erfsLoading) ||
    (!!lmPcode && premsLoading) ||
    (!!lmPcode && metersLoading) ||
    (!!lmPcode && trnsLoading);

  return (
    <WarehouseContext.Provider value={{ ...warehouse, loading }}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const ctx = useContext(WarehouseContext);
  if (!ctx)
    throw new Error("useWarehouse must be used within WarehouseProvider");
  return ctx;
};
