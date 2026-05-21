// src/context/GeoContext.js
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { useGetLocalMunicipalityByIdQuery } from "../redux/geoApi";
import {
  getRestorableLastActiveScope,
  saveLastActiveScope,
} from "../storage/wardScopeStorage";

export const GeoContext = createContext(null);

// DEFAULT GEO BOOT MODEL
// Stage 0: LM unknown, Ward unknown
//   - selectedLm = null
//   - selectedWard = null
//   - selectedErf = null
//   - selectedPremise = null
//   - selectedMeter = null
//
// Stage 1: LM known from user workbase, Ward unknown
//   - selectedLm = user workbase
//   - selectedWard = null
//   - selectedErf = null
//   - selectedPremise = null
//   - selectedMeter = null
//
// Stage 2: LM known, Ward restored/selected
//   - selectedLm = active LM
//   - selectedWard = active Ward
//   - selectedErf = null
//   - selectedPremise = null
//   - selectedMeter = null
//
// IMPORTANT:
// Warehouse operational data must remain closed until both LM and Ward exist.
// MMKV is only used here to record/replay the last active scope pointer.
// Operational data still flows RTK Query -> WarehouseContext -> UI.

const INITIAL_GEO = {
  selectedLm: null,
  selectedWard: null,
  selectedErf: null,
  selectedPremise: null,
  selectedMeter: null,

  lastSelectionType: null,
  flightSignal: 0, // counter, not Date.now
};

function readUidFromAuth(authCtx, profile) {
  return (
    authCtx?.auth?.uid ||
    authCtx?.uid ||
    profile?.uid ||
    profile?.id ||
    profile?.identity?.uid ||
    null
  );
}

function getGeoPcode(entity) {
  return entity?.pcode || entity?.id || null;
}

export const GeoProvider = ({ children }) => {
  const authCtx = useAuth();
  const { profile } = authCtx || {};

  const uid = readUidFromAuth(authCtx, profile);
  const workbaseId = profile?.access?.activeWorkbase?.id;
  const restoreAttemptRef = useRef(null);

  const [geoState, setGeoState] = useState(INITIAL_GEO);

  useEffect(() => {
    if (!profile) {
      restoreAttemptRef.current = null;
      setGeoState(INITIAL_GEO);
      return;
    }

    if (!workbaseId) return;

    setGeoState((prev) => {
      // if a selection already exists, don't overwrite it here
      if (prev.selectedLm) return prev;

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

    // ignore late docs that don't match profile workbase
    if (remoteLmDoc.id !== workbaseId) return;

    setGeoState((prev) => {
      // only hydrate the current LM if it matches and is still placeholder
      if (prev.selectedLm?.id !== remoteLmDoc.id) return prev;

      const prevHasName = !!prev.selectedLm?.name;
      if (prevHasName) return prev;

      return {
        ...prev,
        selectedLm: remoteLmDoc,
        flightSignal: prev.flightSignal + 1,
      };
    });
  }, [profile, remoteLmDoc, workbaseId]);

  // 3) RESTORE: replay last active ward pointer after user + workbase + LM are known.
  useEffect(() => {
    if (!profile || !uid || !workbaseId || !remoteLmDoc) return;

    const lmPcode = getGeoPcode(remoteLmDoc);
    if (!lmPcode) return;

    const restoreKey = `${uid}__${workbaseId}__${lmPcode}`;
    if (restoreAttemptRef.current === restoreKey) return;

    // Do not override a ward the user already selected in this session.
    if (geoState?.selectedWard?.id || geoState?.selectedWard?.pcode) {
      restoreAttemptRef.current = restoreKey;
      return;
    }

    const restorableScope = getRestorableLastActiveScope({
      uid,
      activeWorkbaseId: workbaseId,
      lmPcode,
    });

    restoreAttemptRef.current = restoreKey;

    if (!restorableScope?.wardPcode) return;

    setGeoState((prev) => {
      // If something selected a ward while this effect was resolving, do not override it.
      if (prev?.selectedWard?.id || prev?.selectedWard?.pcode) return prev;

      const ward = restorableScope.ward || {
        id: restorableScope.wardPcode,
        pcode: restorableScope.wardPcode,
        name: `Ward ${restorableScope.wardPcode}`,
      };

      return {
        ...INITIAL_GEO,
        selectedLm: remoteLmDoc,
        selectedWard: ward,
        lastSelectionType: "WARD",
        flightSignal: prev.flightSignal + 1,
      };
    });
  }, [profile, uid, workbaseId, remoteLmDoc, geoState?.selectedWard?.id, geoState?.selectedWard?.pcode]);

  // 4) RECORD: whenever a valid LM + Ward scope is active, save the pointer to MMKV.
  useEffect(() => {
    if (!profile || !uid || !workbaseId) return;

    const lm = geoState?.selectedLm || null;
    const ward = geoState?.selectedWard || null;

    const lmPcode = getGeoPcode(lm);
    const wardPcode = getGeoPcode(ward);

    if (!lmPcode || !wardPcode) return;

    saveLastActiveScope({
      uid,
      activeWorkbaseId: workbaseId,
      lmPcode,
      wardPcode,
      lm,
      ward,
    });
  }, [
    profile,
    uid,
    workbaseId,
    geoState?.selectedLm?.id,
    geoState?.selectedLm?.pcode,
    geoState?.selectedLm?.name,
    geoState?.selectedWard?.id,
    geoState?.selectedWard?.pcode,
    geoState?.selectedWard?.name,
    geoState?.selectedWard?.code,
  ]);

  /**
   * updateGeo(updates, options)
   * options.silent === true => does NOT bump flightSignal
   */

  const updateGeo = useCallback((updates, options = {}) => {
    setGeoState((prev) => {
      const silent = !!options.silent;

      let next = { ...prev, ...updates };

      // cascade clears
      if ("selectedLm" in updates) {
        const prevLmId = prev?.selectedLm?.id || null;
        const nextLmId = updates?.selectedLm?.id || null;
        const lmChanged = prevLmId !== nextLmId;

        if (lmChanged) {
          next.selectedWard = null;
        }

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
   * setActiveWorkbaseWard({ lm, ward })
   * Atomic LM + Ward switch.
   * This is the new AppHeader switch path.
   */
  const setActiveWorkbaseWard = useCallback(({ lm, ward }) => {
    if (!lm?.id || !ward?.id) return;

    setGeoState((prev) => ({
      ...INITIAL_GEO,
      selectedLm: lm,
      selectedWard: ward,
      lastSelectionType: "WARD",
      flightSignal: prev.flightSignal + 1,
    }));
  }, []);

  /**
   * resetGeo()
   * Clears UI selection WITHOUT triggering Pilot.
   * Keeps LM + Ward so the active scope remains stable.
   */
  const resetGeo = useCallback(() => {
    setGeoState((prev) => ({
      ...INITIAL_GEO,
      selectedLm: prev.selectedLm,
      selectedWard: prev.selectedWard,
      flightSignal: prev.flightSignal,
    }));
  }, []);

  const value = useMemo(
    () => ({
      geoState,
      updateGeo,
      resetGeo,
      setGeoState,
      setActiveWorkbaseWard,
    }),
    [geoState, updateGeo, resetGeo, setActiveWorkbaseWard],
  );

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
};

export const useGeo = () => {
  const ctx = useContext(GeoContext);
  if (!ctx) throw new Error("useGeo must be used within GeoProvider");
  return ctx;
};
