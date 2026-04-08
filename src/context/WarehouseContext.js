// src/context/WarehouseContext.js

import { createContext, useContext, useMemo } from "react";
import { useGeo } from "./GeoContext";

import { useGetAstsByLmPcodeWardPcodeQuery } from "../redux/astsApi";
import { useGetErfsByLmPcodeWardPcodeQuery } from "../redux/erfsApi";
import { useGetWardsByLocalMunicipalityQuery } from "../redux/geoApi";
import { useGetPremisesByLmPcodeWardPcodeQuery } from "../redux/premisesApi";
import { useGetTrnsByLmPcodeWardPcodeQuery } from "../redux/trnsApi";

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
  const { geoState } = useGeo();
  const { selectedLm, selectedWard } = geoState || {};

  const lmPcode = selectedLm?.pcode || selectedLm?.id || null;

  const { data: wardsList = [], isLoading: wardsLoading } =
    useGetWardsByLocalMunicipalityQuery(lmPcode, {
      skip: !lmPcode,
    });

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
  // console.log(`wards`, wards);

  const selectedWardIsValid = useMemo(() => {
    if (!lmPcode || !selectedWard?.id) return false;

    return wards.some(
      (w) =>
        (w?.id && w.id === selectedWard.id) ||
        (w?.pcode && w.pcode === selectedWard.id) ||
        (w?.id && w.id === selectedWard.pcode) ||
        (w?.pcode && w.pcode === selectedWard.pcode),
    );
  }, [lmPcode, selectedWard?.id, selectedWard?.pcode, wards]);

  const activeWard = selectedWardIsValid ? selectedWard : null;
  const wardPcode = activeWard?.pcode || activeWard?.id || null;
  const scopeReady = !!lmPcode && !!wardPcode;

  const { data: wardErfs, isLoading: erfsLoading } =
    useGetErfsByLmPcodeWardPcodeQuery(
      { lmPcode, wardPcode },
      { skip: !lmPcode || !wardPcode },
    );

  const { data: wardPrems = [], isLoading: premsLoading } =
    useGetPremisesByLmPcodeWardPcodeQuery(
      { lmPcode, wardPcode },
      { skip: !lmPcode || !wardPcode },
    );
  // console.log(`wardPrems`, wardPrems);

  // keep these old for now until we move them too
  // const { data: meters = [], isLoading: astsLoading } =
  //   useGetAstsByLmPcodeQuery(lmPcode, { skip: !lmPcode });
  const { data: cloudMeters = [], isLoading: metersLoading } =
    useGetAstsByLmPcodeWardPcodeQuery(
      { lmPcode, wardPcode },
      { skip: !lmPcode || !wardPcode },
    );
  // console.log(`cloudMeters`, cloudMeters);
  // console.log(`lmPcode`, lmPcode);
  // console.log(`wardPcode`, wardPcode);

  const { data: cloudTrns = [], isLoading: trnsLoading } =
    useGetTrnsByLmPcodeWardPcodeQuery(
      { lmPcode, wardPcode },
      { skip: !lmPcode || !wardPcode },
    );
  // console.log(`cloudTrns`, cloudTrns);
  // console.log(`lmPcode`, lmPcode);
  // console.log(`wardPcode`, wardPcode);

  const expectedPackKey =
    lmPcode && wardPcode ? `${lmPcode}__${wardPcode}` : null;

  const currentPackKey =
    wardErfs?.sync?.wardCacheKey ||
    wardErfs?.sync?.packKey ||
    wardErfs?.sync?.key ||
    null;

  const packKeyMatches =
    !!expectedPackKey && currentPackKey === expectedPackKey;

  const warehouse = useMemo(() => {
    const allWards = scopeReady ? wards : [];
    const allErfs =
      scopeReady && packKeyMatches ? wardErfs?.metaEntries || [] : [];
    const allPrems = scopeReady ? wardPrems || [] : [];
    const allMeters = scopeReady ? cloudMeters || [] : [];
    const allTrns = scopeReady ? cloudTrns || [] : [];

    // const allWards = wards;
    // const allErfs = packKeyMatches ? wardErfs?.metaEntries || [] : [];
    // const allPrems = wardPcode ? wardPrems || [] : [];
    // const allMeters = cloudMeters || [];
    // const allTrns = cloudTrns || [];

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
          status: !lmPcode ? "idle" : !wardPcode ? "awaiting-ward" : "syncing",
          lmPcode,
          wardPcode,
          wardCacheKey: expectedPackKey,
          size: 0,
          lastSyncAt: 0,
          firstSnapshotAt: 0,
          lastError: null,
        };

    const wardsSync = {
      status: !lmPcode ? "idle" : wardsLoading ? "syncing" : "ready",
      lmPcode,
      firstSnapshotAt: allWards.length > 0 ? Date.now() : 0,
      lastSyncAt: allWards.length > 0 ? Date.now() : 0,
      lastError: null,
    };

    const scopeSync = {
      status: !lmPcode
        ? "idle"
        : !selectedWard
          ? "awaiting-ward"
          : selectedWardIsValid
            ? "ready"
            : "invalid-ward",
      lmPcode,
      wardPcode: selectedWard?.pcode || selectedWard?.id || null,
    };

    const trnsSync = {
      status: !lmPcode
        ? "idle"
        : !wardPcode
          ? "awaiting-ward"
          : trnsLoading
            ? "syncing"
            : "ready",
      lmPcode,
      wardPcode,
      size: allTrns.length,
      lastError: null,
      firstSnapshotAt: allTrns.length > 0 ? Date.now() : 0,
      lastSyncAt: allTrns.length > 0 ? Date.now() : 0,
    };

    const metersSync = {
      status: !lmPcode
        ? "idle"
        : !wardPcode
          ? "awaiting-ward"
          : metersLoading
            ? "syncing"
            : "ready",
      lmPcode,
      wardPcode,
      size: allMeters.length,
      lastError: null,
      firstSnapshotAt: allMeters.length > 0 ? Date.now() : 0,
      lastSyncAt: allMeters.length > 0 ? Date.now() : 0,
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
    // console.log(`filteredMeters`, filteredMeters);
    const filteredTrns = selectFilteredTrns({ trns: allTrns }, geoState);

    return {
      available: {
        wards: lmPcode ? wards : [],
      },
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
        scope: scopeSync,
        wards: wardsSync,
        erfs: wardErfsSync,
        meters: metersSync,
        trns: trnsSync,
      },
    };
  }, [
    wards,
    wardErfs,
    wardPrems,
    packKeyMatches,
    cloudMeters,
    cloudTrns,
    geoState,
    lmPcode,
    wardPcode,
    expectedPackKey,
    wardsLoading,
    selectedWard,
    selectedWardIsValid,
    trnsLoading,
    metersLoading,
    scopeReady,
  ]);

  const loading =
    (!!lmPcode && wardsLoading) ||
    (scopeReady && erfsLoading) ||
    (scopeReady && premsLoading) ||
    (scopeReady && metersLoading) ||
    (scopeReady && trnsLoading);

  return (
    <WarehouseContext.Provider value={{ ...warehouse, loading }}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const ctx = useContext(WarehouseContext);
  if (!ctx) {
    throw new Error("useWarehouse must be used within WarehouseProvider");
  }
  return ctx;
};
