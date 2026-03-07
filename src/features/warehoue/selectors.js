export const selectErfPackBestEffort = (state, lmPcode, wardPcode) => {
  const queries = state.erfsApi?.queries || {};
  const key = `getErfsByLmPcodeWardPcode(${lmPcode}__${wardPcode})`;

  const current = queries[key]?.data;

  if (current) return current;

  const fallback = Object.values(queries)
    .map((q) => q?.data)
    .find((d) => d?.sync?.lmPcode === lmPcode && d?.metaEntries?.length);

  return (
    fallback || {
      metaEntries: [],
      geoEntries: {},
      sync: { status: "idle" },
    }
  );
};
