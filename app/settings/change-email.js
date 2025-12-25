import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSelector } from "react-redux";

import {
  authApi,
  useReauthenticateMutation,
  useSendEmailVerificationMutation,
} from "../../src/redux/authApi";

import { updateEmail } from "firebase/auth";
import { auth } from "../../src/firebase";

export default function ChangeEmail() {
  const router = useRouter();

  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;

  const currentEmail = authState?.auth?.email;

  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [reauthenticate, { isLoading: reauthLoading }] =
    useReauthenticateMutation();

  const [sendVerification, { isLoading: sending }] =
    useSendEmailVerificationMutation();

  const handleSubmit = async () => {
    if (!password || !newEmail) {
      Alert.alert("Missing information", "Please fill in all fields.");
      return;
    }

    try {
      // 1️⃣ Re-authenticate
      await reauthenticate({ password }).unwrap();

      // 2️⃣ Update email in Firebase Auth
      await updateEmail(auth.currentUser, newEmail.trim().toLowerCase());

      // 3️⃣ Send verification email
      await sendVerification().unwrap();

      Alert.alert(
        "Verify your email",
        "We’ve sent a verification email to your new address."
      );

      // 4️⃣ Go to existing verify-email screen
      router.replace("/onboarding/verify-email");
    } catch (error) {
      console.log("ChangeEmail error", error);

      Alert.alert(
        "Unable to change email",
        error?.message || "Please check your password and try again."
      );
    }
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        Change email address
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: "#666",
          marginTop: 8,
          marginBottom: 24,
        }}
      >
        Current email: <Text style={{ fontWeight: "500" }}>{currentEmail}</Text>
      </Text>

      {/* Password */}
      <Text style={{ fontSize: 14, marginBottom: 6 }}>
        Confirm your password
      </Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />

      {/* New Email */}
      <Text style={{ fontSize: 14, marginBottom: 6 }}>New email address</Text>
      <TextInput
        value={newEmail}
        onChangeText={setNewEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="new-email@example.com"
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
        }}
      />

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        disabled={reauthLoading || sending}
        style={{
          marginTop: 32,
          backgroundColor: "#000",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        {reauthLoading || sending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>Continue</Text>
        )}
      </Pressable>
    </View>
  );
}
