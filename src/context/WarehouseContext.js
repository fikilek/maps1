// src/context/WarehouseContext.js

import { createContext, useContext, useMemo } from "react";
import { useGeo } from "./GeoContext";

import { useGetAstsByLmPcodeQuery } from "../redux/astsApi";
import { useGetErfsByLmPcodeQuery } from "../redux/erfsApi";
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
  const { geoState } = useGeo();
  const { selectedLm } = geoState;
  const lmPcode = selectedLm?.id;

  // RAW PIPELINES (NO FILTERING HERE)
  const { data: wardsList = [], isLoading: wardsLoading } =
    useGetWardsByLocalMunicipalityQuery(lmPcode, {
      skip: !lmPcode,
    });
  // console.log(`WarehouseProvider ----wardsList`, wardsList);

  const { data: erfStore, isLoading: erfsLoading } = useGetErfsByLmPcodeQuery(
    lmPcode,
    { skip: !lmPcode },
  );

  const { data: cloudPrems, isLoading: premsLoading } =
    useGetPremisesByLmPcodeQuery(lmPcode, { skip: !lmPcode });

  const { data: cloudMeters, isLoading: metersLoading } =
    useGetAstsByLmPcodeQuery(lmPcode, { skip: !lmPcode });

  const { data: cloudTrns, isLoading: trnsLoading } = useGetTrnsByLmPcodeQuery(
    lmPcode,
    { skip: !lmPcode },
  );

  const warehouse = useMemo(() => {
    // --- RAW ---
    const allWards = wardsList || [];
    const allErfs = erfStore?.metaEntries || [];
    const allPrems = cloudPrems || [];
    const allMeters = cloudMeters || [];
    const allTrns = cloudTrns || [];

    // --- ERFS SYNC
    const erfsSync = erfStore?.sync ?? {
      status: "idle",
      lmPcode,
      lastSyncAt: 0,
      firstSnapshotAt: 0,
    };

    // WARDS SYNC
    const wardsSync = wardsList?.sync ?? {
      status: "idle",
      lmPcode,
      firstSnapshotAt: 0,
      lastSyncAt: 0,
      lastError: null,
    };

    // --- LOOKUPS (built once per recompute) ---
    const erfById = new Map(allErfs.map((e) => [e.id, e]));

    // --- GEO LIBRARY (wards + erf geoEntries) ---
    const geoLibrary = buildGeoLibrary({
      // wards: allWards,
      erfGeoEntries: erfStore?.geoEntries,
    });

    // --- FILTERS (PURE SELECTORS) ---
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
        erfs: erfsSync,
        wards: wardsSync,
      },
    };
  }, [wardsList, erfStore, cloudPrems, cloudMeters, cloudTrns, geoState]);

  const loading =
    wardsLoading || erfsLoading || premsLoading || metersLoading || trnsLoading;

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
