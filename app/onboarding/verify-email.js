// app/onboarding/verify-email.js
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useSelector } from "react-redux";

import { authApi } from "../../src/redux/authApi";

export default function VerifyEmail() {
  const [cooldown, setCooldown] = useState(false);

  const authState = useSelector(authApi.endpoints.getAuthState.select())?.data;

  const email = authState?.auth?.email;
  const uid = authState?.auth?.uid;

  const [sendVerification, { isLoading: sending }] =
    authApi.useSendEmailVerificationMutation();

  const [syncVerified, { isLoading: syncing }] =
    authApi.useSyncEmailVerifiedMutation();

  const handleResend = async () => {
    if (cooldown) return;

    try {
      await sendVerification().unwrap();
      Alert.alert("Verification sent", "Please check your email inbox.");

      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000); // 30s cooldown
    } catch {
      Alert.alert("Error", "Unable to send verification email.");
    }
  };

  const handleAlreadyVerified = async () => {
    try {
      await syncVerified({ uid }).unwrap();
      // guard will auto-advance if verified
    } catch {
      Alert.alert("Error", "Verification not confirmed yet.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        Verify your email address
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: "#666",
          marginVertical: 16,
          lineHeight: 20,
        }}
      >
        We’ve sent a verification link to:
      </Text>

      <Text style={{ fontSize: 16, fontWeight: "500" }}>{email}</Text>

      <Text
        style={{
          fontSize: 14,
          color: "#666",
          marginTop: 16,
          lineHeight: 20,
        }}
      >
        Please open the email and click the verification link to continue.
        {"\n\n"}
        If you don’t see the email, check your spam folder.
      </Text>

      <View style={{ marginTop: 32 }}>
        <Pressable
          onPress={handleResend}
          disabled={cooldown || sending}
          style={{
            backgroundColor: cooldown ? "#ccc" : "#000",
            padding: 16,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "600" }}>
              Resend verification email
            </Text>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={handleAlreadyVerified}
        disabled={syncing}
        style={{ marginTop: 24, alignItems: "center" }}
      >
        {syncing ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ fontSize: 14, color: "#000" }}>
            I’ve already verified my email
          </Text>
        )}
      </Pressable>
    </View>
  );
}
