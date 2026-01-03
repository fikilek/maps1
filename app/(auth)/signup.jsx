import { Ionicons, MaterialIcons, Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";

import BtnForm from "../../components/BtnForm";
import BtnRouting from "../../components/BtnRouting";
import FormContainer from "../../components/forms/FormContainer";
import FormControlWrappper from "../../components/forms/FormControlWrappper";
import FormErrorText from "../../components/forms/FormErrorText";
import FormTitle from "../../components/forms/FormTitle";
import KeyboardView from "../../components/KeyboardView";

import { Image } from "expo-image";
import ServiceProviderSelect, {
  gstSignupInitialValues,
  gstSignupValidationSchema,
} from "../../src/features/userHelper";
import { useSignupGstMutation } from "../../src/redux/authApi";

// ⚠️ TEMP: replace with real SP query later
const serviceProviders = [
  { id: "sp1", name: "Thabang" },
  { id: "sp2", name: "Elsa" },
  { id: "sp3", name: "Lefu Meters" },
  { id: "sp4", name: "Thato" },
  { id: "sp5", name: "Rste" },
];

const Signup = () => {
  const router = useRouter();
  const [signupGst, { isLoading: isMutationLoading }] = useSignupGstMutation();
  const [showPassword, setShowPassword] = useState(false);

  const [isRedirecting, setIsRedirecting] = useState(false); // New state
  // Combine them for the UI
  const isLoading = isMutationLoading || isRedirecting;

  const handleSubmit = async (values, { resetForm }) => {
    console.log(`Signup ----handleSubmit ----values`, values);
    try {
      setIsRedirecting(true); // Start the spinner
      const result = await signupGst({
        email: values.email.toLowerCase().trim(),
        password: values.password,
        name: values.name.trim(),
        surname: values.surname.trim(),
        serviceProvider: values.serviceProvider,
      });

      if (result.data) {
        resetForm();
      } else {
        setIsRedirecting(false);
        Alert.alert("Sign Up Failed", "Please try again.");
      }
    } catch (err) {
      setIsRedirecting(false);
      Alert.alert("Error", "Unexpected error occurred.");
    }
  };

  return (
    <KeyboardView>
      <FormContainer>
        <Image
          source={require("../../assets/images/register.png")}
          style={{ height: 150 }}
          contentFit="contain"
        />

        <Formik
          initialValues={gstSignupInitialValues}
          validationSchema={gstSignupValidationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            resetForm,
          }) => (
            <View style={{ margin: 10 }}>
              <FormTitle title="Signup" />

              <View style={{ gap: 22 }}>
                {/* Surname */}
                <FormControlWrappper>
                  <Ionicons name="person-add" size={20} color="gray" />
                  <TextInput
                    placeholder="Surname"
                    value={values.surname}
                    onChangeText={handleChange("surname")}
                    onBlur={handleBlur("surname")}
                    editable={!isLoading}
                    style={{ flex: 1 }}
                  />
                  <FormErrorText
                    touched={touched.surname}
                    error={errors.surname}
                  />
                </FormControlWrappper>

                {/* Name */}
                <FormControlWrappper>
                  <Ionicons name="person-add-outline" size={20} color="gray" />
                  <TextInput
                    placeholder="Name"
                    value={values?.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                    editable={!isLoading}
                    style={{ flex: 1 }}
                  />
                  <FormErrorText touched={touched.name} error={errors.name} />
                </FormControlWrappper>

                {/* Email */}
                <FormControlWrappper>
                  <Octicons name="mail" size={20} color="gray" />
                  <TextInput
                    placeholder="Email"
                    value={values?.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                    style={{ flex: 1 }}
                  />
                  <FormErrorText touched={touched.email} error={errors.email} />
                </FormControlWrappper>

                {/* Password */}
                <FormControlWrappper>
                  <Octicons name="lock" size={20} color="gray" />
                  <TextInput
                    placeholder="Password"
                    value={values?.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    style={{ flex: 1 }}
                  />
                  <Octicons
                    name={showPassword ? "eye" : "eye-closed"}
                    size={22}
                    onPress={() => setShowPassword((p) => !p)}
                  />
                  <FormErrorText
                    touched={touched.password}
                    error={errors.password}
                  />
                </FormControlWrappper>

                {/* Confirm Password */}
                <FormControlWrappper>
                  <MaterialIcons name="password" size={20} color="gray" />
                  <TextInput
                    placeholder="Confirm Password"
                    value={values?.confirmPassword}
                    onChangeText={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    style={{ flex: 1 }}
                  />
                  <Octicons
                    name={showPassword ? "eye" : "eye-closed"}
                    size={22}
                    onPress={() => setShowPassword((p) => !p)}
                  />
                  <FormErrorText
                    touched={touched.confirmPassword}
                    error={errors.confirmPassword}
                  />
                </FormControlWrappper>

                {/* Service Provider Selector */}

                <ServiceProviderSelect
                  value={values.serviceProvider}
                  options={serviceProviders} // from Firestore / RTK Query
                  disabled={isLoading}
                  onSelect={(sp) => setFieldValue("serviceProvider", sp)}
                />
                <FormErrorText
                  touched={touched.serviceProvider}
                  error={errors.serviceProvider}
                />

                {/* Buttons */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                  }}
                >
                  <BtnForm title="Reset" handlePress={resetForm} />
                  {isLoading ? (
                    <ActivityIndicator />
                  ) : (
                    <BtnForm title="Submit" handlePress={handleSubmit} />
                  )}
                </View>

                {/* Routing */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  <Text>Already have an account?</Text>
                  <BtnRouting destinationRoute="/signin" title="Signin" />
                </View>
              </View>
            </View>
          )}
        </Formik>
      </FormContainer>
    </KeyboardView>
  );
};

export default Signup;
