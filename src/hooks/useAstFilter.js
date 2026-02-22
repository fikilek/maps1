import { useCallback, useState } from "react";

export const useAstFilter = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // The core state for the Meter filtering engine
  const [filterState, setFilterState] = useState({
    searchQuery: "",
    mosiGroup: null, // G1, G2, G3, G4, R5
    status: null, // Active, Disconnected, Tampered
    dateRange: { start: null, end: null },
  });

  const resetFilters = useCallback(() => {
    setFilterState({
      searchQuery: "",
      mosiGroup: null,
      status: null,
      dateRange: { start: null, end: null },
    });
  }, []);

  return {
    showFilters,
    setShowFilters,
    showStats,
    setShowStats,
    showSearch,
    setShowSearch,
    filterState,
    setFilterState,
    resetFilters,
  };
};
