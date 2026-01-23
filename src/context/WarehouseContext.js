import { createContext, useContext, useMemo } from "react";
import { useGetErfsByLmPcodeQuery } from "../redux/erfsApi";
import { useGetWardByNameQuery } from "../redux/geoApi";
import { useGetMetersByLmPcodeQuery } from "../redux/metersApi";
import { useGetPremisesByLmPcodeQuery } from "../redux/premisesApi";
import { premiseMemory } from "../storage/premiseMemory"; // Standardized Vault
import { useGeo } from "./GeoContext";

export const WarehouseContext = createContext();

export const WarehouseProvider = ({ children }) => {
  const { geoState } = useGeo();
  const { selectedLm, selectedWard, selectedErf, selectedPremise } = geoState;
  const lmPcode = selectedLm?.id;

  // 🏛️ 1. API PIPELINES (Cloud Source)

  const { data: ward } = useGetWardByNameQuery(selectedWard, {
    skip: !selectedWard,
  });

  const { data: erfStore, isLoading: erfsLoading } = useGetErfsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  const { data: cloudPrems, isLoading: premsLoading } =
    useGetPremisesByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });

  const { data: cloudMeters, isLoading: metersLoading } =
    useGetMetersByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });

  const warehouse = useMemo(() => {
    // --- 1. RAW INVENTORY MERGE ---
    const allErfs = erfStore?.metaEntries || [];
    const allMeters = cloudMeters || []; // Cloud meters list
    const geoLibrary = erfStore?.geoEntries || {};
    const rawWards = erfStore?.wards || [];
    const allWards = ["ALL", ...rawWards];

    // Merge Premises (Cloud + Local MMKV)
    const localPrems = premiseMemory.getLmList(lmPcode) || [];
    const premMap = new Map();
    (cloudPrems || []).forEach((p) => {
      if (p?.id) premMap.set(p.id, p);
    });
    localPrems.forEach((p) => {
      if (p?.id) premMap.set(p.id, p);
    });
    const allPrems = Array.from(premMap.values());

    // --- 2. CASCADING FILTERS ---
    // (Keeping your existing logic for filtering Erfs/Prems by Ward/Erf)
    const activeErfId = selectedErf?.id;
    let filteredPrems = allPrems;
    if (activeErfId) {
      filteredPrems = allPrems.filter((p) => p.erfId === activeErfId);
    }

    return {
      all: {
        erfs: allErfs,
        prems: allPrems,
        meters: allMeters, // 🚀 Now globally accessible
        wards: allWards,
        geoLibrary,
      },
      filtered: {
        wards: allWards,
        erfs: allErfs, // Add your ward filters here as per your snippet
        prems: filteredPrems,
      },
    };
  }, [erfStore, cloudPrems, cloudMeters, selectedErf, lmPcode]);

  // const warehouse = useMemo(() => {
  //   // --- 1. RAW INVENTORY MERGE ---
  //   const allErfs = erfStore?.metaEntries || [];
  //   const geoLibrary = erfStore?.geoEntries || {};
  //   const rawWards = erfStore?.wards || [];
  //   const allWards = ["ALL", ...rawWards];

  //   // 🎯 Standard: Merge Cloud + Local MMKV (Objects Only)
  //   const localPrems = premiseMemory.getLmList(lmPcode) || [];
  //   const premMap = new Map();

  //   // Add cloud items first
  //   (cloudPrems || []).forEach((p) => {
  //     if (p && typeof p === "object") premMap.set(p.id, p);
  //   });
  //   // Overwrite with local items (Local is always the latest "Truth")
  //   localPrems.forEach((p) => {
  //     if (p && typeof p === "object") premMap.set(p.id, p);
  //   });

  //   const allPrems = Array.from(premMap.values());

  //   // --- 2. CASCADING FILTERS ---
  //   const activeWardId = ward?.id;
  //   const activeErfId = selectedErf?.id;

  //   // Level 2: Erfs (Filter by Ward)
  //   const filteredErfs = activeWardId
  //     ? allErfs.filter((e) => e.admin?.ward?.pcode === activeWardId)
  //     : allErfs;

  //   // Level 3: Premises (Erf Anchor > Ward Anchor > All)
  //   let filteredPrems = allPrems;
  //   if (activeErfId) {
  //     // 🎯 Link directly to Erf
  //     filteredPrems = allPrems.filter((p) => p.erfId === activeErfId);
  //   } else if (activeWardId) {
  //     // 🎯 Link via Ward (Check if the Premise's Erf is in the filtered Ward list)
  //     const erfIdsInWard = new Set(filteredErfs.map((e) => e.id));
  //     filteredPrems = allPrems.filter((p) => erfIdsInWard.has(p.erfId));
  //   }

  //   // 🕵️ DIAGNOSTIC LOGS
  //   console.log(
  //     `🌊 [CASCADE]: Ward(${activeWardId || "ALL"}) -> Erf(${activeErfId || "ALL"})`,
  //   );
  //   console.log(
  //     `📊 [RESULTS]: Erfs: ${filteredErfs.length}, Prems: ${filteredPrems.length}, Wards: ${allWards.length}`,
  //   );

  //   return {
  //     all: { erfs: allErfs, prems: allPrems, wards: allWards, geoLibrary },
  //     filtered: {
  //       wards: allWards,
  //       erfs: filteredErfs,
  //       prems: filteredPrems,
  //       count: filteredErfs.length,
  //     },
  //   };
  // }, [erfStore, cloudPrems, ward, selectedErf, selectedPremise, lmPcode]);

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

// import { createContext, useContext, useMemo } from "react";
// import { useGetErfsByLmPcodeQuery } from "../redux/erfsApi";
// import { useGetWardByNameQuery } from "../redux/geoApi";
// import { useGetPremisesByLmPcodeQuery } from "../redux/premisesApi";
// import { useGeo } from "./GeoContext";

// export const WarehouseContext = createContext();

// export const WarehouseProvider = ({ children }) => {
//   const { geoState } = useGeo();
//   const { selectedLm, selectedWard, selectedErf, selectedPremise } = geoState;
//   const lmPcode = selectedLm?.id;
//   console.log(`WarehouseProvider ----selectedWard`, selectedWard);

//   // 🏛️ 1. API PIPELINES (The Raw Source)
//   const { data: erfStore, isLoading: erfsLoading } = useGetErfsByLmPcodeQuery(
//     { lmPcode },
//     { skip: !lmPcode },
//   );

//   const { data: premiseStore, isLoading: premsLoading } =
//     useGetPremisesByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });

//   const { data: ward } = useGetWardByNameQuery(selectedWard, {
//     skip: !selectedWard,
//   });
//   console.log(`WarehouseProvider ----(selectedWard) ward`, ward);

//   const warehouse = useMemo(() => {
//     // 1. RAW INVENTORY
//     const allErfs = erfStore?.metaEntries || [];
//     const allPrems = premiseStore || [];
//     // Ensure "ALL" is always the first option for the UI
//     const rawWards = erfStore?.wards || [];
//     const allWards = ["ALL", ...rawWards];
//     const geoLibrary = erfStore?.geoEntries || {};

//     // 🎯 2. THE CASCADING FILTERS
//     const activeWardId = ward?.id; // Resolved from useGetWardByNameQuery
//     const activeErfId = selectedErf?.id;
//     const activePremiseId = selectedPremise?.id;

//     // --- Level 1: Wards (The Dropdown Source) ---
//     // We keep all wards available for the UI to switch between,
//     // but we can flag the active one.
//     const filteredWards = allWards;

//     // --- Level 2: Erfs (Filter by Ward) ---
//     const filteredErfs = activeWardId
//       ? allErfs.filter((e) => e.admin?.ward?.pcode === activeWardId)
//       : allErfs;

//     // --- Level 3: Premises (Erf Anchor > Ward Anchor > All) ---
//     let filteredPrems = allPrems;
//     if (activeErfId) {
//       // Direct Link: Only premises belonging to this specific Erf
//       filteredPrems = allPrems.filter((p) => p.erfId === activeErfId);
//     } else if (activeWardId) {
//       // Ward Link: All premises in this ward
//       filteredPrems = allPrems.filter(
//         (p) => p.metadata?.wardPcode === activeWardId,
//       );
//     }

//     // 🕵️ DIAGNOSTIC LOGS
//     console.log(
//       `🌊 [CASCADE]: Ward(${activeWardId || "ALL"}) -> Erf(${activeErfId || "ALL"})`,
//     );
//     console.log(
//       `📊 [RESULTS]: Erfs: ${filteredErfs.length}, Prems: ${filteredPrems.length}, Wards: ${allWards.length}`,
//     );

//     return {
//       all: { erfs: allErfs, prems: allPrems, wards: allWards, geoLibrary },
//       filtered: {
//         wards: filteredWards, // Now stays populated for the picker
//         erfs: filteredErfs,
//         prems: filteredPrems,
//         count: filteredErfs.length,
//       },
//     };
//   }, [erfStore, premiseStore, ward, selectedErf, selectedPremise]);

//   const value = {
//     ...warehouse,
//     loading: erfsLoading || premsLoading,
//   };

//   return (
//     <WarehouseContext.Provider value={value}>
//       {children}
//     </WarehouseContext.Provider>
//   );
// };

// export const useWarehouse = () => {
//   const context = useContext(WarehouseContext);
//   if (context === undefined) {
//     throw new Error("❌ useWarehouse must be used within a WarehouseProvider");
//   }
//   return context;
// };
