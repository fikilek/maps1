// src/selectors/warehouseSelectors.js

// ✅ Robust time parser (handles Firestore Timestamp, {seconds}, ISO strings)
const toMillis = (v) => {
  if (!v) return 0;

  // Firestore Timestamp
  if (typeof v?.toMillis === "function") return v.toMillis();

  // { seconds, nanoseconds }
  if (typeof v?.seconds === "number") return v.seconds * 1000;

  // ISO string
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};

export const buildGeoLibrary = ({ wards = [], erfGeoEntries = {} }) => {
  const geoLibrary = { ...(erfGeoEntries || {}) };

  const wardsArr = Array.isArray(wards) ? wards : [];

  wardsArr.forEach((w) => {
    if (w?.id) geoLibrary[w.id] = w;
  });

  return geoLibrary;
};

export const selectFilteredWards = ({ wards = [] }, geo) => {
  const wardsArr = Array.isArray(wards) ? wards : [];

  // Always return the full LM ward pool.
  // Do NOT collapse to selectedWard only.
  // This keeps GCS, ErfsScreen, and MapsScreen able to switch wards freely.
  return [...wardsArr].sort((a, b) => (a.code ?? 0) - (b.code ?? 0));
};

export const selectFilteredErfs = ({ erfs = [] }, geo) => {
  const erfsArr = Array.isArray(erfs) ? erfs : [];

  let pool = erfsArr;

  if (geo.selectedErf) {
    pool = pool.filter((e) => e.id === geo.selectedErf.id);
  } else if (geo.selectedWard) {
    const wardId = geo.selectedWard.id;
    pool = pool.filter(
      (e) => e.admin?.ward?.id === wardId || e.admin?.ward?.pcode === wardId,
    );
  }

  return [...pool].sort(
    (a, b) =>
      toMillis(b?.metadata?.updatedAt) - toMillis(a?.metadata?.updatedAt),
  );
};

export const selectFilteredPrems = ({ prems = [], erfById }, geo) => {
  const premsArr = Array.isArray(prems) ? prems : [];

  if (geo.selectedPremise) {
    return premsArr.filter((p) => p.id === geo.selectedPremise.id);
  }

  if (geo.selectedErf) {
    return premsArr.filter((p) => p.erfId === geo.selectedErf.id);
  }

  if (geo.selectedWard) {
    const wardId = geo.selectedWard.id;
    return premsArr.filter((p) => {
      const parentErf = erfById?.get(p.erfId);
      return (
        parentErf?.admin?.ward?.id === wardId ||
        parentErf?.admin?.ward?.pcode === wardId
      );
    });
  }

  return premsArr;
};

export const selectFilteredMeters = ({ meters = [] }, geo) => {
  const metersArr = Array.isArray(meters) ? meters : [];

  if (geo.selectedMeter) {
    return metersArr.filter((m) => m.id === geo.selectedMeter.id);
  }

  if (geo.selectedPremise) {
    return metersArr.filter(
      (m) => m.accessData?.premise?.id === geo.selectedPremise.id,
    );
  }

  if (geo.selectedErf) {
    return metersArr.filter((m) => m.accessData?.erfId === geo.selectedErf.id);
  }

  if (geo.selectedWard) {
    const wardKey = geo.selectedWard?.pcode || geo.selectedWard?.id;
    return metersArr.filter(
      (m) => m.accessData?.parents?.wardPcode === wardKey,
    );
  }

  return metersArr;
};

export const selectFilteredTrns = ({ trns = [] }, geo) => {
  const trnsArr = Array.isArray(trns) ? trns : [];

  if (geo.selectedPremise) {
    return trnsArr.filter(
      (t) => t.accessData?.premise?.id === geo.selectedPremise.id,
    );
  }

  if (geo.selectedErf) {
    return trnsArr.filter((t) => t.accessData?.erfId === geo.selectedErf.id);
  }

  if (geo.selectedWard) {
    return trnsArr.filter((t) => t.accessData?.wardId === geo.selectedWard.id);
  }

  return trnsArr;
};
