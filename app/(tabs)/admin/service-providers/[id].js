import { useAuth } from "@/src/hooks/useAuth";
import {
  useGetServiceProvidersQuery,
  useUpdateServiceProviderMutation,
} from "@/src/redux/spApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";

export default function EditSp() {
  const { id } = useLocalSearchParams();
  console.log("🚩 GARRISON ALERT: Entering Refine Screen for ID:", id);
  const router = useRouter();
  const { user, profile: authProfile } = useAuth();

  // 🛰️ Fetching the current registry state
  const { data: allSps = [] } = useGetServiceProvidersQuery();
  const [updateSp, { isLoading: isUpdating }] =
    useUpdateServiceProviderMutation();

  const [regName, setRegName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [regNumber, setRegNumber] = useState("");

  // 🛡️ Load existing data into state
  useEffect(() => {
    const sp = allSps.find((item) => item.id === id);
    if (sp) {
      setRegName(sp.profile?.registeredName || "");
      setTradingName(sp.profile?.tradingName || "");
      setRegNumber(sp.profile?.tradingNumber || "");
    }
  }, [allSps, id]);

  const handleUpdate = async () => {
    try {
      await updateSp({
        id,
        updates: {
          "profile.registeredName": regName.trim(),
          "profile.tradingName": tradingName.trim(),
          "profile.tradingNumber": regNumber.trim(),
        },
        userUid: user.uid,
        userDisplayName: authProfile?.profile?.displayName || "SPU Admin",
      }).unwrap();

      Alert.alert("Registry Updated", "The Sovereign record has been refined.");
      router.back();
    } catch (err) {
      Alert.alert("Update Failed", "The Garrison rejected the modifications.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.label}>LEGAL PROFILE REFINE</Text>
          <TextInput
            label="Registered Name"
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
          <TextInput
            label="Trading / Reg Number"
            value={regNumber}
            onChangeText={setRegNumber}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleUpdate}
            loading={isUpdating}
            style={styles.btn}
            contentStyle={{ height: 50 }}
          >
            UPDATE REGISTRY
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  card: { borderRadius: 12, elevation: 2 },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    marginBottom: 16,
  },
  input: { marginBottom: 12 },
  btn: { marginTop: 20, backgroundColor: "#1e293b" },
});
