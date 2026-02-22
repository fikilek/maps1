import { useCallback, useState } from "react";

export const useTrnFilter = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // 🎯 THE TACTICAL STATE
  const [filterState, setFilterState] = useState({
    searchQuery: "",
    status: null, // e.g., 'Pending', 'Verified', 'Flagged'
    trnType: null, // e.g., 'Discovery', 'Inspection'
    dateRange: { start: null, end: null },
  });

  const resetFilters = useCallback(() => {
    setFilterState({
      searchQuery: "",
      status: null,
      trnType: null,
      dateRange: { start: null, end: null },
    });
    setShowSearch(false);
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
