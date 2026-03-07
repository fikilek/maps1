export function tsToMs(ts) {
  if (!ts) return null;

  // Firestore Timestamp shape
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;

  // Already ms
  if (typeof ts === "number") return ts;

  // ISO string
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isFinite(ms) ? ms : null;
  }

  return null;
}

export function normalizeProfile(profile) {
  if (!profile) return profile;

  const updatedAtMs = tsToMs(profile?.metadata?.updatedAt);
  const createdAtMs = tsToMs(profile?.metadata?.createdAt);

  return {
    ...profile,
    metadata: {
      ...profile.metadata,
      // ✅ replace timestamp objects with numbers
      updatedAtMs,
      createdAtMs,
      // optional: remove raw timestamp fields to avoid accidental usage
      updatedAt: undefined,
      createdAt: undefined,
    },
  };
}
