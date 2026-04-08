import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useWarehouse } from "../../../../src/context/WarehouseContext";
import { useGetSalesAtomicByMeterNoQuery } from "../../../../src/redux/salesApi";

const normalizeMeterNo = (value) => String(value || "").trim();

const getAstMeterNo = (ast) =>
  normalizeMeterNo(ast?.ast?.astData?.astNo || ast?.astData?.astNo || "NAv");

const getTrnMeterNo = (trn) =>
  normalizeMeterNo(
    trn?.ast?.astData?.astNo ||
      trn?.accessData?.astData?.astNo ||
      trn?.meterNo ||
      trn?.derived?.meterNo ||
      "NAv",
  );

const getTrnUpdatedAt = (trn) =>
  trn?.metadata?.updatedAt ||
  trn?.metadata?.createdAt ||
  trn?.accessData?.metadata?.updatedAt ||
  trn?.accessData?.metadata?.created?.at ||
  "NAv";

const getTrnCreatedByUser = (trn) =>
  trn?.metadata?.updatedByUser ||
  trn?.metadata?.createdByUser ||
  trn?.accessData?.metadata?.updatedByUser ||
  trn?.accessData?.metadata?.created?.byUser ||
  "NAv";

const getTrnTypeLabel = (trn) => {
  const raw =
    trn?.accessData?.trnType ||
    trn?.trnType ||
    trn?.type ||
    trn?.derived?.trnType ||
    "TRN";

  return String(raw).replaceAll("_", " ");
};

const getTrnDetails = (trn) =>
  trn?.ast?.anomalies?.anomaly ||
  trn?.anomalies?.anomaly ||
  trn?.notes ||
  "NAv";

const getAstVisibility = (ast) => ast?.master?.visibility || "NAv";

const getAstUpdatedAt = (ast) =>
  ast?.accessData?.metadata?.updatedAt ||
  ast?.metadata?.updatedAt ||
  ast?.metadata?.createdAt ||
  ast?.accessData?.metadata?.created?.at ||
  "NAv";

const getSaleUpdatedAt = (sale) =>
  sale?.txAtISO || sale?.ingestedAtISO || sale?.updatedAt || "NAv";

const getSaleAmountR = (sale) => {
  const cents = Number(sale?.amountTotalC);
  if (Number.isNaN(cents)) return 0;
  return cents / 100;
};

const toMillis = (value) => {
  if (typeof value === "number") return value;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const formatDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "NAv";

  return d.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const TimelineItem = ({ item, isLast }) => {
  const isSale = item.source === "SALE";

  return (
    <View style={styles.timelineRow}>
      <View style={styles.leftCol}>
        <View
          style={[
            styles.iconDot,
            { backgroundColor: isSale ? "#10B981" : "#3B82F6" },
          ]}
        >
          <MaterialCommunityIcons
            name={isSale ? "currency-usd" : "hammer-wrench"}
            size={16}
            color="#FFF"
          />
        </View>

        {!isLast && <View style={styles.verticalLine} />}
      </View>

      <View style={styles.contentCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDateTime(item.updatedAt)}</Text>

          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: isSale ? "#ECFDF5" : "#EFF6FF",
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color: isSale ? "#059669" : "#2563EB",
                },
              ]}
            >
              {item.badge}
            </Text>
          </View>
        </View>

        <Text style={styles.mainInfo}>{item.title}</Text>
        <Text style={styles.subInfo}>{item.subtitle}</Text>
      </View>
    </View>
  );
};

export default function AstReportScreen() {
  const { id, astNo: astNoParam } = useLocalSearchParams();
  const { all } = useWarehouse();

  const selectedAst = useMemo(() => {
    return (all?.meters || []).find(
      (x) =>
        String(x?.id || "") === String(id || "") ||
        String(x?.ast?.id || "") === String(id || ""),
    );
  }, [all?.meters, id]);

  const meterNo = useMemo(() => {
    const fromAst = getAstMeterNo(selectedAst);
    const fromParam = normalizeMeterNo(astNoParam || "");

    if (fromAst && fromAst !== "NAv") return fromAst;
    if (fromParam) return fromParam;

    return "NAv";
  }, [selectedAst, astNoParam]);

  const relatedTrns = useMemo(() => {
    if (!meterNo || meterNo === "NAv") return [];

    return (all?.trns || []).filter(
      (trn) => getTrnMeterNo(trn) === normalizeMeterNo(meterNo),
    );
  }, [all?.trns, meterNo]);

  const { data: sales, isLoading: loadingSales } =
    useGetSalesAtomicByMeterNoQuery(meterNo, {
      skip: !meterNo || meterNo === "NAv",
    });

  const timeline = useMemo(() => {
    const trnRows = relatedTrns.map((trn) => ({
      id: trn?.id || `TRN_${Math.random()}`,
      source: "TRN",
      badge: "FIELD OP",
      title: getTrnTypeLabel(trn),
      subtitle: `Technician: ${getTrnCreatedByUser(trn)} • ${getTrnDetails(trn)}`,
      updatedAt: getTrnUpdatedAt(trn),
      meterNo,
      raw: trn,
    }));

    const saleRows = (sales || []).map((sale, index) => ({
      id: sale?.id || sale?.txnId || `SALE_${index}`,
      source: "SALE",
      badge: "VENDING",
      title: `R${getSaleAmountR(sale).toFixed(2)} Purchase`,
      subtitle: `${sale?.currency || "ZAR"} • ${sale?.sourceFileId || "Atomic Sales"}`,
      updatedAt: getSaleUpdatedAt(sale),
      meterNo,
      raw: sale,
    }));

    return [...trnRows, ...saleRows].sort(
      (a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt),
    );
  }, [relatedTrns, sales, meterNo]);

  const headerVisibility = getAstVisibility(selectedAst);
  const headerUpdatedAt = getAstUpdatedAt(selectedAst);

  if (loadingSales && timeline.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading meter timeline...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>METER NUMBER</Text>
        <Text style={styles.meterValue}>{meterNo || "NAv"}</Text>

        <View style={styles.summaryMetaRow}>
          <Text style={styles.summaryMetaText}>AST ID: {id || "NAv"}</Text>
          <Text style={styles.summaryMetaText}>
            VISIBILITY: {headerVisibility}
          </Text>
        </View>

        <Text style={styles.summaryMetaText}>
          AST UPDATED: {formatDateTime(headerUpdatedAt)}
        </Text>
      </View>

      <View style={styles.timelineContainer}>
        {timeline.length === 0 ? (
          <Text style={styles.emptyText}>
            No history recorded for this meter.
          </Text>
        ) : (
          timeline.map((item, index) => (
            <TimelineItem
              key={item.id || index}
              item={item}
              isLast={index === timeline.length - 1}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  summaryBox: {
    margin: 10,
    padding: 15,
    backgroundColor: "#e1ecff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#98b0d0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  summaryLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  meterValue: {
    color: "#3f4851",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 2,
    textShadowColor: "rgba(33, 43, 58, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  summaryMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  summaryMetaText: {
    marginTop: 6,
    fontSize: 11,
    color: "#475569",
    fontWeight: "700",
  },

  timelineContainer: {
    padding: 16,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  leftCol: {
    width: 40,
    alignItems: "center",
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#FFF",
    marginLeft: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },
  mainInfo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  subInfo: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    color: "#64748B",
    marginTop: 20,
    fontWeight: "600",
  },
});
