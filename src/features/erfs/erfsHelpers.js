// src/utils/formatters.js

/**
 * Converts a Pcode or full Ward object into a clean display number
 * @param {string|object} ward - Either "ZA1048001" or the Ward data object
 */
export const getWardDisplay = (ward) => {
  if (!ward) return "N/A";

  // 1. If we passed the full ward object from your JSON sample
  if (typeof ward === "object" && ward.code) {
    return `Ward ${ward.code}`;
  }

  // 2. If we only have the Pcode string (ZA1048001)
  // We extract the last digits, which correspond to the 'code'
  const pcode = typeof ward === "string" ? ward : ward.wardPcode;
  const match = pcode?.match(/\d+$/);

  if (match) {
    // parseInt removes leading zeros (001 -> 1) to match your "code: 1" logic
    return `Ward ${parseInt(match[0], 10)}`;
  }

  return pcode;
};
