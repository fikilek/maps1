import { premiseKV } from "../redux/mmkv";

export const premiseMemory = {
  /**
   * 🎯 THE RESTOCK: Saves a full list (usually from Firestore)
   * We keep the rich structure now!
   */

  saveLmList: (lmPcode, newPremises) => {
    try {
      // 1. 📖 READ: Get the existing list from the box first
      const existingData = premiseKV.getString(`${lmPcode}_meta`);
      let currentList = existingData ? JSON.parse(existingData) : [];

      // 2. 🤝 MERGE: Add the new premises to the list
      // We use a Map or filter to ensure we don't save duplicates of the same ID
      const updatedMap = new Map();

      // Put old ones in the map
      currentList.forEach((p) => updatedMap.set(p.id, p));

      // Overwrite or add the new ones
      newPremises.forEach((p) => updatedMap.set(p.id, p));

      const finalArray = Array.from(updatedMap.values());

      // 3. 💾 SAVE: Put the merged list back in the box
      premiseKV.set(`${lmPcode}_meta`, JSON.stringify(finalArray));

      console.log(
        `✅ [VAULT MERGED]: ${finalArray.length} premises now in ${lmPcode}`,
      );
    } catch (e) {
      console.error("premiseMemory ----saveLmList error", e);
    }
  },

  /**
   * 🎯 THE CAPTURE: Saves or Updates a single premise
   */
  saveSingle: (lmPcode, newPremise) => {
    try {
      // 1. GET: Fetch the ENTIRE existing list for this Municipality
      const rawData = premiseKV.getString(lmPcode);
      let allPremises = [];

      if (rawData) {
        allPremises = JSON.parse(rawData);
      }

      // 2. MODIFY: Check if this premise already exists (Update) or is brand new (Create)
      const existingIndex = allPremises.findIndex(
        (p) => p.id === newPremise.id,
      );

      if (existingIndex > -1) {
        // It exists! Replace the old version with the new one
        console.log(`🔄 Updating existing premise: ${newPremise.id}`);
        allPremises[existingIndex] = newPremise;
      } else {
        // It's brand new! Push it onto the master list
        console.log(`➕ Adding new premise: ${newPremise.id}`);
        allPremises.push(newPremise);
      }

      // 3. WRITE: Save the WHOLE updated list back to MMKV
      // This ensures Erf 214 premises and Erf 215 premises all live together safely
      premiseKV.set(lmPcode, JSON.stringify(allPremises));

      console.log(
        `✅ Success: Total premises in ${lmPcode} now: ${allPremises.length}`,
      );
      return true;
    } catch (error) {
      console.error("❌ Error in saveSingle:", error);
      return false;
    }
  },

  /**
   * 🎯 THE RETRIEVAL
   */
  getLmList: (lmPcode) => {
    const data = premiseKV.getString(`${lmPcode}_meta`);
    return data ? JSON.parse(data) : [];
  },

  clearAll: () => {
    premiseKV.clearAll();
    console.log("☢️ [STORAGE CLEARED]: MMKV premiseKV wiped clean.");
  },
};
