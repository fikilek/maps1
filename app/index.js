import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useAuth } from "../src/hooks/useAuth";
import { useSignoutMutation } from "../src/redux/authApi";

export default function Welcome() {
  const router = useRouter();
  const [signout] = useSignoutMutation();
  const { user, profile, status, isLoading } = useAuth(); // Use your new hook!

  useEffect(() => {
    if (isLoading) return;

    // Only auto-redirect if they are fully finished
    if (user && status === "COMPLETED") {
      router.replace("/(app)");
    }
  }, [user, status, isLoading]);

  if (isLoading) return null;

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 36, fontWeight: "bold", color: "#2196F3" }}>
        iREPS
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 24, color: "#21f3f3ff" }}>
        Infrastructure Registry & Inspection
      </Text>

      {!user ? (
        <View style={{ gap: 10 }}>
          <Button
            title="Login to My Account"
            onPress={() => router.push("/signin")}
          />
          <Button
            title="Register New Account"
            onPress={() => router.push("/signup")}
          />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, color: "gray", marginBottom: 10 }}>
            Logged in as: {profile?.identity?.email}
          </Text>

          {status !== "COMPLETED" && (
            <Button
              color="orange"
              title="View Approval Progress"
              onPress={() => router.push("/onboarding/pending-sp-confirmation")}
            />
          )}

          <Button title="Sign Out" onPress={() => signout()} />
        </View>
      )}
    </View>
  );
}
