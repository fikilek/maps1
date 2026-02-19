import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Checkbox,
  Chip,
  List,
  Searchbar,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { useAuth } from "../../../../src/hooks/useAuth";
import { useGetLmsByCountryQuery } from "../../../../src/redux/geoApi";
import {
  useCreateServiceProviderMutation,
  useGetServiceProvidersQuery,
} from "../../../../src/redux/spApi";

export default function CreateSp() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [createSp, { isLoading: isCreating }] =
    useCreateServiceProviderMutation();

  // 🛰️ 1. Hook into both registries
  const { data: allLms, isLoading: lmsLoading } = useGetLmsByCountryQuery("ZA");
  const { data: allSps, isLoading: spsLoading } = useGetServiceProvidersQuery();
  console.log(`CreateSp --allSps`, allSps);

  // --- Form State ---
  const [regName, setRegName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);

  // 🛡️ 2. Merge and Filter the registries for the UI
  const registryOptions = useMemo(() => {
    // Map LMs to a standard format
    const lms = (allLms || []).map((lm) => ({
      id: lm.id,
      name: lm.name,
      type: "Municipality",
      icon: "map-marker",
    }));

    // Map existing SPs to the same standard format
    const sps = (allSps || []).map((sp) => ({
      id: sp.id,
      name: sp.profile?.tradingName || sp.profile?.registeredName,
      type: "Service Provider (MNC)",
      icon: "office-building",
    }));

    const combined = [...lms, ...sps];

    // Filter based on the SPU's search query
    return combined.filter((item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allLms, allSps, searchQuery]);

  const toggleLm = (client) => {
    const exists = selectedClients.find((c) => c.id === client.id);
    if (exists) {
      setSelectedClients(selectedClients.filter((c) => c.id !== client.id));
    } else {
      setSelectedClients([
        ...selectedClients,
        { id: client.id, name: client.name },
      ]);
    }
  };

  const handleSubmit = async () => {
    // 🛡️ Validation Check
    if (
      !regName.trim() ||
      !tradingName.trim() ||
      selectedClients.length === 0
    ) {
      Alert.alert(
        "Incomplete Profile",
        "Legal Name, Trading Name, and at least one Client are required.",
      );
      return;
    }

    try {
      // 🎯 Sending the payload exactly as the v0.2 Schema requires
      await createSp({
        registeredName: regName.trim(),
        tradingName: tradingName.trim(),
        registeredNumber: regNumber.trim(), // Will be mapped to 'tradingNumber' in mutation
        clients: selectedClients,
        userUid: user.uid,
        userDisplayName: profile?.profile?.displayName || "SPU Admin",
      }).unwrap();

      Alert.alert(
        "Registry Updated",
        `${tradingName} successfully mobilized.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert(
        "Deployment Failed",
        "The Sovereign Registry rejected the request. Check permissions.",
      );
    }
  };

  // const handleSubmit = async () => {
  //   if (!regName || !tradingName || selectedClients.length === 0) {
  //     Alert.alert(
  //       "Incomplete Form",
  //       "Legal Profile and at least one Client selection are required.",
  //     );
  //     return;
  //   }

  //   try {
  //     // 🛡️ PER OUR AGREEMENT: Explicit user data and ISO timestamp logic in mutation
  //     await createSp({
  //       registeredName: regName,
  //       tradingName: tradingName,
  //       registeredNumber: regNumber,
  //       clients: selectedClients,
  //       userUid: user.uid,
  //       userDisplayName: profile?.profile?.displayName || "SPU Admin",
  //     }).unwrap();

  //     Alert.alert(
  //       "Registry Updated",
  //       `${tradingName} successfully mobilized.`,
  //       [{ text: "OK", onPress: () => router.back() }],
  //     );
  //   } catch (err) {
  //     Alert.alert(
  //       "Deployment Failed",
  //       "Registry update error. Check connection.",
  //     );
  //   }
  // };

  return (
    <ScrollView style={styles.container} stickyHeaderIndices={[1]}>
      <Card style={styles.card} elevation={0}>
        <Card.Content>
          <Text style={styles.sectionHeader}>Legal Profile (v0.2)</Text>
          <TextInput
            label="Registered Name (CIPC)"
            value={regName}
            onChangeText={setRegName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Trading Name"
            value={tradingName}
            onChangeText={setTradingName}
            mode="outlined"
            style={styles.input}
          />
          {/* 🎯 Explicitly labeling this for the SPU to match the 'tradingNumber' requirement */}
          <TextInput
            label="Trading / Reg Number"
            value={regNumber}
            onChangeText={setRegNumber}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., 2024/123456/07"
          />
        </Card.Content>
      </Card>

      <Surface style={styles.searchContainer} elevation={2}>
        <Searchbar
          placeholder="Search LMs or MNCs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </Surface>

      <View style={styles.registryBox}>
        <Text style={styles.registryHeader}>
          Client Allocation ({selectedClients.length} Selected)
        </Text>

        {lmsLoading || spsLoading ? (
          <ActivityIndicator
            animating={true}
            color="#2563eb"
            style={{ margin: 40 }}
          />
        ) : (
          registryOptions.map((item) => {
            const isSelected = selectedClients.some((c) => c.id === item.id);
            return (
              <List.Item
                key={item.id}
                title={item.name}
                description={item.type}
                titleStyle={{
                  fontWeight: isSelected ? "800" : "400",
                  color: isSelected ? "#2563eb" : "#1e293b",
                }}
                left={() => (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Checkbox
                      status={isSelected ? "checked" : "unchecked"}
                      color="#2563eb"
                    />
                    <List.Icon
                      icon={item.icon}
                      color={
                        item.type === "Municipality" ? "#64748b" : "#8b5cf6"
                      }
                    />
                  </View>
                )}
                onPress={() => toggleLm({ id: item.id, name: item.name })}
                style={[styles.lmItem, isSelected && styles.lmItemActive]}
              />
            );
          })
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.chipBox}>
          {selectedClients.map((c) => (
            <Chip key={c.id} onClose={() => toggleLm(c)} style={styles.chip}>
              {c.name}
            </Chip>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isCreating}
          disabled={isCreating || selectedClients.length === 0}
          style={styles.submitBtn}
          contentStyle={{ height: 56 }}
        >
          MOBILIZE SERVICE PROVIDER
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  card: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: { marginBottom: 10, backgroundColor: "#fff" },
  searchContainer: { padding: 12, backgroundColor: "#f1f5f9" },
  searchBar: { borderRadius: 8, backgroundColor: "#fff", elevation: 0 },
  registryBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    minHeight: 400,
  },
  registryHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 16,
  },
  lmItem: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  lmItemActive: { backgroundColor: "#eff6ff" },
  footer: { padding: 16, backgroundColor: "#fff", paddingBottom: 40 },
  chipBox: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  chip: { backgroundColor: "#e2e8f0" },
  submitBtn: { borderRadius: 12, backgroundColor: "#1e293b" },
});
