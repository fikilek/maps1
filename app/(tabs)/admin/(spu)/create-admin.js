import { useRouter } from "expo-router";
import { Formik } from "formik";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { TextInput } from "react-native-paper";

import { createAdminSchema } from "../../../../src/features/admin/createAdminSchema";
import { useCreateAdminUserMutation } from "../../../../src/redux/authApi";

export default function CreateAdminScreen() {
  const router = useRouter();

  const [createAdminUser, { isLoading }] = useCreateAdminUserMutation();

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const res = await createAdminUser({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      }).unwrap();

      Alert.alert(
        "Admin Created",
        `Admin account created successfully.\nUID: ${res.uid}`,
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Admin User</Text>

      <Formik
        initialValues={{
          email: "",
          displayName: "",
          password: "",
        }}
        validationSchema={createAdminSchema}
        onSubmit={handleSubmit}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View>
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

            {/* DISPLAY NAME */}
            <TextInput
              label="Display Name"
              value={values.displayName}
              onChangeText={handleChange("displayName")}
              onBlur={handleBlur("displayName")}
              style={styles.input}
              error={touched.displayName && !!errors.displayName}
            />
            {touched.displayName && errors.displayName && (
              <Text style={styles.error}>{errors.displayName}</Text>
            )}

            {/* PASSWORD */}
            <TextInput
              label="Temporary Password"
              value={values.password}
              onChangeText={handleChange("password")}
              onBlur={handleBlur("password")}
              secureTextEntry
              style={styles.input}
              error={touched.password && !!errors.password}
            />
            {touched.password && errors.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}

            <View style={styles.button}>
              <Button
                title={isLoading ? "Creating..." : "Create Admin"}
                onPress={handleSubmit}
                disabled={isLoading}
              />
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
});
