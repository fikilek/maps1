// /src/hooks/useUserStats.js
import { useMemo } from "react";

export const useUserStats = (users, transactions, filters) => {
  return useMemo(() => {
    return users.map((user) => {
      // 🕵️ Filter transactions belonging to this specific User
      const userTrns = transactions.filter((t) => t.uid === user.uid);

      // 📊 Calculate Specific Meter Actions
      const stats = {
        discoveries: userTrns.filter(
          (t) => t.accessData?.trnType === "METER_DISCOVERY",
        ).length,
        installations: userTrns.filter(
          (t) => t.accessData?.trnType === "METER_INSTALLATION",
        ).length,
        disconnections: userTrns.filter(
          (t) => t.accessData?.trnType === "METER_DISCONNECTION",
        ).length,
        reconnections: userTrns.filter(
          (t) => t.accessData?.trnType === "METER_RECONNECTION",
        ).length,
        inspections: userTrns.filter(
          (t) => t.accessData?.trnType === "METER_INSPECTION",
        ).length,
        removals: userTrns.filter(
          (t) => t.accessData?.trnType === "METER_REMOVAL",
        ).length,
      };

      return {
        uid: user.uid,
        displayName: `${user.profile?.surname} ${user.profile?.name}`,
        team: user.employment?.team || "Unassigned",
        serviceProvider: user.employment?.serviceProvider?.name || "N/A",
        role: user.employment?.role || "Field Agent",
        totalTrns: userTrns.length,
        ...stats,
      };
    });
  }, [users, transactions, filters]);
};
