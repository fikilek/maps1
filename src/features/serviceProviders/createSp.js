import { Formik } from "formik";
import { Button, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useCreateServiceProviderMutation } from "../../../src/redux/spApi";
import { spInitialValues, spValidationSchema } from "./spHelpers";

export default function CreateServiceProviderScreen() {
  const [createServiceProvider, { isLoading }] =
    useCreateServiceProviderMutation();

  const handleSubmit = async (
    values,
    { setSubmitting, setErrors, resetForm }
  ) => {
    try {
      const payload = {
        profile: values.profile,
        classification: values.profile.classification,
        parentMncId: values.ownership.parentMncId,
        workbases: values.workbases.assigned,
        offices: values.offices,
      };

      await createServiceProvider(payload).unwrap();

      resetForm();
      alert("Service Provider created successfully");
    } catch (e) {
      console.error(e);
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
          errors,
          touched,
        }) => (
          <>
            <Text style={styles.title}>Create Service Provider</Text>

            {/* SP Name */}
            <TextInput
              placeholder="Service Provider Name"
              value={values.profile.name}
              onChangeText={handleChange("profile.name")}
              onBlur={handleBlur("profile.name")}
              style={styles.input}
            />
            {touched.profile?.name && errors.profile?.name && (
              <Text style={styles.error}>{errors.profile.name}</Text>
            )}

            {/* Registration Number */}
            <TextInput
              placeholder="Registration Number"
              value={values.profile.registrationNumber}
              onChangeText={handleChange("profile.registrationNumber")}
              style={styles.input}
            />

            {/* LM ID (temporary manual input) */}
            {values.profile.classification === "MNC" && (
              <TextInput
                placeholder="Local Municipality ID (e.g. ZA1048)"
                value={values.workbases.assigned[0] || ""}
                onChangeText={(v) => (values.workbases.assigned = [v])}
                style={styles.input}
              />
            )}

            {/* Office Address */}
            <TextInput
              placeholder="Office Address Line 1"
              value={values.offices[0].address.line1}
              onChangeText={handleChange("offices[0].address.line1")}
              style={styles.input}
            />

            <TextInput
              placeholder="City"
              value={values.offices[0].address.city}
              onChangeText={handleChange("offices[0].address.city")}
              style={styles.input}
            />

            <TextInput
              placeholder="Province"
              value={values.offices[0].address.province}
              onChangeText={handleChange("offices[0].address.province")}
              style={styles.input}
            />

            {/* GPS */}
            <TextInput
              placeholder="Latitude"
              value={values.offices[0].location.lat}
              onChangeText={handleChange("offices[0].location.lat")}
              style={styles.input}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="Longitude"
              value={values.offices[0].location.lng}
              onChangeText={handleChange("offices[0].location.lng")}
              style={styles.input}
              keyboardType="numeric"
            />

            {errors.submit && <Text style={styles.error}>{errors.submit}</Text>}

            <Button
              title={isLoading ? "Creating..." : "Create Service Provider"}
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
