import { createMMKV } from "react-native-mmkv";

export const premiseDraftKV = createMMKV({
  id: "premise-drafts-storage",
});

const DRAFTS_KEY = "premise_drafts";

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function buildDraftSummary(draft = {}) {
  const strNo = String(draft?.address?.strNo || "").trim();
  const strName = String(draft?.address?.strName || "").trim();
  const strType = String(draft?.address?.strType || "").trim();

  const propertyType = String(draft?.propertyType?.type || "NAv").trim();
  const propertyName = String(draft?.propertyType?.name || "").trim();
  const unitNo = String(draft?.propertyType?.unitNo || "").trim();

  const addressLine = [strNo, strName, strType]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    erfNo: String(draft?.erfNo || "NAv").trim() || "NAv",
    addressLine: addressLine || "NAv",
    propertyType: propertyType || "NAv",
    propertyName: propertyName || "NAv",
    unitNo: unitNo || "NAv",
  };
}

export function getPremiseDrafts() {
  const raw = premiseDraftKV.getString(DRAFTS_KEY);
  const drafts = safeParse(raw, []);
  return Array.isArray(drafts) ? drafts : [];
}

export function getPremiseDraftById(id) {
  if (!id) return null;
  return getPremiseDrafts().find((item) => item?.id === id) || null;
}

export function savePremiseDraft(draftPayload = {}) {
  const premiseId = String(draftPayload?.id || "").trim();

  if (!premiseId) {
    throw new Error("savePremiseDraft requires draftPayload.id");
  }

  const now = new Date().toISOString();
  const drafts = getPremiseDrafts();
  console.log(`drafts`, drafts);

  const existingIndex = drafts.findIndex((item) => item?.id === premiseId);
  const existing = existingIndex >= 0 ? drafts[existingIndex] : null;

  const nextDraftItem = {
    id: premiseId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    summary: buildDraftSummary(draftPayload),
    draft: draftPayload,
  };

  if (existingIndex >= 0) {
    drafts[existingIndex] = nextDraftItem;
  } else {
    drafts.unshift(nextDraftItem);
  }

  console.log(`before save drafts`, drafts);
  premiseDraftKV.set(DRAFTS_KEY, JSON.stringify(drafts));

  return nextDraftItem;
}

export function removePremiseDraft(id) {
  if (!id) return;

  const drafts = getPremiseDrafts().filter((item) => item?.id !== id);
  premiseDraftKV.set(DRAFTS_KEY, JSON.stringify(drafts));
}

export function clearPremiseDrafts() {
  premiseDraftKV.delete(DRAFTS_KEY);
}

export function hasPremiseDraft(id) {
  return !!getPremiseDraftById(id);
}

export function countPremiseDrafts() {
  return getPremiseDrafts().length;
}
