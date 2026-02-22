import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGetAstByIdQuery } from "../../../src/redux/astsApi";

const InfoSection = ({ title, icon, children, color = "#3B82F6" }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const DataRow = ({ label, value, subValue }) => (
  <View style={styles.dataRow}>
    <Text style={styles.dataLabel}>{label}</Text>
    <View style={{ alignItems: "flex-end" }}>
      <Text style={styles.dataValue}>{value || "N/A"}</Text>
      {subValue && <Text style={styles.dataSubValue}>{subValue}</Text>}
    </View>
  </View>
);

export default function MeterDetailScreen() {
  const { docId, astNo } = useLocalSearchParams();
  const { data: asset, isLoading } = useGetAstByIdQuery(docId);

  if (isLoading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#3B82F6" />
    );

  const isWater = asset?.meterType === "water";
  const themeColor = isWater ? "#3B82F6" : "#EAB308";
  const { astData, anomalies, location, meterReading } = asset?.ast || {};
  const { premise, metadata } = asset?.accessData || {};

  return (
    <ScrollView style={styles.container}>
      {/* 🏛️ METER IDENTITY HEADER */}
      <View style={[styles.heroHeader, { backgroundColor: themeColor }]}>
        <MaterialCommunityIcons
          name={isWater ? "water" : "lightning-bolt"}
          size={48}
          color="#FFF"
        />
        <Text style={styles.heroTitle}>{astNo}</Text>
        <Text style={styles.heroSubtitle}>
          {asset?.meterType?.toUpperCase()} ASSET
        </Text>
      </View>

      <View style={styles.content}>
        {/* 🆔 IDENTITY */}
        <InfoSection title="IDENTITY" icon="fingerprint" color={themeColor}>
          <DataRow label="Manufacturer" value={astData?.astManufacturer} />
          <DataRow label="Model/Name" value={astData?.astName} />
          <DataRow label="Category" value={astData?.meter?.category} />
        </InfoSection>

        {/* 📍 GEOGRAPHY */}
        <InfoSection
          title="GEOGRAPHY"
          icon="map-marker-outline"
          color={themeColor}
        >
          <DataRow label="Address" value={premise?.address} />
          <DataRow label="Erf Number" value={asset?.accessData?.erfNo} />
          <DataRow
            label="GPS"
            value={`${location?.gps?.lat?.toFixed(4)}, ${location?.gps?.lng?.toFixed(4)}`}
          />
        </InfoSection>

        {/* ⚠️ ANOMALIES */}
        <InfoSection title="ANOMALIES" icon="alert-outline" color="#EF4444">
          <DataRow label="Status" value={anomalies?.anomaly} />
          <DataRow label="Details" value={anomalies?.anomalyDetail} />
        </InfoSection>

        {/* ⚡ PLACEMENT & READING */}
        <InfoSection title="TECHNICAL" icon="gauge" color={themeColor}>
          <DataRow
            label="Placement"
            value={location?.placement || "Standard"}
          />
          <DataRow
            label="Last Reading"
            value={meterReading}
            subValue="Recorded at Discovery"
          />
        </InfoSection>

        {/* 🛰️ METADATA */}
        <InfoSection title="METADATA" icon="database-outline" color="#64748B">
          <DataRow
            label="Created"
            value={new Date(asset?.createdAt).toLocaleDateString()}
            subValue={`By ${metadata?.created?.byUser}`}
          />
          <DataRow
            label="Last Update"
            value={new Date(metadata?.updated?.at).toLocaleDateString()}
            subValue={`By ${metadata?.updated?.byUser}`}
          />
        </InfoSection>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  heroHeader: {
    padding: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 10,
    fontFamily: "monospace",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  content: { padding: 16 },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  dataValue: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  dataSubValue: { fontSize: 10, color: "#64748B", fontWeight: "600" },
});
