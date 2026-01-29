import { createContext, useContext, useMemo } from "react";
import { useGetAstsByLmPcodeQuery } from "../redux/astsApi";
import { useGetErfsByLmPcodeQuery } from "../redux/erfsApi";
import {
  useGetLocalMunicipalityByIdQuery,
  useGetWardByNameQuery,
  useGetWardsByLocalMunicipalityQuery,
} from "../redux/geoApi";
import { useGetPremisesByLmPcodeQuery } from "../redux/premisesApi";
import { premiseMemory } from "../storage/premiseMemory"; // Standardized Vault
import { useGeo } from "./GeoContext";

export const WarehouseContext = createContext();

export const WarehouseProvider = ({ children }) => {
  const { geoState } = useGeo();
  const { selectedLm, selectedWard, selectedErf, selectedPremise } = geoState;
  const lmPcode = selectedLm?.id;
  // console.log(`WarehouseProvider----selectedLm`, selectedLm);
  // console.log(`WarehouseProvider----selectedWard`, selectedWard);
  // console.log(`WarehouseProvider----selectedErf`, selectedErf);

  // 🏛️ 1. API PIPELINES (Cloud Source)
  const { data: wardsList } = useGetWardsByLocalMunicipalityQuery(lmPcode, {
    skip: !lmPcode,
  });
  // console.log(`WarehouseProvider----wardsList`, wardsList);

  const { data: lmDetails, isLoading: lmLoading } =
    useGetLocalMunicipalityByIdQuery(lmPcode, {
      skip: !lmPcode,
    });

  const { data: ward } = useGetWardByNameQuery(selectedWard, {
    skip: !selectedWard,
  });

  const { data: erfStore, isLoading: erfsLoading } = useGetErfsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  const { data: cloudPrems, isLoading: premsLoading } =
    useGetPremisesByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });
  // console.log(`WarehouseProvider----cloudPrems`, cloudPrems);

  const { data: cloudMeters, isLoading: metersLoading } =
    useGetAstsByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });
  // console.log(`WarehouseProvider----cloudMeters`, cloudMeters);

  const warehouse = useMemo(() => {
    // 1. RAW INVENTORY
    const allErfs = erfStore?.metaEntries || [];
    // console.log(`WarehouseProvider----allErfs`, allErfs);

    const allMeters = cloudMeters || [];
    // console.log(`WarehouseProvider----allMeters`, allMeters);

    const rawWardNames = erfStore?.wards || []; // These are the ward names/numbers present in the Erf data
    // console.log(`WarehouseProvider----rawWardNames`, rawWardNames);

    // 2. TACTICAL WARD FILTERING
    // Only keep wards from the API if they exist in our Erf inventory
    const existingWards = (wardsList || []).filter(
      (w) => rawWardNames.includes(w.number) || rawWardNames.includes(w.name),
    );
    // console.log(`WarehouseProvider----existingWards`, existingWards);

    // 3. GEOMETRY LIBRARY
    const geoLibrary = { ...(erfStore?.geoEntries || {}) };
    if (lmDetails?.id && lmDetails?.geometry) {
      geoLibrary[lmDetails.id] = lmDetails.geometry;
    }
    // Only map geometries for wards we actually have
    existingWards.forEach((w) => {
      geoLibrary[w.id] = w;
    });

    // 4. PREMISE MERGE (Cloud + Local)
    const localPrems = premiseMemory.getLmList(lmPcode) || [];
    const premMap = new Map();
    (cloudPrems || []).forEach((p) => {
      if (p?.id) premMap.set(p.id, p);
    });
    localPrems.forEach((p) => {
      if (p?.id) premMap.set(p.id, p);
    });
    const allPrems = Array.from(premMap.values());

    // --- 🎯 5. CASCADING TACTICAL FILTERS ---
    const filteredErfs = selectedWard
      ? allErfs.filter((e) => {
          // 🛡️ Match by ID, numeric code, or name string
          return e.admin.ward.pcode === selectedWard.id;
        })
      : allErfs;
    // console.log(`WarehouseProvider----filteredErfs`, filteredErfs);

    // const filteredErfs = selectedWard
    //   ? allErfs.filter(
    //       (e) => e.wardId === selectedWard.id || e.ward === selectedWard.name,
    //     )
    //   : allErfs;

    const filteredPrems = selectedErf
      ? allPrems.filter((p) => p.erfId === selectedErf.id)
      : selectedWard
        ? allPrems.filter((p) => {
            // 🛡️ Match premises using the same multi-key logic
            return (
              p.wardId === selectedWard.id ||
              p.wardId === selectedWard.code?.toString() ||
              p.ward === selectedWard.name
            );
          })
        : allPrems;

    // const filteredPrems = selectedErf
    //   ? allPrems.filter((p) => p.erfId === selectedErf.id)
    //   : selectedWard
    //     ? allPrems.filter((p) => p.wardId === selectedWard.id)
    //     : allPrems;

    return {
      all: {
        erfs: allErfs,
        prems: allPrems,
        meters: allMeters,
        wards: existingWards, // 🎯 Only show wards that have Erfs
        geoLibrary,
      },
      filtered: {
        wards: existingWards,
        erfs: filteredErfs,
        prems: filteredPrems,
        meters: [],
      },
    };
  }, [
    erfStore,
    cloudPrems,
    cloudMeters,
    wardsList,
    lmDetails,
    selectedWard,
    selectedErf,
    lmPcode,
  ]);

  // const warehouse = useMemo(() => {
  //   // 1. RAW INVENTORY (Inventory remains the same)
  //   const allErfs = erfStore?.metaEntries || [];
  //   const allMeters = cloudMeters || [];
  //   const rawWards = erfStore?.wards || [];
  //   const allWardsList = wardsList || []; // Direct from API hook

  //   // 2. GEOMETRY LIBRARY
  //   const geoLibrary = { ...(erfStore?.geoEntries || {}) };
  //   if (lmDetails?.id && lmDetails?.geometry) {
  //     geoLibrary[lmDetails.id] = lmDetails.geometry;
  //   }
  //   if (wardsList) {
  //     wardsList.forEach((w) => {
  //       geoLibrary[w.id] = w;
  //     });
  //   }

  //   // 3. PREMISE MERGE
  //   const localPrems = premiseMemory.getLmList(lmPcode) || [];
  //   // console.log(
  //   //   `WarehouseProvider----(premiseMemory.getLmList) --localPrems`,
  //   //   localPrems,
  //   // );

  //   const premMap = new Map();
  //   (cloudPrems || []).forEach((p) => {
  //     if (p?.id) premMap.set(p.id, p);
  //   });
  //   localPrems.forEach((p) => {
  //     if (p?.id) premMap.set(p.id, p);
  //   });
  //   const allPrems = Array.from(premMap.values());
  //   // console.log(`WarehouseProvider----allPrems`, allPrems);

  //   // --- 🎯 4. CASCADING TACTICAL FILTERS ---

  //   // Filter Erfs by Selected Ward
  //   const filteredErfs = selectedWard
  //     ? allErfs.filter(
  //         (e) => e.wardId === selectedWard.id || e.ward === selectedWard.name,
  //       )
  //     : allErfs;

  //   // Filter Premises by Selected Erf
  //   const filteredPrems = selectedErf
  //     ? allPrems.filter((p) => p.erfId === selectedErf.id)
  //     : selectedWard
  //       ? allPrems.filter((p) => p.wardId === selectedWard.id) // Fallback to Ward level
  //       : allPrems;

  //   // Filter Meters by Selected Premise
  //   const filteredMeters = selectedPremise
  //     ? allMeters.filter((m) => m.premiseId === selectedPremise.id)
  //     : allMeters;

  //   return {
  //     all: {
  //       erfs: allErfs,
  //       prems: allPrems,
  //       meters: allMeters,
  //       wards: allWardsList,
  //       geoLibrary,
  //     },
  //     filtered: {
  //       wards: allWardsList,
  //       erfs: filteredErfs,
  //       prems: filteredPrems,
  //       meters: filteredMeters,
  //     },
  //   };
  //   // 🎯 ADD dependencies so the warehouse re-calculates when selections change
  // }, [
  //   erfStore,
  //   cloudPrems,
  //   cloudMeters,
  //   wardsList,
  //   lmDetails,
  //   selectedWard,
  //   selectedErf,
  //   selectedPremise,
  //   lmPcode,
  // ]);

  // const warehouse = useMemo(() => {
  //   // --- 1. RAW INVENTORY MERGE ---
  //   const allErfs = erfStore?.metaEntries || [];
  //   const allMeters = cloudMeters || []; // Cloud meters list
  //   // const geoLibrary = erfStore?.geoEntries || {};
  //   const rawWards = erfStore?.wards || [];
  //   const allWards = ["ALL", ...rawWards];

  //   // 🏛️ Start with Erf Geometries
  //   const geoLibrary = { ...(erfStore?.geoEntries || {}) };

  //   // 🎯 INJECT the Municipality Boundary into the library
  //   // This maps the boundary to the ID the BoundaryLayer is looking for (e.g., "ZA1048")
  //   if (lmDetails?.id && lmDetails?.geometry) {
  //     // console.log(`📦 Warehouse: Injecting LM Boundary for ${lmDetails.id}`);
  //     geoLibrary[lmDetails.id] = lmDetails.geometry;
  //   }

  //   // Merge Premises (Cloud + Local MMKV)
  //   const localPrems = premiseMemory.getLmList(lmPcode) || [];
  //   const premMap = new Map();
  //   (cloudPrems || []).forEach((p) => {
  //     if (p?.id) premMap.set(p.id, p);
  //   });
  //   localPrems.forEach((p) => {
  //     if (p?.id) premMap.set(p.id, p);
  //   });
  //   const allPrems = Array.from(premMap.values());

  //   // --- 2. CASCADING FILTERS ---
  //   // (Keeping your existing logic for filtering Erfs/Prems by Ward/Erf)
  //   const activeErfId = selectedErf?.id;
  //   let filteredPrems = allPrems;
  //   if (activeErfId) {
  //     filteredPrems = allPrems.filter((p) => p.erfId === activeErfId);
  //   }

  //   // if (wardsList) {
  //   //   wardsList.forEach((w) => {
  //   //     if (w.id && w.geometry) {
  //   //       geoLibrary[w.id] = { geometry: w.geometry, bbox: w.bbox };
  //   //     }
  //   //   });
  //   // }

  //   if (wardsList) {
  //     wardsList.forEach((ward) => {
  //       // 🎯 Store the WHOLE object or at least the geometry
  //       // console.log(`WarehouseProvider----wardsList ----ward`, ward);
  //       geoLibrary[ward.id] = ward;
  //     });
  //   }

  //   return {
  //     all: {
  //       erfs: allErfs,
  //       prems: allPrems,
  //       meters: allMeters, // 🚀 Now globally accessible
  //       wards: allWards,
  //       geoLibrary,
  //     },
  //     filtered: {
  //       wards: allWards,
  //       erfs: allErfs, // Add your ward filters here as per your snippet
  //       prems: filteredPrems,
  //     },
  //   };
  // }, [erfStore, cloudPrems, cloudMeters, selectedErf, lmPcode]);

  const value = {
    ...warehouse,
    loading: erfsLoading || premsLoading || metersLoading,
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error("❌ useWarehouse must be used within a WarehouseProvider");
  }
  return context;
};
