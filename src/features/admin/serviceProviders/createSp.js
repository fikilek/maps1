import { getAuth } from "firebase/auth";
import { Formik } from "formik";
import { useState } from "react";
import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Menu, TextInput as PaperInput } from "react-native-paper";
import { useCreateServiceProviderMutation } from "../../../redux/spApi";
import { FAKE_LMS, spInitialValues, spValidationSchema } from "./spHelpers";

export default function CreateServiceProviderScreen() {
  const [createServiceProvider, { isLoading }] =
    useCreateServiceProviderMutation();

  const [menuVisible, setMenuVisible] = useState(false);

  const handleSubmit = async (
    values,
    { setSubmitting, setErrors, resetForm }
  ) => {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log(
        `CreateServiceProviderScreen ----handleSubmit ----user`,
        user
      );

      const tokenResult = await user.getIdToken(true);
      console.log(
        `CreateServiceProviderScreen ----handleSubmit ----tokenResult`,
        tokenResult
      );

      const payload = {
        profile: {
          name: values.profile.name,
          classification: "MNC", // 🔒 HARD RULE
        },

        ownership: {
          parentMncId: null,
        },

        workbases: {
          assigned: values.workbases.assigned,
        },

        status: {
          lifecycle: "DRAFT",
        },
      };

      await createServiceProvider(payload).unwrap();

      resetForm();
      alert("Service Provider registered (DRAFT)");
    } catch (e) {
      console.error(e);
      console.log(`CreateServiceProviderScreen ---e`, e);
      setErrors({ submit: e.message || "Failed to create Service Provider" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Formik
        initialValues={spInitialValues}
        validationSchema={spValidationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          errors,
          touched,
        }) => (
          <>
            <Text style={styles.title}>Register Main Contractor</Text>

            {/* SP Name */}
            <TextInput
              placeholder="Service Provider Name"
              placeholderTextColor="#666"
              value={values.profile.name}
              onChangeText={handleChange("profile.name")}
              onBlur={handleBlur("profile.name")}
              style={styles.input}
            />
            {touched.profile?.name && errors.profile?.name && (
              <Text style={styles.error}>{errors.profile.name}</Text>
            )}

            {/* Workbase (LM) – temporary manual input */}

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Workbase (Local Municipality)</Text>

              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setMenuVisible(true)}>
                    <PaperInput
                      mode="outlined"
                      value={values.workbases.assigned[0]?.name || ""}
                      placeholder="Select a Local Municipality"
                      placeholderTextColor="#666"
                      editable={false}
                      pointerEvents="none"
                      right={<PaperInput.Icon icon="menu-down" />}
                    />
                  </Pressable>
                }
              >
                {FAKE_LMS.map((lm) => (
                  <Menu.Item
                    key={lm.id}
                    title={lm.name}
                    onPress={() => {
                      setFieldValue("workbases.assigned", [
                        { id: lm.id, name: lm.name },
                      ]);
                      setMenuVisible(false);
                    }}
                  />
                ))}
              </Menu>

              {touched.workbases?.assigned && errors.workbases?.assigned && (
                <Text style={styles.error}>{errors.workbases.assigned}</Text>
              )}
            </View>

            {errors.submit && <Text style={styles.error}>{errors.submit}</Text>}

            <Button
              title={isLoading ? "Registering..." : "Register Service Provider"}
              onPress={handleSubmit}
              disabled={isLoading}
            />
          </>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 8,
    borderRadius: 4,
  },
  error: { color: "red", marginBottom: 8 },
});
