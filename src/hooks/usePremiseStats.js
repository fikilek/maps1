import { useMemo } from "react";

export const usePremiseStats = (
  premises = [],
  transactions = [],
  erfs = {},
) => {
  return useMemo(() => {
    const stats = {
      total: premises?.length || 0,
      noAccessCount: 0,
      elecNormal: 0,
      waterNormal: 0,
      elecBulk: 0,
      waterBulk: 0,
      elecMeters: 0,
      waterMeters: 0,
      propertyDist: {},
      noAccessDist: {},
      wardDist: {},
    };

    // 1. Process Premises & Meters
    premises.forEach((p) => {
      const type = p?.propertyType?.type || "Other";
      stats.propertyDist[type] = (stats.propertyDist[type] || 0) + 1;

      p?.services?.electricityMeters?.forEach((m) => {
        if (m?.category?.toLowerCase() === "bulk") stats.elecBulk++;
        else stats.elecNormal++;
      });

      p?.services?.waterMeters?.forEach((m) => {
        if (m?.category?.toLowerCase() === "bulk") stats.waterBulk++;
        else stats.waterNormal++;
      });
    });

    stats.elecMeters = stats.elecNormal + stats.elecBulk;
    stats.waterMeters = stats.waterNormal + stats.waterBulk;

    // 2. Process Transactions for No Access
    const naTrns = transactions.filter((t) => t?.accessData?.access?.hasAccess);
    stats.noAccessCount = naTrns?.length || 0;

    naTrns.forEach((t) => {
      const premiseId = t?.accessData?.premise?.id;
      const parentPremise = premises.find((p) => p?.id === premiseId);
      const type = parentPremise?.propertyType?.type || "Other";
      stats.noAccessDist[type] = (stats.noAccessDist[type] || 0) + 1;
    });

    // 📊 3. Data for Property Table & Charts
    const propStatsList = Object.entries(stats.propertyDist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const propPieData = propStatsList.map((item, index) => ({
      value: item.count,
      label: item.name,
      color: ["#2563eb", "#7c3aed", "#db2777", "#f59e0b", "#10b981", "#64748b"][
        index % 6
      ],
      text: `${item.count}`,
    }));

    const propBarData = propStatsList.map((item) => ({
      value: item.count,
      label: item.name.substring(0, 4),
      frontColor: "#4f46e5",
    }));

    // 💧 4. Data for Services (Water/Elec) Table
    const serviceStatsList = [
      { name: "Normal Electricity", count: stats.elecNormal },
      { name: "Bulk Electricity", count: stats.elecBulk },
      { name: "Normal Water", count: stats.waterNormal },
      { name: "Bulk Water", count: stats.waterBulk },
    ];

    const servicesPieData = [
      {
        value: stats.elecMeters,
        label: "Elec",
        color: "#fbbf24",
        text: `${stats.elecMeters}`,
      },
      {
        value: stats.waterMeters,
        label: "Water",
        color: "#0ea5e9",
        text: `${stats.waterMeters}`,
      },
    ];

    // 🛑 5. Data for No Access Table & Bars
    const accessStatsList = Object.entries(stats.noAccessDist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const accessBarData = accessStatsList.map((item) => ({
      value: item.count,
      label: item.name.substring(0, 4),
      frontColor: "#ef4444",
    }));

    premises.forEach((p) => {
      // 🛰️ TACTICAL LOOKUP: Premise -> ERF Object -> Ward Name
      const erfData = erfs.find((erf) => erf.id === p?.erfId);
      const wardName = erfData?.admin?.ward?.name || "Unknown Ward";
      stats.wardDist[wardName] = (stats.wardDist[wardName] || 0) + 1;
    });

    const wardFilterList = Object.entries(stats.wardDist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );

    return {
      ...stats,
      propStatsList,
      propPieData,
      propBarData,
      serviceStatsList,
      servicesPieData,
      accessStatsList, // 🎯 New for the table
      accessBarData,
      wardFilterList,
    };
  }, [premises, transactions]);
};

// import { useMemo } from "react";

// export const usePremiseStats = (premises = [], transactions = []) => {
//   return useMemo(() => {
//     const stats = {
//       total: premises?.length || 0,
//       noAccessCount: 0,
//       elecNormal: 0,
//       waterNormal: 0,
//       elecBulk: 0,
//       waterBulk: 0,
//       elecMeters: 0,
//       waterMeters: 0,
//       propertyDist: {},
//       noAccessDist: {},
//     };

//     // 1. Process Premises & Meters
//     premises.forEach((p) => {
//       const type = p?.propertyType?.type || "Other";
//       stats.propertyDist[type] = (stats.propertyDist[type] || 0) + 1;

//       p?.services?.electricityMeters?.forEach((m) => {
//         if (m?.category?.toLowerCase() === "bulk") stats.elecBulk++;
//         else stats.elecNormal++;
//       });

//       p?.services?.waterMeters?.forEach((m) => {
//         if (m?.category?.toLowerCase() === "bulk") stats.waterBulk++;
//         else stats.waterNormal++;
//       });
//     });

//     stats.elecMeters = stats.elecNormal + stats.elecBulk;
//     stats.waterMeters = stats.waterNormal + stats.waterBulk;

//     // 2. Process Transactions for No Access
//     const naTrns = transactions.filter(
//       (t) => t?.accessData?.access?.hasAccess?.toLowerCase() === "no",
//     );
//     stats.noAccessCount = naTrns?.length || 0;

//     naTrns.forEach((t) => {
//       const premiseId = t?.accessData?.premise?.id;
//       const parentPremise = premises.find((p) => p?.id === premiseId);
//       const type = parentPremise?.propertyType?.type || "Other";
//       stats.noAccessDist[type] = (stats.noAccessDist[type] || 0) + 1;
//     });

//     // 📊 3. Data for Property Tables & Charts
//     const propStatsList = Object.entries(stats.propertyDist)
//       .map(([name, count]) => ({ name, count }))
//       .sort((a, b) => b.count - a.count);

//     const propPieData = propStatsList.map((item, index) => ({
//       value: item.count,
//       label: item.name,
//       color: ["#2563eb", "#7c3aed", "#db2777", "#f59e0b", "#10b981", "#64748b"][
//         index % 6
//       ],
//       text: `${item.count}`,
//     }));

//     const propBarData = propStatsList.map((item) => ({
//       value: item.count,
//       label: item.name.substring(0, 4),
//       frontColor: "#4f46e5",
//     }));

//     // 💧 4. Data for Services (Water/Elec) Table & Charts
//     const serviceStatsList = [
//       { name: "Normal Electricity", count: stats.elecNormal },
//       { name: "Bulk Electricity", count: stats.elecBulk },
//       { name: "Normal Water", count: stats.waterNormal },
//       { name: "Bulk Water", count: stats.waterBulk },
//     ];

//     const servicesPieData = [
//       {
//         value: stats.elecMeters,
//         label: "Elec",
//         color: "#fbbf24",
//         text: `${stats.elecMeters}`,
//       },
//       {
//         value: stats.waterMeters,
//         label: "Water",
//         color: "#0ea5e9",
//         text: `${stats.waterMeters}`,
//       },
//     ];

//     // 🛑 5. Data for No Access Bars
//     const accessBarData = Object.entries(stats.noAccessDist).map(
//       ([label, value]) => ({
//         value,
//         label: label.substring(0, 4),
//         frontColor: "#ef4444",
//       }),
//     );

//     return {
//       ...stats,
//       propStatsList,
//       propPieData,
//       propBarData,
//       serviceStatsList, // 🎯 For the new table
//       servicesPieData,
//       accessBarData,
//     };
//   }, [premises, transactions]);
// };
