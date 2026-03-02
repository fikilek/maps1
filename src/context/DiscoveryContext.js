// src/context/DiscoveryContext.js
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const DiscoveryContext = createContext(null);

export function DiscoveryProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  console.log(`isVisible`, isVisible);

  // Mission payload
  const [mission, setMission] = useState({
    premiseId: null,
    hasAccess: null,
    meterType: null, // "water" | "electricity"
  });
  // console.log(`mission`, mission);

  const openMissionDiscovery = useCallback((payload = {}) => {
    // console.log(`payload`, payload);
    // payload: { premiseId }
    setMission((prev) => ({
      ...prev,
      ...payload,
    }));
    setIsVisible(true);
  }, []);

  const closeMissionDiscovery = useCallback(() => {
    setIsVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      isVisible,
      mission,
      setMission,
      openMissionDiscovery,
      closeMissionDiscovery,
    }),
    [isVisible, mission, openMissionDiscovery, closeMissionDiscovery],
  );

  return (
    <DiscoveryContext.Provider value={value}>
      {children}
    </DiscoveryContext.Provider>
  );
}

export function useDiscovery() {
  const ctx = useContext(DiscoveryContext);
  if (!ctx)
    throw new Error("useDiscovery must be used within DiscoveryProvider");
  return ctx;
}
