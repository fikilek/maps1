// src/context/GeoContext.js
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { useGetLocalMunicipalityByIdQuery } from "../redux/geoApi";

export const GeoContext = createContext(null);

const INITIAL_GEO = {
  selectedLm: null,
  selectedWard: null,
  selectedErf: null,
  selectedPremise: null,
  selectedMeter: null,

  lastSelectionType: null,
  flightSignal: 0, // counter, not Date.now
};

export const GeoProvider = ({ children }) => {
  const { profile } = useAuth();
  const workbaseId = profile?.access?.activeWorkbase?.id;

  const [geoState, setGeoState] = useState(INITIAL_GEO);

  useEffect(() => {
    console.log("GeoProvider -- selectedLm?.name", geoState.selectedLm?.name);
    console.log("GeoProvider -- selectedWard", geoState.selectedWard);
    console.log("GeoProvider -- flightSignal", geoState.flightSignal);
  }, [
    geoState.selectedLm?.id,
    geoState.selectedLm?.name,
    geoState.selectedWard?.id,
    geoState.flightSignal,
  ]);

  // 1) BOOT: set placeholder LM immediately when workbaseId appears/changes
  useEffect(() => {
    if (!profile) {
      setGeoState(INITIAL_GEO);
      return;
    }

    if (!workbaseId) return;

    setGeoState((prev) => {
      // already aligned
      if (prev.selectedLm?.id === workbaseId) return prev;

      // new workbase => reset below + trigger pilot once
      return {
        ...INITIAL_GEO,
        selectedLm: { id: workbaseId },
        lastSelectionType: "LM",
        flightSignal: prev.flightSignal + 1,
      };
    });
  }, [profile, workbaseId]);

  // 2) HYDRATE: fetch full LM doc
  const { data: remoteLmDoc } = useGetLocalMunicipalityByIdQuery(workbaseId, {
    skip: !workbaseId,
  });

  useEffect(() => {
    if (!profile || !remoteLmDoc) return;

    // ✅ HARD GUARD: ignore late LM docs that don't match current workbaseId
    if (remoteLmDoc.id !== workbaseId) return;

    setGeoState((prev) => {
      // If already on this LM id, just hydrate the full doc (without reset)
      if (prev.selectedLm?.id === remoteLmDoc.id) {
        // upgrade placeholder {id} to full doc
        const prevHasName = !!prev.selectedLm?.name;
        if (prevHasName) return prev;

        return {
          ...prev,
          selectedLm: remoteLmDoc,
          flightSignal: prev.flightSignal + 1,
        };
      }

      // True LM switch (rare here, because BOOT already set selectedLm.id)
      return {
        ...INITIAL_GEO,
        selectedLm: remoteLmDoc,
        lastSelectionType: "LM",
        flightSignal: prev.flightSignal + 1,
      };
    });
  }, [profile, remoteLmDoc, workbaseId]);

  /**
   * updateGeo(updates, options)
   * options.silent === true => does NOT bump flightSignal
   */
  const updateGeo = useCallback((updates, options = {}) => {
    setGeoState((prev) => {
      const silent = !!options.silent;

      let next = { ...prev, ...updates };

      // cascade clears (IMPORTANT: use "in" so null is still treated as update)
      if ("selectedLm" in updates) {
        next.selectedWard = null;
        next.selectedErf = null;
        next.selectedPremise = null;
        next.selectedMeter = null;
      } else if ("selectedWard" in updates) {
        next.selectedErf = null;
        next.selectedPremise = null;
        next.selectedMeter = null;
      } else if ("selectedErf" in updates) {
        next.selectedPremise = null;
        next.selectedMeter = null;
      } else if ("selectedPremise" in updates) {
        next.selectedMeter = null;
      }

      if (!silent) {
        next.flightSignal = prev.flightSignal + 1;
      }

      return next;
    });
  }, []);

  /**
   * resetGeo()
   * Clears UI selection WITHOUT triggering Pilot.
   * Keeps LM (so app doesn't go blank after reset).
   */
  const resetGeo = useCallback(() => {
    setGeoState((prev) => ({
      ...INITIAL_GEO,
      selectedLm: prev.selectedLm, // ✅ keep LM
      flightSignal: prev.flightSignal, // ✅ no signal bump
    }));
  }, []);

  const value = useMemo(
    () => ({ geoState, updateGeo, resetGeo, setGeoState }),
    [geoState, updateGeo, resetGeo],
  );

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
};

export const useGeo = () => {
  const ctx = useContext(GeoContext);
  if (!ctx) throw new Error("useGeo must be used within GeoProvider");
  return ctx;
};
