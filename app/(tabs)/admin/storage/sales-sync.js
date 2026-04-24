import NetInfo from "@react-native-community/netinfo";
import { skipToken } from "@reduxjs/toolkit/query";
import { FlashList } from "@shopify/flash-list";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import SalesMonthlySyncDoneModal from "../../../../components/SalesMonthlySyncDoneModal";
import SalesMonthlySyncLock from "../../../../components/SalesMonthlySyncLock";
import { ymToLabel } from "../../../../src/features/reports/prepaidRevenue/months/monthUtils";
import { useAuth } from "../../../../src/hooks/useAuth";
import {
  useGetSalesMonthlyByLmAndYmQuery,
  useGetSalesMonthlyLmByLmAndYmsQuery,
} from "../../../../src/redux/salesApi";
import { getMonthlyFromKV } from "../../../../src/storage/salesMonthlyKV";

function normalizeYm(ym) {
  const s = String(ym || "").trim();
  const m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return s;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

export default function SalesSyncScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { activeWorkbaseId, ready } = useAuth();

  const paramYm = normalizeYm(params?.ym);
  const paramLmPcode = String(params?.lmPcode || "").trim();

  const lmPcode = paramLmPcode || activeWorkbaseId || null;

  const [isOnline, setIsOnline] = useState(false);
  const [syncingYm, setSyncingYm] = useState(null);
  const [syncStartedAt, setSyncStartedAt] = useState(null);

  const [showDoneModal, setShowDoneModal] = useState(false);
  const [doneInfo, setDoneInfo] = useState(null);

  useEffect(() => {
    let mounted = true;

    NetInfo.fetch().then((state) => {
      if (!mounted) return;
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });

    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const monthlyLmArgs = ready && lmPcode ? { lmPcode, yms: null } : skipToken;
  const monthlyLm = useGetSalesMonthlyLmByLmAndYmsQuery(monthlyLmArgs);

  const availableYms = useMemo(() => {
    return (monthlyLm.data || [])
      .map((x) => normalizeYm(x?.ym))
      .filter(Boolean);
  }, [monthlyLm.data]);

  const activeSyncYm = syncingYm || null;

  const monthlySyncQuery = useGetSalesMonthlyByLmAndYmQuery(
    ready && lmPcode && activeSyncYm && isOnline
      ? { lmPcode, ym: activeSyncYm }
      : skipToken,
  );

  const monthRows = useMemo(() => {
    return availableYms.map((ym) => {
      const cached = lmPcode ? getMonthlyFromKV(lmPcode, ym) : null;
      const count = Array.isArray(cached?.rows) ? cached.rows.length : 0;
      const isCached = count > 0;
      const isSyncing = syncingYm === ym;

      let status = "NOT ON DEVICE";
      if (isCached) status = "AVAILABLE";
      if (isSyncing) status = "SYNCING";

      return {
        id: ym,
        ym,
        name: ymToLabel(ym),
        count,
        isCached,
        isSyncing,
        status,
        canOpen: isCached,
        canSync: !isCached && isOnline && !syncingYm,
        isActive: paramYm === ym,
      };
    });
  }, [availableYms, lmPcode, syncingYm, isOnline, paramYm]);

  const activeMonthLabel = syncingYm ? ymToLabel(syncingYm) : "Selected Month";

  const currentLoadedCount = useMemo(() => {
    if (!lmPcode || !syncingYm) return 0;

    const rowsFromHook = Array.isArray(monthlySyncQuery.data)
      ? monthlySyncQuery.data.length
      : 0;

    const cached = getMonthlyFromKV(lmPcode, syncingYm);
    const cachedCount = Array.isArray(cached?.rows) ? cached.rows.length : 0;

    return Math.max(rowsFromHook, cachedCount);
  }, [lmPcode, syncingYm, monthlySyncQuery.data]);

  const requestedMonthDoc = useMemo(() => {
    return (
      (monthlyLm.data || []).find((x) => normalizeYm(x?.ym) === syncingYm) ||
      null
    );
  }, [monthlyLm.data, syncingYm]);

  const currentTotalCount =
    typeof requestedMonthDoc?.metersCount === "number"
      ? requestedMonthDoc.metersCount
      : null;

  useEffect(() => {
    if (!lmPcode || !syncingYm) return;

    const cached = getMonthlyFromKV(lmPcode, syncingYm);
    const cachedRows = Array.isArray(cached?.rows) ? cached.rows : [];
    const cachedCount = cachedRows.length;

    // 1) success via KV
    if (cachedCount > 0) {
      const durationMs = syncStartedAt ? Date.now() - syncStartedAt : 0;
      const ratePerSecond =
        durationMs > 0 ? cachedCount / (durationMs / 1000) : 0;

      setDoneInfo({
        ym: syncingYm,
        monthLabel: ymToLabel(syncingYm),
        durationMs,
        totalDownloaded: cachedCount,
        ratePerSecond,
      });

      setSyncingYm(null);
      setShowDoneModal(true);
      return;
    }

    // 2) hard fail
    if (monthlySyncQuery.isError) {
      console.log("❌ Sales sync failed", monthlySyncQuery.error);
      setSyncingYm(null);
      return;
    }

    // 3) success but zero rows
    if (monthlySyncQuery.isSuccess) {
      const rows = Array.isArray(monthlySyncQuery.data)
        ? monthlySyncQuery.data
        : [];

      const totalDownloaded = rows.length;
      const durationMs = syncStartedAt ? Date.now() - syncStartedAt : 0;
      const ratePerSecond =
        durationMs > 0 ? totalDownloaded / (durationMs / 1000) : 0;

      setDoneInfo({
        ym: syncingYm,
        monthLabel: ymToLabel(syncingYm),
        durationMs,
        totalDownloaded,
        ratePerSecond,
      });

      setSyncingYm(null);
      setShowDoneModal(true);
    }
  }, [
    lmPcode,
    syncingYm,
    syncStartedAt,
    monthlySyncQuery.isSuccess,
    monthlySyncQuery.isError,
    monthlySyncQuery.error,
    monthlySyncQuery.data,
  ]);

  const isAnySyncing = !!syncingYm;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Sales Sync",
          headerTitleStyle: { fontSize: 16, fontWeight: "900" },
        }}
      />

      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Prepaid Monthly Sales</Text>
          <Text style={styles.heroSubtitle}>
            Download monthly prepaid sales to this device before opening the
            report.
          </Text>

          <Text style={styles.metaText}>
            Workbase: <Text style={styles.metaValue}>{lmPcode || "NAv"}</Text>
          </Text>

          <Text style={styles.metaText}>
            Network:{" "}
            <Text
              style={[
                styles.metaValue,
                { color: isOnline ? "#166534" : "#B91C1C" },
              ]}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </Text>

          {paramYm ? (
            <Text style={styles.metaText}>
              Requested Month:{" "}
              <Text style={styles.metaValue}>{ymToLabel(paramYm)}</Text>
            </Text>
          ) : null}
        </View>

        <FlashList
          data={monthRows}
          keyExtractor={(item) => item.id}
          estimatedItemSize={80}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.title}>NO MONTHS FOUND</Text>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <View style={[styles.row, item.isActive && styles.rowActive]}>
                <View style={styles.rowLeft}>
                  <Text style={styles.wardName}>
                    {item.name}
                    {item.isActive ? " • ACTIVE" : ""}
                  </Text>

                  <Text style={styles.status}>
                    {item.status} •{" "}
                    <Text style={styles.countHighlight}>{item.count}</Text> rows
                  </Text>
                </View>

                <View style={styles.rowRight}>
                  {!item.canOpen && (
                    <TouchableOpacity
                      style={[
                        styles.syncBtn,
                        (!item.canSync || item.isSyncing) &&
                          styles.syncBtnDisabled,
                      ]}
                      disabled={!item.canSync || item.isSyncing}
                      onPress={() => {
                        setDoneInfo(null);
                        setShowDoneModal(false);
                        setSyncStartedAt(Date.now());
                        setSyncingYm(item.ym);
                      }}
                    >
                      <Text style={styles.btnText}>
                        {item.isSyncing ? "SYNCING..." : "SYNC"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {item.canOpen && (
                    <TouchableOpacity
                      style={styles.openBtn}
                      onPress={() => {
                        router.replace({
                          pathname:
                            "/(tabs)/admin/reports/prepaid-revenue-report",
                          params: { ym: item.ym },
                        });
                      }}
                    >
                      <Text style={styles.btnText}>OPEN</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />

        <SalesMonthlySyncLock
          visible={isAnySyncing}
          lmName={lmPcode || "LOCAL MUNICIPALITY"}
          monthLabel={activeMonthLabel}
          phase="Preparing prepaid monthly sales for local report use..."
          loadedCount={currentLoadedCount}
          totalCount={currentTotalCount}
        />

        <SalesMonthlySyncDoneModal
          visible={showDoneModal}
          lmName={lmPcode || "LOCAL MUNICIPALITY"}
          monthLabel={doneInfo?.monthLabel || "Selected Month"}
          durationMs={doneInfo?.durationMs || 0}
          totalDownloaded={doneInfo?.totalDownloaded || 0}
          ratePerSecond={doneInfo?.ratePerSecond || 0}
          onClose={() => {
            setShowDoneModal(false);
          }}
          onOpenMonth={() => {
            const ym = doneInfo?.ym;
            setShowDoneModal(false);

            if (!ym) return;

            router.replace({
              pathname: "/(tabs)/admin/reports/prepaid-revenue-report",
              params: { ym },
            });
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 12,
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  metaValue: {
    fontWeight: "900",
    color: "#0F172A",
  },

  center: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  row: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  rowActive: {
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  rowLeft: {
    flex: 1,
    paddingRight: 10,
  },
  wardName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: "#64748B",
  },
  countHighlight: {
    fontWeight: "900",
    color: "#0F172A",
  },

  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  syncBtn: {
    minWidth: 86,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  syncBtnDisabled: {
    opacity: 0.5,
  },

  openBtn: {
    minWidth: 86,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  btnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
