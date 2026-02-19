import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useGetLocalMunicipalityByIdQuery } from "../redux/geoApi";
import { geoKV } from "../redux/mmkv";

export const GeoContext = createContext();

// 🎯 INITIAL STATE: Now includes the Flight Signal
const INITIAL_GEO = {
  selectedLm: null, // Full LM Doc
  selectedWard: null, // Full Ward Doc
  selectedErf: null, // Full Erf Doc
  selectedPremise: null, // Full Premise Doc
  selectedMeter: null, // Full Meter Doc
  // flightSignal: 0, // 🔔 The trigger for forced flights
  lastSelectionType: "LM",
  flightSignal: Date.now(),
};

export const GeoProvider = ({ children }) => {
  // console.log(`GeoProvider ---mounted`);
  const { profile } = useAuth();
  const workbaseId = profile?.access?.activeWorkbase?.id;

  // 🏛️ 1. State initialization from Disk
  const [geoState, setGeoState] = useState(() => {
    const saved = geoKV.getString("geo_session");
    // Ensure that even old saved sessions get a flightSignal if they didn't have one
    return saved ? { ...INITIAL_GEO, ...JSON.parse(saved) } : INITIAL_GEO;
  });
  // console.log(`GeoProvider ----geoState`, geoState);
  // console.log(`GeoProvider ----geoState?.selectedLm`, geoState?.selectedLm);

  // 🏛️ 2. The Law of the Land (Login/Logout Logic)
  useEffect(() => {
    if (!profile) {
      console.log("💀 [GOC]: User logged out. Wiping session...");

      // 1. Reset RAM immediately
      setGeoState(INITIAL_GEO);

      // 2. Reset DISK safely
      try {
        if (geoKV) {
          // 🎯 Check which method exists to avoid the TypeError
          if (typeof geoKV.delete === "function") {
            geoKV.delete("geo_session");
          } else {
            // Fallback: Setting to an empty string or null effectively clears it
            geoKV.set("geo_session", "");
          }
          // console.log("✅ [GOC]: Disk session cleared.");
        }
      } catch (e) {
        console.warn("⚠️ [GOC]: Disk clear failed, but RAM is wiped.", e);
      }
      return;
    }

    if (workbaseId && geoState.selectedLm?.id !== workbaseId) {
      const saved = geoKV.getString("geo_session");
      const parsedSaved = saved ? JSON.parse(saved) : null;

      if (parsedSaved && parsedSaved.selectedLm?.id === workbaseId) {
        setGeoState({
          ...INITIAL_GEO,
          ...parsedSaved,
          flightSignal: Date.now(),
        });
      }
      // else {
      //   // console.log("✨ [GOC]: New Workbase detected:", workbaseId);
      //   setGeoState({ ...INITIAL_GEO, selectedLm: { id: workbaseId } });
      // }
    }
  }, [profile, workbaseId, geoState.selectedLm?.id]);

  // 🏛️ 3. Automatic Hydration from API
  const { data: remoteLmDoc } = useGetLocalMunicipalityByIdQuery(workbaseId, {
    skip: !workbaseId,
  });

  // 🏛️ 3. Automatic Hydration from API
  useEffect(() => {
    if (remoteLmDoc && geoState.selectedLm?.id !== remoteLmDoc.id) {
      console.log(
        `🌍 [GEO]: Teleporting to ${remoteLmDoc.name}. Resetting state.`,
      );

      setGeoState({
        ...INITIAL_GEO, // 🎯 Start with a 100% clean slate
        selectedLm: remoteLmDoc, // 📍 Immediately set the NEW jurisdiction
        flightSignal: Date.now(), // 🔔 Ring the bell for the map to fly
      });
    }
  }, [remoteLmDoc]);

  // 🏛️ 4. Persistent Mirror
  useEffect(() => {
    if (profile) {
      geoKV.set("geo_session", JSON.stringify(geoState));
    }
  }, [geoState, profile]);

  // 🎯 5. THE SOVEREIGN UPDATE (Internal Utility)
  // This helper ensures that if you update one part of the state,
  // we clean up the levels below and potentially "ring the bell".
  const updateGeo = (updates) => {
    setGeoState((prev) => {
      let newState = {
        ...prev,
        ...updates,
        flightSignal: Date.now(),
      };

      // 🏛️ THE RULE OF THE DESCENT (Cascading Clears)
      if (updates.selectedLm) {
        newState.selectedWard = null;
        newState.selectedErf = null;
        newState.selectedPremise = null;
        newState.selectedMeter = null;
      } else if (updates.selectedWard) {
        newState.selectedErf = null;
        newState.selectedPremise = null;
        newState.selectedMeter = null;
      } else if (updates.selectedErf) {
        newState.selectedPremise = null;
        newState.selectedMeter = null;
      } else if (updates.selectedPremise) {
        newState.selectedMeter = null;
      }

      return newState;
    });
  };

  return (
    <GeoContext.Provider value={{ geoState, updateGeo }}>
      {children}
    </GeoContext.Provider>
  );
};

export const useGeo = () => {
  const context = useContext(GeoContext);
  if (context === undefined) {
    throw new Error("❌ useGeo must be used within a GeoProvider");
  }
  return context;
};
