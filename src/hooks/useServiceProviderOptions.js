// src/hooks/useServiceProviderOptions.js
import { useMemo } from "react";
import { useGetServiceProvidersQuery } from "../redux/spApi";

export const useServiceProviderOptions = () => {
  const { data: sps, isLoading, isError } = useGetServiceProvidersQuery();

  const options = useMemo(() => {
    if (!sps) return [];

    // 🎯 Mapping the Firestore sibling 'profile' to the dropdown
    return sps.map((sp) => ({
      id: sp.id,
      name: sp.profile?.name?.trim() || "Unknown Contractor",
      classification: sp.profile?.classification || "MNC",
    }));
  }, [sps]);

  return { options, isLoading, isError };
};
