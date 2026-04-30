import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useGeo } from "../../../../src/context/GeoContext";
import { useWarehouse } from "../../../../src/context/WarehouseContext";
import { useGetSalesAtomicByMeterNoQuery } from "../../../../src/redux/salesApi";
import {
  buildReportContext,
  buildReportTileMetrics,
  buildReportTiles,
  findReportAstById,
  findReportErfById,
  findReportPremiseById,
  getReportErfId,
  getReportPremiseId,
} from "../../../../src/utils/astReportUtils";

const normalizeMeterNo = (value) => String(value || "").trim();

const getTrnMeterNo = (trn) =>
  normalizeMeterNo(
    trn?.ast?.astData?.astNo ||
      trn?.accessData?.astData?.astNo ||
      trn?.meterNo ||
      trn?.derived?.meterNo ||
      "NAv",
  );

const getTrnUpdatedAt = (trn) =>
  trn?.metadata?.updatedAt || trn?.metadata?.createdAt || "NAv";

const getSaleUpdatedAt = (sale) =>
  sale?.txAtISO || sale?.ingestedAtISO || sale?.updatedAt || "NAv";

const buildHubTimelineRowsForMetrics = ({ trns = [], sales = [], meterNo }) => {
  const normalizedMeterNo = normalizeMeterNo(meterNo);
  if (!normalizedMeterNo || normalizedMeterNo === "NAv") return [];

  const trnRows = (trns || [])
    .filter((trn) => getTrnMeterNo(trn) === normalizedMeterNo)
    .map((trn, index) => ({
      id: trn?.id || `TRN_${index}`,
      source: "TRN",
      updatedAt: getTrnUpdatedAt(trn),
    }));

  const saleRows = (sales || []).map((sale, index) => ({
    id: sale?.id || sale?.txnId || `SALE_${index}`,
    source: "SALE",
    updatedAt: getSaleUpdatedAt(sale),
  }));

  return [...trnRows, ...saleRows];
};

function ReportHubHeader({ reportContext }) {
  return (
    <View style={styles.headerCard}>
      <Text style={styles.headerLabel}>METER NUMBER</Text>
      <Text style={styles.meterNoText}>{reportContext?.meterNo || "NAv"}</Text>

      <Text style={styles.addressText}>
        {reportContext?.premiseAddress || "NAv"}
      </Text>

      <Text style={styles.territoryText}>
        {reportContext?.territoryLine || "NAv"}
      </Text>

      <Text style={styles.astIdText}>
        AST ID: {reportContext?.astId || "NAv"}
      </Text>
    </View>
  );
}

function ReportTile({ tile, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(tile)}
      style={[
        styles.tileCard,
        tile?.fullWidth && styles.tileCardFullWidth,
        tile?.accent && styles.tileCardAccent,
      ]}
    >
      <MaterialCommunityIcons
        name={tile?.icon || "grid-large"}
        size={tile?.accent ? 30 : 24}
        color={tile?.accent ? "#0F172A" : "#1E293B"}
        style={styles.tileIcon}
      />

      <Text style={styles.tileTitle}>{tile?.title || "NAv"}</Text>
      <Text style={styles.tileMiniText}>{tile?.miniText || "NAv"}</Text>
    </TouchableOpacity>
  );
}

function ReportTilesGrid({ tiles = [], onTilePress }) {
  const row1 = tiles.slice(0, 2);
  const row2 = tiles.slice(2, 4);
  const row3 = tiles.slice(4, 5);

  return (
    <View style={styles.tilesWrap}>
      <View style={styles.tileRow}>
        {row1.map((tile) => (
          <View key={tile.key} style={styles.tileCol}>
            <ReportTile tile={tile} onPress={onTilePress} />
          </View>
        ))}
      </View>

      <View style={styles.tileRow}>
        {row2.map((tile) => (
          <View key={tile.key} style={styles.tileCol}>
            <ReportTile tile={tile} onPress={onTilePress} />
          </View>
        ))}
      </View>

      <View style={styles.tileRow}>
        {row3.map((tile) => (
          <View key={tile.key} style={styles.tileColFull}>
            <ReportTile tile={tile} onPress={onTilePress} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AstReportHubScreen() {
  const router = useRouter();
  const { id, astNo } = useLocalSearchParams();

  const { all } = useWarehouse();
  const { activeWard, activeLm } = useGeo();

  const selectedAst = useMemo(() => {
    return findReportAstById(all?.meters || [], id);
  }, [all?.meters, id]);

  const premiseId = useMemo(() => {
    return getReportPremiseId(selectedAst);
  }, [selectedAst]);

  const premise = useMemo(() => {
    return findReportPremiseById(all?.prems || [], premiseId);
  }, [all?.prems, premiseId]);

  const erfId = useMemo(() => {
    return getReportErfId(selectedAst, premise);
  }, [selectedAst, premise]);

  const erf = useMemo(() => {
    return findReportErfById(all?.erfs || [], erfId);
  }, [all?.erfs, erfId]);

  const reportContext = useMemo(() => {
    return buildReportContext({
      ast: selectedAst,
      premise,
      erf,
      activeWard,
      activeLm,
      params: { id, astNo },
    });
  }, [selectedAst, premise, erf, activeWard, activeLm, id, astNo]);
  // console.log(`reportContext `, reportContext);

  const { data: sales = [], isLoading: loadingSales } =
    useGetSalesAtomicByMeterNoQuery(reportContext?.meterNo, {
      skip: !reportContext?.meterNo || reportContext?.meterNo === "NAv",
    });

  const timelineRows = useMemo(() => {
    return buildHubTimelineRowsForMetrics({
      trns: all?.trns || [],
      sales,
      meterNo: reportContext?.meterNo,
    });
  }, [all?.trns, sales, reportContext?.meterNo]);

  const tileMetrics = useMemo(() => {
    return buildReportTileMetrics({
      timelineRows,
      sales,
    });
  }, [timelineRows, sales]);

  const tiles = useMemo(() => {
    return buildReportTiles({
      reportContext,
      metrics: tileMetrics,
    });
  }, [reportContext, tileMetrics]);

  const handleTilePress = (tile) => {
    const isInspectPrep = tile?.pathname?.includes("inspect-prep");

    if (isInspectPrep) {
      const inspectParams = {
        ...tile?.params,
        premiseAddress: reportContext?.premiseAddress || "NAv",
        wardNo: reportContext?.wardNo || "NAv",
        erfNo: reportContext?.erfNo || "NAv",
        launchSource: "meter-report",
        launchContext: "inspect-prep",
      };

      console.log("inspectParams before push", inspectParams);

      router.push({
        pathname: tile.pathname,
        params: inspectParams,
      });
      return;
    }

    router.push({
      pathname: tile.pathname,
      params: tile.params,
    });
  };

  const loadingOps = !Array.isArray(all?.meters);

  if (loadingOps) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>Loading meter reports...</Text>
      </View>
    );
  }

  if (!selectedAst) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusTitle}>Meter report not found</Text>
        <Text style={styles.statusText}>
          We could not find the selected AST in Warehouse.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ReportHubHeader reportContext={reportContext} />

      <ReportTilesGrid tiles={tiles} onTilePress={handleTilePress} />

      {loadingSales ? (
        <Text style={styles.footerHint}>Refreshing sales metrics...</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 12,
    paddingBottom: 24,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },

  headerCard: {
    backgroundColor: "#E1ECFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#98B0D0",
    padding: 18,
    marginBottom: 14,
    alignItems: "center",
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 3,
  },
  meterNoText: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: "900",
    color: "#334155",
  },
  addressText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
  },
  territoryText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  astIdText: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
  },

  tilesWrap: {
    marginTop: 4,
  },
  tileRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  tileCol: {
    flex: 1,
  },
  tileColFull: {
    flex: 1,
  },

  tileCard: {
    minHeight: 108,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 16,
    justifyContent: "center",
  },
  tileCardFullWidth: {
    minHeight: 96,
  },
  tileCardAccent: {
    backgroundColor: "#E0F2FE",
    borderColor: "#7DD3FC",
  },
  tileIcon: {
    marginBottom: 10,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  tileMiniText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  footerHint: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
