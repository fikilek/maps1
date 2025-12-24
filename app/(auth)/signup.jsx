import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";

import BtnForm from "../../components/BtnForm";
import BtnRouting from "../../components/BtnRouting";
import FormContainer from "../../components/forms/FormContainer";
import FormControlWrappper from "../../components/forms/FormControlWrappper";
import FormTitle from "../../components/forms/FormTitle";
import KeyboardView from "../../components/KeyboardView";

import FormErrorText from "../../components/forms/FormErrorText";
import {
  userNewFormData,
  userValidationSchema,
} from "../../src/features/userHelper";
import { useSignupMutation } from "../../src/redux/authApi";

const Signup = () => {
  const router = useRouter();
  const [signup, { isLoading }] = useSignupMutation();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values, { resetForm }) => {
    console.log(`Signup ---handleSubmit ---values`, values);
    try {
      const result = await signup({
        email: values.email.toLowerCase().trim(),
        password: values.password,
        name: values.name.trim(),
        surname: values.surname.trim(),
        phoneNumber: values.phoneNumber.trim(),
      });
      console.log(`Signup ---handleSubmit ---result`, result);

      if (result.data) {
        resetForm();
        router.replace("/(app)");
      } else {
        Alert.alert("Sign Up", "Sign up failed. Please try again.");
      }
    } catch {
      Alert.alert("Sign Up", "Unexpected error occurred.");
    }
  };

  return (
    <KeyboardView>
      <FormContainer>
        {/* Signup image */}
        <Image
          source={require("../../assets/images/register.png")}
          style={{ height: 150 }}
          contentFit="contain"
        />

        <Formik
          initialValues={userNewFormData}
          validationSchema={userValidationSchema}
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
              <FormTitle title="Signup" />

              <View style={{ gap: 25, width: "100%" }}>
                {/* Surname */}
                <FormControlWrappper>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Ionicons name="person-add" size={20} color="gray" />
                    <TextInput
                      placeholder="Surname"
                      value={values.surname}
                      onChangeText={handleChange("surname")}
                      onBlur={handleBlur("surname")}
                      editable={!isLoading}
                      style={{ flex: 1 }}
                    />
                  </View>
                  <FormErrorText
                    touched={touched.surname}
                    error={errors.surname}
                  />
                </FormControlWrappper>

                {/* Name */}
                <FormControlWrappper>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={20}
                      color="gray"
                    />
                    <TextInput
                      placeholder="Name"
                      value={values.name}
                      onChangeText={handleChange("name")}
                      onBlur={handleBlur("name")}
                      editable={!isLoading}
                      style={{ flex: 1 }}
                    />
                  </View>
                  <FormErrorText touched={touched.name} error={errors.name} />
                </FormControlWrappper>

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
                      placeholder="Email"
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isLoading}
                      style={{ flex: 1 }}
                    />
                  </View>
                  <FormErrorText touched={touched.email} error={errors.email} />
                </FormControlWrappper>

                {/* Password */}
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
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                      style={{ flex: 1 }}
                    />
                    <Octicons
                      name={showPassword ? "eye" : "eye-closed"}
                      size={22}
                      color="gray"
                      onPress={() => setShowPassword((prev) => !prev)}
                    />
                  </View>
                  <FormErrorText
                    touched={touched.password}
                    error={errors.password}
                  />
                </FormControlWrappper>

                {/* Confirm Password */}
                <FormControlWrappper>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <MaterialIcons name="password" size={20} color="gray" />
                    <TextInput
                      placeholder="Confirm Password"
                      value={values.confirmPassword}
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                      style={{ flex: 1 }}
                    />
                    <Octicons
                      name={showPassword ? "eye" : "eye-closed"}
                      size={22}
                      color="gray"
                      onPress={() => setShowPassword((prev) => !prev)}
                    />
                  </View>
                  <FormErrorText
                    touched={touched.confirmPassword}
                    error={errors.confirmPassword}
                  />
                </FormControlWrappper>

                {/* Phone Number */}
                <FormControlWrappper>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="cellphone-basic"
                      size={22}
                      color="gray"
                    />
                    <TextInput
                      placeholder="Phone Number"
                      value={values.phoneNumber}
                      onChangeText={handleChange("phoneNumber")}
                      onBlur={handleBlur("phoneNumber")}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                      style={{ flex: 1 }}
                    />
                  </View>
                  <FormErrorText
                    touched={touched.confirmPassword}
                    error={errors.confirmPassword}
                  />
                </FormControlWrappper>

                {/* Buttons */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                  }}
                >
                  <BtnForm title="Reset" handlePress={resetForm} />
                  {isLoading ? (
                    <ActivityIndicator size="large" color="black" />
                  ) : (
                    <BtnForm title="Submit" handlePress={handleSubmit} />
                  )}
                </View>

                {/* Routing */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 4,
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "500" }}>
                    Already have an account?
                  </Text>
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
