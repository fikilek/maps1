import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Divider, IconButton, Modal, Portal, Text } from "react-native-paper";
import TrnReportElec from "../../../src/features/trns/TrnReportElec";
import TrnReportNa from "../../../src/features/trns/TrnReportNa";
import TrnReportWater from "../../../src/features/trns/TrnReportWater";
import { useGetTrnByIdQuery } from "../../../src/redux/trnsApi";

export default function TrnReportModal() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 🛰️ Fetch the specific transaction from the Garrison cache
  const { data: trn, isLoading } = useGetTrnByIdQuery(id);

  const hideModal = () => router.back();

  if (isLoading) return null; // Or a subtle spinner

  const renderContent = () => {
    if (!trn) return <Text>Transaction not found.</Text>;
    console.log(`TrnReportModal --trn`, trn);
    console.log(`TrnReportModal --trn`, JSON.stringify(trn, null, 2));

    // 🛡️ Sector 1: No Access Logic
    if (
      trn.accessData?.access?.hasAccess === "no" ||
      trn.accessData?.access?.hasAccess === false
    ) {
      return <TrnReportNa data={trn} />;
    }

    // 🛡️ Sector 2: Technical Breakdown
    return trn.meterType === "water" ? (
      <TrnReportWater data={trn} />
    ) : (
      <TrnReportElec data={trn} />
    );
  };

  return (
    <Portal>
      <Modal
        visible={true}
        onDismiss={hideModal}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            FIELD TRANSACTION REPORT
          </Text>
          <IconButton icon="close" size={24} onPress={hideModal} />
        </View>
        <Divider />

        <ScrollView style={styles.scrollBody}>{renderContent()}</ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    height: "85%", // 🎯 Gives it that "Sheet" look
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
  },
  headerTitle: { fontWeight: "900", color: "#1E293B", letterSpacing: 1 },
  scrollBody: { flex: 1, padding: 16 },
});
