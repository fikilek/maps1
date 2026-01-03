import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCreateServiceProviderMutation } from "../src/redux/spApi";

import { useAuth } from "../src/hooks/useAuth";

export default function TestScreen() {
  const router = useRouter();
  const { user, status } = useAuth();

  const [createServiceProvider, { isLoading: isCreating }] =
    useCreateServiceProviderMutation();

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ---- TEST: createServiceProvider callable
  const testCreateServiceProvider = async () => {
    setError(null);
    setResult(null);

    try {
      const res = await createServiceProvider({
        profile: {
          name: "TEST SP – DELETE ME",
          classification: "MNC",
          registrationNumber: "TEST-001",
        },
        classification: "MNC",
        parentMncId: null,
        workbases: ["ZA1048"], // Knysna lm id
        offices: [
          {
            officeId: "test-office-1",
            isHeadOffice: true,
            address: {
              line1: "123 Test Street",
              suburb: "Test Suburb",
              city: "Johannesburg",
              province: "Gauteng",
              postalCode: "2197",
              country: "South Africa",
            },
            location: {
              lat: -26.2041,
              lng: 28.0473,
            },
            contacts: {
              email: "test@test.com",
              phone: "0000000000",
              whatsapp: "0000000000",
            },
          },
        ],
      }).unwrap();

      setResult(res);
    } catch (e) {
      console.error(e);
      setError(e.message || "Callable failed");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🧪 iREPS Test Screen</Text>

      {/* AUTH STATE */}
      <View style={styles.card}>
        <Text style={styles.section}>Auth State</Text>
        <Text>User: {user ? user.uid : "Not logged in"}</Text>
        <Text>Onboarding status: {status}</Text>
      </View>

      {/* SERVICE PROVIDERS SNAPSHOT */}
      {/* <View style={styles.card}>
        <Text style={styles.section}>Service Providers (snapshot)</Text>
        {isCreating && <Text>Loading…</Text>}
        {!isCreating && <Text>Total SPs: {result?.length || 0}</Text>}
      </View> */}

      {/* CALLABLE TEST */}
      <View style={styles.card}>
        <Text style={styles.section}>Callable Tests</Text>

        <Button
          title={isCreating ? "Creating..." : "Create TEST Service Provider"}
          disabled={isCreating}
          onPress={testCreateServiceProvider}
        />

        {result && (
          <Text style={styles.success}>✅ Created SP ID: {result.spId}</Text>
        )}

        {error && <Text style={styles.error}>❌ {error}</Text>}
      </View>

      {/* NAVIGATION TESTS */}
      <View style={styles.card}>
        <Text style={styles.section}>Navigation Tests</Text>

        <Button title="Go to Sign In" onPress={() => router.push("/signin")} />
        <View style={{ height: 8 }} />
        <Button title="Go to App Root" onPress={() => router.push("/(app)")} />
      </View>

      <Text style={styles.note}>
        ⚠️ This screen is DEV-ONLY. Remove before release.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f6f6f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  section: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  success: {
    marginTop: 8,
    color: "green",
    fontWeight: "600",
  },
  error: {
    marginTop: 8,
    color: "red",
    fontWeight: "600",
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});
