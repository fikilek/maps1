// src/context/InstallationContext.js
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const InstallationContext = createContext(null);

export function InstallationProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);

  const [mission, setMission] = useState({
    premiseId: null,
    premise: null,
    hasAccess: null,
    meterType: null,
  });
  // console.log(`mission`, mission);

  const openMissionInstallation = useCallback((payload = {}) => {
    // console.log(`payload`, payload);
    // payload: { premiseId }
    setMission((prev) => ({
      ...prev,
      ...payload,
    }));
    setIsVisible(true);
  }, []);

  const closeMissionInstallation = useCallback(() => {
    setIsVisible(false);
    setMission({
      premiseId: null,
      premise: null,
      hasAccess: null,
      meterType: null,
    });
  }, []);

  const value = useMemo(
    () => ({
      isVisible,
      mission,
      setMission,
      openMissionInstallation,
      closeMissionInstallation,
    }),
    [isVisible, mission, openMissionInstallation, closeMissionInstallation],
  );

  return (
    <InstallationContext.Provider value={value}>
      {children}
    </InstallationContext.Provider>
  );
}

export function useInstallation() {
  const ctx = useContext(InstallationContext);
  if (!ctx)
    throw new Error("useInstallation must be used within InstallationProvider");
  return ctx;
}
