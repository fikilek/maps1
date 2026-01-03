import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Formik } from "formik";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";

import BtnForm from "../../components/BtnForm";
import BtnRouting from "../../components/BtnRouting";
import KeyboardView from "../../components/KeyboardView";
import FormContainer from "../../components/forms/FormContainer";
import FormControlWrappper from "../../components/forms/FormControlWrappper";
import FormErrorText from "../../components/forms/FormErrorText";
import FormTitle from "../../components/forms/FormTitle";

import { userSigninValidationSchema } from "../../src/features/userHelper";
import { useSigninMutation } from "../../src/redux/authApi";

const signinInitialValues = {
  email: "sveve@gmail.com",
  password: "fkpass123",
};

const Signin = () => {
  const [signin, { isLoading: isMutationLoading }] = useSigninMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // New state
  // Combine them for the UI
  const isLoading = isMutationLoading || isRedirecting;

  const handleSubmit = async (values, { resetForm }) => {
    try {
      setIsRedirecting(true); // Start the spinner
      const signinResult = await signin({
        email: values.email.toLowerCase().trim(),
        password: values.password,
      });

      if (signinResult.data) {
        // IMPORTANT: Do NOT set isRedirecting(false) here.
        // Let the AuthGate handle the transition while we keep spinning.
        resetForm();
      } else {
        setIsRedirecting(false); // Only stop spinning if it failed
        Alert.alert("Sign In Failed");
      }
    } catch {
      setIsRedirecting(false);
      Alert.alert("Error");
    }
  };

  return (
    <KeyboardView>
      <FormContainer>
        {/* Signin image */}
        <Image
          source={require("../../assets/images/login.png")}
          style={{ height: 200 }}
          contentFit="contain"
        />

        <Formik
          initialValues={signinInitialValues}
          validationSchema={userSigninValidationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            resetForm,
          }) => (
            <View style={{ margin: 10 }}>
              <FormTitle title="Signin" />

              <View style={{ gap: 20 }}>
                {/* Email */}
                <FormControlWrappper>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Octicons name="mail" size={20} color="gray" />
                    <TextInput
                      placeholder="Email Address"
                      placeholderTextColor="gray"
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isLoading}
                      style={{ flex: 1, fontSize: 14 }}
                    />
                  </View>
                  <FormErrorText touched={touched.email} error={errors.email} />
                </FormControlWrappper>

                {/* Password */}
                <View>
                  <FormControlWrappper>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Octicons name="lock" size={20} color="gray" />
                      <TextInput
                        placeholder="Password"
                        placeholderTextColor="gray"
                        value={values.password}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        secureTextEntry={!showPassword}
                        editable={!isLoading}
                        style={{ flex: 1, fontSize: 14 }}
                      />
                      <Octicons
                        name={showPassword ? "eye" : "eye-closed"}
                        size={22}
                        color="#aaa"
                        onPress={() => setShowPassword((prev) => !prev)}
                      />
                    </View>
                    <FormErrorText
                      touched={touched.password}
                      error={errors.password}
                    />
                  </FormControlWrappper>

                  <View style={{ alignItems: "flex-end" }}>
                    <BtnRouting
                      destinationRoute="/pwdReset"
                      title="Password Reset"
                    />
                  </View>
                </View>

                {/* Buttons */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                  }}
                >
                  <BtnForm
                    title="Reset"
                    handlePress={resetForm}
                    isLoading={isLoading}
                  />

                  {isLoading ? (
                    <ActivityIndicator size="large" color="black" />
                  ) : (
                    <BtnForm title="Submit" handlePress={handleSubmit} />
                  )}
                </View>
              </View>

              {/* Signup link */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 4,
                  justifyContent: "center",
                  marginTop: 20,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "500" }}>
                  Do NOT have an account?
                </Text>
                <BtnRouting destinationRoute="/signup" title="Signup" />
              </View>
            </View>
          )}
        </Formik>
      </FormContainer>
    </KeyboardView>
  );
};

export default Signin;
