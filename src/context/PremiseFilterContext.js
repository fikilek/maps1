import { createContext, useContext, useState } from "react";

export const PremiseFilterContext = createContext();

export const PremiseFilterProvider = ({ children }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [filterState, setFilterState] = useState({
    propertyTypes: [],
    wards: [],
    searchQuery: "",
  });

  const value = {
    showSearch,
    setShowSearch,
    showFilters,
    setShowFilters,
    showStats,
    setShowStats,
    filterState,
    setFilterState,
  };

  return (
    <PremiseFilterContext.Provider value={value}>
      {children}
    </PremiseFilterContext.Provider>
  );
};

export const usePremiseFilter = () => useContext(PremiseFilterContext);
