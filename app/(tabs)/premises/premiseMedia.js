import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import IrepsMediaViewer from "../../../components/media/IrepsMediaViewer";
import { useWarehouse } from "../../../src/context/WarehouseContext";

export default function PremiseMedia() {
  const router = useRouter();
  const { premiseId } = useLocalSearchParams();
  const { all } = useWarehouse();

  const premise = useMemo(() => {
    if (!premiseId) return null;
    return all?.prems?.find((p) => p.id === premiseId) || null;
  }, [premiseId, all?.prems]);

  const addressLabel = useMemo(() => {
    const strNo = premise?.address?.strNo || "";
    const strName = premise?.address?.strName || "";
    const strType = premise?.address?.strType || "";

    return [strNo, strName, strType].filter(Boolean).join(" ").trim();
  }, [premise]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>PREMISE MEDIA GALLERY</Text>

      <Text style={styles.subtitle}>
        {addressLabel || "Premise media review"}
      </Text>

      <View style={styles.viewerWrap}>
        <IrepsMediaViewer
          media={premise?.media || []}
          tags={["propertyTypePhoto", "propertyAdrPhoto"]}
          address={addressLabel || "No Address"}
        />
      </View>

      <Button
        mode="contained"
        onPress={() => router.back()}
        style={styles.btn}
        labelStyle={styles.btnLabel}
      >
        RETURN TO MISSION
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 20,
    letterSpacing: 2,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    marginBottom: 20,
  },
  viewerWrap: {
    marginTop: 10,
  },
  btn: {
    marginTop: 40,
    backgroundColor: "#6654dd",
    borderRadius: 10,
    width: "100%",
    height: 48,
    justifyContent: "center",
  },
  btnLabel: {
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
