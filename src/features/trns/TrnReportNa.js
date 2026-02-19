import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Divider, Surface } from "react-native-paper";
import IrepsMediaViewer from "../../../components/media/IrepsMediaViewer";

const { width } = Dimensions.get("window");

export default function TrnReportNa({ data }) {
  const { accessData } = data;
  const accessReason = accessData?.access?.reason || "No Reason Provided";
  const address = accessData?.premise?.address;

  return (
    <View style={styles.container}>
      {/* 🚩 SECTION 1: THE BLOCKER */}
      <Surface style={styles.alertBanner} elevation={0}>
        <MaterialCommunityIcons name="shield-alert" size={28} color="#EF4444" />
        {/* 🎯 flex: 1 here forces the text to wrap instead of pushing the edge */}
        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>ACCESS DENIED</Text>
          <Text>{accessReason.toUpperCase()}</Text>
        </View>
      </Surface>

      {/* 📸 SECTION 2: VISUAL PROOF */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>VISUAL PROOF</Text>
        {/* 🎯 Wrapping the viewer in a fixed-width container stops the spill */}
        <View style={styles.mediaWrapper}>
          <IrepsMediaViewer
            media={data.media || accessData?.media}
            tags={["noAccessPhoto"]}
            address={address}
          />
        </View>
      </View>

      <Divider style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    width: "100%", // 🛡️ Lock to parent width
  },
  section: { marginBottom: 24, paddingHorizontal: 4 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FEF2F2",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 24,
    width: "100%", // 🛡️ Prevent horizontal overflow
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#EF4444",
    letterSpacing: 1,
  },
  alertSubtitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#991B1B",
    marginTop: 2,
    flexWrap: "wrap", // 🎯 Ensures text breaks into new lines
  },
  mediaWrapper: {
    width: "100%",
    overflow: "hidden", // 🛡️ Cuts off any rogue image scaling
    // borderRadius: 12,
  },
  divider: { marginVertical: 8, backgroundColor: "#F1F5F9" },
});
