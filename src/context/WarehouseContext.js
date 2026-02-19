// src/context/WarehouseContext.js
import { createContext, useContext, useMemo } from "react";
import { useGetAstsByLmPcodeQuery } from "../redux/astsApi";
import { useGetErfsByLmPcodeQuery } from "../redux/erfsApi";
import {
  useGetLocalMunicipalityByIdQuery,
  useGetWardsByLocalMunicipalityQuery,
} from "../redux/geoApi";
import { useGetPremisesByLmPcodeQuery } from "../redux/premisesApi";
import { useGetTrnsByLmPcodeQuery } from "../redux/trnsApi"; // 🛰️ NEW: TRNS API
import { erfMemory } from "../storage/erfMemory";
import { premiseMemory } from "../storage/premiseMemory";
import { useGeo } from "./GeoContext";

export const WarehouseContext = createContext();

export const WarehouseProvider = ({ children }) => {
  // console.log(`WarehouseProvider ---mounted`);
  const { geoState } = useGeo();
  const { selectedLm, selectedWard, selectedErf, selectedPremise } = geoState;
  const lmPcode = selectedLm?.id;

  // 🏛️ 1. API PIPELINES (Cloud Source)
  const { data: wardsList } = useGetWardsByLocalMunicipalityQuery(lmPcode, {
    skip: !lmPcode,
  });
  const { data: lmDetails } = useGetLocalMunicipalityByIdQuery(lmPcode, {
    skip: !lmPcode,
  });
  const { data: erfStore, isLoading: erfsLoading } = useGetErfsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );
  const { data: cloudPrems, isLoading: premsLoading } =
    useGetPremisesByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });
  const { data: cloudMeters, isLoading: metersLoading } =
    useGetAstsByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });

  // 🛰️ NEW: FETCH TRANSACTIONS FOR THIS LM
  const { data: cloudTrns, isLoading: trnsLoading } = useGetTrnsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  const warehouse = useMemo(() => {
    // --- 🏛️ I. RAW INVENTORY (Total Repository) ---
    const allErfs = erfStore?.metaEntries || [];
    const allMeters = cloudMeters || [];
    const allTrns = cloudTrns || []; // 🎯 The raw history

    // Merge Premises: Cloud + Local Vault
    const localPrems = premiseMemory.getLmList(lmPcode) || [];
    const premMap = new Map();
    (cloudPrems || []).forEach((p) => {
      if (p?.id) premMap.set(p.id, p);
    });
    localPrems.forEach((p) => {
      if (p?.id) premMap.set(p?.id, p);
    });
    const allPrems = Array.from(premMap.values());

    // --- 🏛️ II. GEOMETRY LIBRARY ---
    const rawWardNames = erfStore?.wards || [];
    const existingWards = (wardsList || []).filter(
      (w) =>
        rawWardNames.includes(w?.number) ||
        rawWardNames.includes(w.name) ||
        rawWardNames.includes(w.id),
    );

    const geoLibrary = { ...(erfStore?.geoEntries || {}) };
    if (Object.keys(geoLibrary).length === 0 && allErfs.length > 0) {
      allErfs.forEach((erf) => {
        const shard = erfMemory.getErfsGeoList(erf.id);
        if (shard) geoLibrary[erf.id] = shard;
      });
    }
    if (lmDetails?.id && lmDetails?.geometry)
      geoLibrary[lmDetails.id] = lmDetails.geometry;
    existingWards.forEach((w) => {
      if (w?.id) geoLibrary[w.id] = w;
    });

    // --- 🎯 III. CASCADING TACTICAL FILTERS (The Waterfall) ---

    // A. ERFS: Ward Filter
    const filteredErfs = selectedWard
      ? allErfs.filter(
          (e) =>
            e.admin?.ward?.pcode === selectedWard?.id ||
            e.admin?.ward?.id === selectedWard?.id,
        )
      : allErfs;

    // B. PREMISES: Erf -> Ward
    let filteredPrems = allPrems;
    if (selectedErf) {
      filteredPrems = allPrems.filter((p) => p?.erfId === selectedErf?.id);
    } else if (selectedWard) {
      filteredPrems = allPrems.filter((p) => {
        const erf = allErfs?.find((erf) => erf.id === p?.erfId);
        return erf?.admin?.ward?.pcode === selectedWard?.id;
      });
    }

    // C. METERS & TRANSACTIONS: Premise -> Erf -> Ward -> LM
    // We treat Trns with the same surgical precision as Meters
    let filteredMeters = allMeters;
    let filteredTrns = allTrns;

    if (selectedPremise) {
      filteredMeters = allMeters.filter(
        (m) => m.accessData?.premise?.id === selectedPremise?.id,
      );
      filteredTrns = allTrns.filter(
        (t) => t.accessData?.premise?.id === selectedPremise?.id,
      );
    } else if (selectedErf) {
      filteredMeters = allMeters.filter(
        (m) => m.accessData?.erfId === selectedErf?.id,
      );
      filteredTrns = allTrns.filter(
        (t) => t.accessData?.erfId === selectedErf?.id,
      );
    } else if (selectedWard) {
      filteredMeters = allMeters.filter(
        (m) => m.accessData?.wardId === selectedWard?.id,
      );
      filteredTrns = allTrns.filter(
        (t) => t.accessData?.wardId === selectedWard?.id,
      );
    }

    return {
      all: {
        wards: existingWards,
        erfs: allErfs,
        prems: allPrems,
        meters: allMeters,
        trns: allTrns, // 🛰️ Global view
        geoLibrary,
      },
      filtered: {
        wards: existingWards,
        erfs: filteredErfs,
        prems: filteredPrems,
        meters: filteredMeters,
        trns: filteredTrns, // 🛰️ Live filtered view
      },
    };
  }, [
    erfStore,
    cloudPrems,
    cloudMeters,
    cloudTrns,
    wardsList,
    lmDetails,
    selectedWard?.id,
    selectedErf?.id,
    selectedPremise?.id,
    lmPcode,
  ]);

  const value = useMemo(
    () => ({
      ...warehouse,
      loading: erfsLoading || premsLoading || metersLoading || trnsLoading,
    }),
    [warehouse, erfsLoading, premsLoading, metersLoading, trnsLoading],
  );

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
// import { useGetAstsByLmPcodeQuery } from "../redux/astsApi";
// import { useGetErfsByLmPcodeQuery } from "../redux/erfsApi";
// import {
//   useGetLocalMunicipalityByIdQuery,
//   useGetWardsByLocalMunicipalityQuery,
// } from "../redux/geoApi";
// import { useGetPremisesByLmPcodeQuery } from "../redux/premisesApi";
// import { erfMemory } from "../storage/erfMemory";
// import { premiseMemory } from "../storage/premiseMemory"; // Standardized Vault
// import { useGeo } from "./GeoContext";

// export const WarehouseContext = createContext();

// export const WarehouseProvider = ({ children }) => {
//   console.log(`WarehouseProvider ---mounted`);
//   const { geoState } = useGeo();
//   const { selectedLm, selectedWard, selectedErf, selectedPremise } = geoState;
//   const lmPcode = selectedLm?.id;
//   // console.log(`WarehouseProvider----selectedLm`, selectedLm);
//   // console.log(`WarehouseProvider----selectedWard`, selectedWard);
//   // console.log(`WarehouseProvider----selectedErf`, selectedErf);

//   // 🏛️ 1. API PIPELINES (Cloud Source)
//   const { data: wardsList } = useGetWardsByLocalMunicipalityQuery(lmPcode, {
//     skip: !lmPcode,
//   });
//   // console.log(`WarehouseProvider----wardsList`, wardsList);

//   const { data: lmDetails } = useGetLocalMunicipalityByIdQuery(lmPcode, {
//     skip: !lmPcode,
//   });

//   // const { data: ward } = useGetWardByNameQuery(selectedWard, {
//   //   skip: !selectedWard,
//   // });

//   const { data: erfStore, isLoading: erfsLoading } = useGetErfsByLmPcodeQuery(
//     { lmPcode },
//     { skip: !lmPcode },
//   );

//   const { data: cloudPrems, isLoading: premsLoading } =
//     useGetPremisesByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });
//   // console.log(`WarehouseProvider----cloudPrems`, cloudPrems);

//   const { data: cloudMeters, isLoading: metersLoading } =
//     useGetAstsByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });
//   // console.log(`WarehouseProvider----cloudMeters`, cloudMeters);

//   const warehouse = useMemo(() => {
//     // 🏛️ 1. RAW INVENTORY (The Total Repository)
//     const allErfs = erfStore?.metaEntries || [];

//     const allMeters = cloudMeters || [];

//     // Merge Premises: Cloud + Local Vault
//     const localPrems = premiseMemory.getLmList(lmPcode) || [];
//     const premMap = new Map();
//     (cloudPrems || []).forEach((p) => {
//       if (p?.id) premMap.set(p.id, p);
//     });
//     localPrems.forEach((p) => {
//       if (p?.id) premMap.set(p?.id, p);
//     });
//     const allPrems = Array.from(premMap.values());

//     // 🏛️ 2. TACTICAL WARD INVENTORY
//     // Only keep wards that actually exist in our current Erf dataset
//     const rawWardNames = erfStore?.wards || [];
//     const existingWards = (wardsList || []).filter(
//       (w) =>
//         rawWardNames.includes(w?.number) ||
//         rawWardNames.includes(w.name) ||
//         rawWardNames.includes(w.id),
//     );

//     // 🏛️ 3. GEOMETRY LIBRARY (Handled via Shredded Shard Reconstruction)
//     const geoLibrary = { ...(erfStore?.geoEntries || {}) };
//     if (Object.keys(geoLibrary).length === 0 && allErfs.length > 0) {
//       allErfs.forEach((erf) => {
//         const shard = erfMemory.getErfsGeoList(erf.id);
//         if (shard) geoLibrary[erf.id] = shard;
//       });
//     }

//     // Map LM and Ward geometries into the library
//     if (lmDetails?.id && lmDetails?.geometry)
//       geoLibrary[lmDetails.id] = lmDetails.geometry;
//     existingWards.forEach((w) => {
//       if (w?.id) geoLibrary[w.id] = w;
//     });

//     // --- 🎯 4. CASCADING TACTICAL FILTERS (The Waterfall) ---

//     // A. ERFS: Filtered by Ward
//     const filteredErfs = selectedWard
//       ? allErfs.filter(
//           (e) =>
//             e.admin?.ward?.pcode === selectedWard?.id ||
//             e.admin?.ward?.id === selectedWard?.id,
//         )
//       : allErfs;

//     // B. PREMISES: Filtered by Erf (Highest Priority) then Ward

//     let filteredPrems = allPrems; // Rule 1: Default to All (LM Level)

//     if (selectedErf) {
//       // 🎯 Rule 3: Erf Selected - Only units on THIS land
//       filteredPrems = allPrems.filter((p) => p?.erfId === selectedErf?.id);
//     } else if (selectedWard) {
//       // 🎯 Rule 2: Ward Selected - All units in THIS ward
//       filteredPrems = allPrems.filter((p) => {
//         const erfId = p?.erfId;
//         const erf = allErfs?.find((erf) => erf.id === erfId);
//         return erf?.admin?.ward?.pcode === selectedWard?.id;
//       });
//     }

//     // C. METERS: Filtered by Premise -> Erf -> Ward -> LM
//     let filteredMeters = allMeters; // Rule 1: Default to All (LM Level)

//     if (selectedPremise) {
//       // 🎯 Rule 4: Premise Selected - Only meters at this door
//       filteredMeters = allMeters.filter(
//         (m) => m.accessData?.premise?.id === selectedPremise?.id,
//       );
//     } else if (selectedErf) {
//       // 🎯 Rule 3: Erf Selected - All meters on this property
//       filteredMeters = allMeters.filter(
//         (m) => m.accessData?.erfId === selectedErf?.id,
//       );
//     } else if (selectedWard) {
//       // 🎯 Rule 2: Ward Selected - All meters in this specific Ward
//       // 🛡️ Matches by the ward's unique ID/pcode
//       filteredMeters = allMeters.filter(
//         (m) => m.accessData?.wardId === selectedWard?.id,
//       );
//     }
//     // Rule 1: If none of the above, filteredMeters remains allMeters (The LM view)

//     return {
//       all: {
//         wards: existingWards,
//         erfs: allErfs,
//         prems: allPrems,
//         meters: allMeters,
//         geoLibrary,
//       },
//       filtered: {
//         wards: existingWards,
//         erfs: filteredErfs,
//         prems: filteredPrems,
//         meters: filteredMeters,
//       },
//     };
//   }, [
//     erfStore,
//     cloudPrems,
//     cloudMeters,
//     wardsList,
//     lmDetails,
//     selectedWard?.id,
//     selectedErf?.id,
//     selectedPremise?.id, // 🎯 Critical for Meter drill-down
//     lmPcode,
//   ]);

//   const value = useMemo(
//     () => ({
//       ...warehouse,
//       loading: erfsLoading || premsLoading || metersLoading,
//     }),
//     [warehouse, erfsLoading, premsLoading, metersLoading],
//   );

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
