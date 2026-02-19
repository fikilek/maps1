import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  List,
  Modal,
  Portal,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useInviteMngMutation } from "../../../../src/redux/authApi";
import { useGetLmsByCountryQuery } from "../../../../src/redux/geoApi";
import { useGetServiceProvidersQuery } from "../../../../src/redux/spApi";

export default function CreateManagerScreen() {
  const router = useRouter();
  const [inviteMng, { isLoading: isInviting }] = useInviteMngMutation();

  // 🛰️ LIVE DATA STREAMS
  const { data: allSPs = [], isLoading: loadingSPs } =
    useGetServiceProvidersQuery();
  const { data: allLMs = [], isLoading: loadingLMs } =
    useGetLmsByCountryQuery("ZA");

  // 📝 LOCAL STATE FOR SELECTIONS
  const [selectedMNC, setSelectedMNC] = useState(null);
  const [selectedLMs, setSelectedLMs] = useState([]);
  const [mncModal, setMncModal] = useState(false);
  const [lmModal, setLmModal] = useState(false);

  // 🕵️ FILTER: Only show Main Contractors
  const mncList = allSPs.filter((sp) => sp?.profile?.classification === "MNC");

  const toggleLM = (lm) => {
    const exists = selectedLMs?.find((item) => item?.id === lm?.id);
    if (exists) {
      setSelectedLMs(selectedLMs?.filter((item) => item?.id !== lm?.id));
    } else {
      setSelectedLMs([...selectedLMs, { id: lm?.id, name: lm?.name }]);
    }
  };

  const handleSubmit = async (values) => {
    if (!selectedMNC)
      return Alert.alert("Hold!", "Select a Main Contractor first.");
    if (selectedLMs.length === 0)
      return Alert.alert("Hold!", "Assign at least one territory.");
    console.log(`values`, values);
    try {
      await inviteMng({
        email: values?.email?.toLowerCase()?.trim(),
        name: values?.name,
        surname: values?.surname,
        mnc: { id: selectedMNC?.id, name: selectedMNC?.profile?.name },
        workbases: selectedLMs,
      }).unwrap();

      Alert.alert("Mission Confirmed", `Manager ${values?.name} invited.`);
      router.back();
    } catch (err) {
      Alert.alert("Command Error", err?.message || "Could not invite manager");
    }
  };

  if (loadingSPs || loadingLMs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Syncing Sovereign Registries...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sovereignLabel}>Appoint Manager (MNG)</Text>

        <Formik
          initialValues={{ email: "", name: "", surname: "" }}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleSubmit, values }) => (
            <View style={styles.form}>
              <TextInput
                label="Email Address"
                value={values?.email}
                onChangeText={handleChange("email")}
                mode="outlined"
                style={styles.input}
              />
              <View style={styles.row}>
                <TextInput
                  label="First Name"
                  value={values?.name}
                  onChangeText={handleChange("name")}
                  mode="outlined"
                  style={[styles.input, { flex: 1 }]}
                />
                <TextInput
                  label="Surname"
                  value={values?.surname}
                  onChangeText={handleChange("surname")}
                  mode="outlined"
                  style={[styles.input, { flex: 1 }]}
                />
              </View>

              <Divider style={styles.divider} />

              {/* 🏗️ MNC SELECTOR */}
              <TouchableOpacity
                onPress={() => setMncModal(true)}
                style={styles.selector}
              >
                <Text style={styles.boxLabel}>
                  Assigned Main Contractor (MNC)
                </Text>
                <View style={styles.selectorInner}>
                  <Text
                    style={[
                      styles.selectedText,
                      !selectedMNC && styles.placeholder,
                    ]}
                  >
                    {selectedMNC
                      ? selectedMNC?.profile?.name
                      : "Select Contractor..."}
                  </Text>
                  <MaterialCommunityIcons
                    name="office-building"
                    size={20}
                    color="#2563eb"
                  />
                </View>
              </TouchableOpacity>

              {/* 🌍 LM SELECTOR */}
              <TouchableOpacity
                onPress={() => setLmModal(true)}
                style={styles.selector}
              >
                <Text style={styles.boxLabel}>
                  Operational Territories (Workbases)
                </Text>
                <View style={styles.selectorInner}>
                  <Text
                    style={[
                      styles.selectedText,
                      selectedLMs?.length === 0 && styles.placeholder,
                    ]}
                  >
                    {selectedLMs?.length > 0
                      ? `${selectedLMs?.length} Selected`
                      : "Select Workbases..."}
                  </Text>
                  <MaterialCommunityIcons
                    name="map-marker-multiple"
                    size={20}
                    color="#2563eb"
                  />
                </View>
              </TouchableOpacity>

              {/* 🏷️ CHIP DISPLAY */}
              <View style={styles.chipRow}>
                {selectedLMs?.map((lm) => (
                  <Chip
                    key={lm?.id}
                    onClose={() => toggleLM(lm)}
                    style={styles.chip}
                  >
                    {lm?.name}
                  </Chip>
                ))}
              </View>

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isInviting}
                style={styles.submitBtn}
                labelStyle={{ fontWeight: "900" }}
              >
                INVITE TO iREPS
              </Button>
            </View>
          )}
        </Formik>

        {/* 🏛️ MODALS */}
        <Portal>
          <Modal
            visible={mncModal}
            onDismiss={() => setMncModal(false)}
            contentContainerStyle={styles.modal}
          >
            <Text style={styles.modalTitle}>Select MNC</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {mncList?.map((mnc) => (
                <List.Item
                  key={mnc?.id}
                  title={mnc?.profile?.name}
                  onPress={() => {
                    setSelectedMNC(mnc);
                    setMncModal(false);
                  }}
                  left={(p) => <List.Icon {...p} icon="office-building" />}
                />
              ))}
            </ScrollView>
          </Modal>

          <Modal
            visible={lmModal}
            onDismiss={() => setLmModal(false)}
            contentContainerStyle={styles.modal}
          >
            <Text style={styles.modalTitle}>Select Workbases</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {allLMs?.map((lm) => (
                <List.Item
                  key={lm?.id}
                  title={lm?.name}
                  onPress={() => toggleLM(lm)}
                  right={(p) =>
                    selectedLMs.find((s) => s?.id === lm?.id) && (
                      <List.Icon {...p} icon="check" color="#2563eb" />
                    )
                  }
                />
              ))}
            </ScrollView>
            <Button
              onPress={() => setLmModal(false)}
              mode="contained"
              style={{ marginTop: 10 }}
            >
              DONE
            </Button>
          </Modal>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },
  sovereignLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2563eb",
    textTransform: "uppercase",
    marginBottom: 24,
    letterSpacing: 1,
  },
  form: { gap: 12 },
  row: { flexDirection: "row", gap: 10 },
  input: { backgroundColor: "#698d96" },
  divider: { marginVertical: 8, backgroundColor: "transparent" },
  selector: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  boxLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
  },
  selectorInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  selectedText: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  placeholder: { color: "#94a3b8" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: { backgroundColor: "#769ac9" },
  submitBtn: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "#71ed61",
    height: 50,
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 16,
  },
});
