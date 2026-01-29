import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useGetLocalMunicipalityByIdQuery } from "../redux/geoApi";
import { geoKV } from "../redux/mmkv";

export const GeoContext = createContext();

const INITIAL_GEO = {
  selectedLm: null, // Full LM Doc
  selectedWard: null, // Full Ward Doc
  selectedErf: null, // Full Erf Doc
  selectedPremise: null, // Full Premise Doc
  selectedMeter: null, // Full Meter Doc
};

export const GeoProvider = ({ children }) => {
  const { profile } = useAuth(); // 🎯 The Life Support (useAuth)
  const workbaseId = profile?.access?.activeWorkbase?.id;
  // console.log(`GeoProvider ----workbaseId`, workbaseId);

  // 🏛️ 1. State initialization from Disk
  const [geoState, setGeoState] = useState(() => {
    const saved = geoKV.getString("geo_session");
    return saved ? JSON.parse(saved) : INITIAL_GEO;
  });
  // console.log(`GeoProvider ----geoState`, geoState);
  // console.log(`GeoProvider ----geoState?.selectedErf`, geoState?.selectedErf);

  // 🏛️ 2. The Law of the Land: Life and Death

  useEffect(() => {
    // RULE 2: User signed out - GOC dead
    if (!profile) {
      console.log("💀 [GOC]: User logged out. Killing session...");

      // Reset RAM
      setGeoState(INITIAL_GEO);

      // Reset DISK (The safe way)
      try {
        if (geoKV && typeof geoKV.delete === "function") {
          geoKV.delete("geo_session");
          console.log("💀 [GOC]: geo_sessionUser logged out. 'geo_session' ");
        } else {
          // Fallback if your geoKV wrapper is restricted
          geoKV.set("geo_session", "");
          console.log(
            "💀 [GOC]: geo_sessionUser logged out. 'geo_session' cleared",
          );
        }
      } catch (e) {
        console.warn("⚠️ [GOC]: Disk clear failed, but RAM is wiped.", e);
      }
      return;
    }
    // RULE 1: User signed in - GOC Breath
    // If we have a profile but the workbase changed, we must re-hydrate
    if (workbaseId && geoState.selectedLm?.id !== workbaseId) {
      console.log(
        "🫁 [GOC]: Breathing... aligning with activeWorkbase:",
        workbaseId,
      );

      const saved = geoKV.getString("geo_session");
      const parsedSaved = saved ? JSON.parse(saved) : null;

      // If the saved session matches the new workbase, use it!
      if (parsedSaved && parsedSaved.selectedLm?.id === workbaseId) {
        console.log("💾 [GOC]: Restored existing session for:", workbaseId);
        setGeoState(parsedSaved);
      } else {
        // Otherwise, it's a brand new town. Start fresh.
        console.log(
          "✨ [GOC]: New Workbase detected. Starting clean slate for:",
          workbaseId,
        );
        setGeoState({ ...INITIAL_GEO, selectedLm: { id: workbaseId } });
      }
    }
  }, [profile, workbaseId, geoState.selectedLm?.id]);

  // 🏛️ 3. Automatic Hydration from API
  const { data: remoteLmDoc } = useGetLocalMunicipalityByIdQuery(workbaseId, {
    skip: !workbaseId,
  });

  useEffect(() => {
    // If the API returns a doc that doesn't match our state, force an update
    if (remoteLmDoc && geoState.selectedLm?.id !== remoteLmDoc.id) {
      updateGeo({ selectedLm: remoteLmDoc });
    }
  }, [remoteLmDoc, geoState.selectedLm?.id]);

  // 🏛️ 4. Persistent Mirror (Flight Recorder)
  useEffect(() => {
    if (profile) {
      geoKV.set("geo_session", JSON.stringify(geoState));
    }
  }, [geoState, profile]);

  const updateGeo = (updates) => {
    setGeoState((prev) => {
      let newState = { ...prev, ...updates };

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
    <GeoContext.Provider value={{ geoState, setGeoState }}>
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
