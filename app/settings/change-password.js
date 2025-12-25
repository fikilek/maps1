import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useReauthenticateMutation,
  useUpdatePasswordMutation,
} from "../../src/redux/authApi";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [reauthenticate, { isLoading: reauthLoading }] =
    useReauthenticateMutation();
  const [updatePassword, { isLoading: updateLoading }] =
    useUpdatePasswordMutation();

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Password must be at least 6 characters");
      return;
    }

    try {
      // 🔐 Step 1: Reauthenticate
      await reauthenticate({ password: currentPassword }).unwrap();

      // 🔑 Step 2: Update password
      await updatePassword({ newPassword }).unwrap();

      Alert.alert("Success", "Your password has been updated.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update password");
    }
  };

  const isBusy = reauthLoading || updateLoading;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Change password</Text>

      {/* Current password */}
      <TextInput
        placeholder="Current password"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginTop: 24,
        }}
      />

      {/* New password */}
      <TextInput
        placeholder="New password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginTop: 16,
        }}
      />

      {/* Confirm password */}
      <TextInput
        placeholder="Confirm new password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginTop: 16,
        }}
      />

      <Pressable
        onPress={handleSubmit}
        disabled={isBusy}
        style={{
          marginTop: 24,
          backgroundColor: "#000",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          opacity: isBusy ? 0.6 : 1,
        }}
      >
        {isBusy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white" }}>Update password</Text>
        )}
      </Pressable>

      <Text
        style={{
          marginTop: 16,
          fontSize: 12,
          color: "#666",
        }}
      >
        For security reasons, you must confirm your current password.
      </Text>
    </View>
  );
}
