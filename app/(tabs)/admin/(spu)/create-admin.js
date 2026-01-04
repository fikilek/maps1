import { useRouter } from "expo-router";
import { Formik } from "formik";
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";

import { adminInitValues } from "../../../../src/features/admin/adminInitValues";
import { createAdminSchema } from "../../../../src/features/admin/createAdminSchema";
import { useCreateAdminUserMutation } from "../../../../src/redux/authApi";

export default function CreateAdminScreen() {
  const router = useRouter();
  const [createAdminUser, { isLoading }] = useCreateAdminUserMutation();

  const handleSubmit = async (values, { resetForm }) => {
    console.log("CreateAdminScreen ----handleSubmit ----values", values);

    try {
      const result = await createAdminUser({
        email: values.email,
        name: values.name,
        surname: values.surname,
      }).unwrap();

      console.log("CreateAdminScreen ----handleSubmit ----result", result);

      Alert.alert(
        "Admin Created",
        "Admin account created successfully.\nThe user will complete onboarding after signing in.",
        [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              router.back();
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Creation Failed",
        err?.message || "Unable to create admin user"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Admin User</Text>

        <Formik
          initialValues={adminInitValues}
          validationSchema={createAdminSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit: submitForm,
            values,
            errors,
            touched,
            resetForm,
          }) => {
            console.log("FORM ERRORS", errors);
            return (
              <>
                {/* EMAIL */}
                <TextInput
                  label="Email"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  error={touched.email && !!errors.email}
                />
                {touched.email && errors.email && (
                  <Text style={styles.error}>{errors.email}</Text>
                )}

                {/* NAME */}
                <TextInput
                  label="Name"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  style={styles.input}
                  error={touched.name && !!errors.name}
                />
                {touched.name && errors.name && (
                  <Text style={styles.error}>{errors.name}</Text>
                )}

                {/* SURNAME */}
                <TextInput
                  label="Surname"
                  value={values.surname}
                  onChangeText={handleChange("surname")}
                  onBlur={handleBlur("surname")}
                  style={styles.input}
                  error={touched.surname && !!errors.surname}
                />
                {touched.surname && errors.surname && (
                  <Text style={styles.error}>{errors.surname}</Text>
                )}

                <View style={styles.formButtons}>
                  <View style={styles.buttonWrapper}>
                    <Button
                      style={styles.button}
                      title="Reset"
                      color="#999"
                      onPress={() => resetForm()}
                      disabled={isLoading}
                    />
                  </View>

                  <View style={styles.buttonWrapper}>
                    <Button
                      style={{ width: 60 }}
                      title={isLoading ? "Submitting..." : "Submit"}
                      onPress={() => submitForm()}
                      disabled={isLoading}
                    />
                  </View>
                </View>
              </>
            );
          }}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    width: 60,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
});
