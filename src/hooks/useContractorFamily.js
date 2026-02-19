import { useMemo } from "react";
import { useGetServiceProvidersQuery } from "../redux/spApi";

// src/hooks/useContractorFamily.js
export const useContractorFamily = (mngSpId) => {
  const { data: allSps } = useGetServiceProvidersQuery();

  return useMemo(() => {
    if (!allSps || !mngSpId) return [mngSpId];

    // Find all SPs who report to Zamo's SP
    const subIds = allSps
      .filter((sp) => sp.ownership?.parentMncId === mngSpId)
      .map((sp) => sp.id);

    return [mngSpId, ...subIds]; // The full list of IDs Zamo controls
  }, [allSps, mngSpId]);
};
