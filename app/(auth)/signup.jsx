import { Ionicons, MaterialIcons, Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useMemo, useState } from "react"; // 🎯 Added useMemo
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
import { auth } from "../../src/firebase";
import { useSignupGstMutation } from "../../src/redux/authApi";
import { useGetServiceProvidersQuery } from "../../src/redux/spApi"; // 🛰️ Added

const Signup = () => {
  const router = useRouter();
  const [signupGst, { isLoading: isMutationLoading }] = useSignupGstMutation();
  const [showPassword, setShowPassword] = useState(false);

  const [isRedirecting, setIsRedirecting] = useState(false);

  // 🛰️ LIVE REGISTRY FETCH
  const { data: sps, isLoading: isSpLoading } = useGetServiceProvidersQuery();
  // console.log(`Signup --sps`, sps);

  // 🎯 Map the Firestore 'profile.name' to the dropdown 'name'
  const serviceProviders = useMemo(() => {
    return (sps || []).map((sp) => ({
      id: sp.id,
      name: sp.profile?.tradingName?.trim() || "Unknown SP",
    }));
  }, [sps]);

  const isLoading = isMutationLoading || isRedirecting || isSpLoading;

  const handleSubmit = async (values, { resetForm }) => {
    try {
      setIsRedirecting(true);
      const result = await signupGst({
        email: values.email.toLowerCase().trim(),
        password: values.password,
        name: values.name.trim(),
        surname: values.surname.trim(),
        serviceProvider: values.serviceProvider,
      });

      if (result.data) {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }

        // 🛡️ The Redirection Strike
        Alert.alert(
          "Enlistment Successful",
          "Awaiting Manager authorization.",
          [
            {
              text: "OK",
              onPress: () => {
                resetForm();
                setIsRedirecting(false);
                // 🚀 Force AuthGate to evaluate the new user status
                router.replace("/");
              },
            },
          ],
        );
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
                    color="#aaa"
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
                    color="#aaa"
                    onPress={() => setShowPassword((p) => !p)}
                  />
                  <FormErrorText
                    touched={touched.confirmPassword}
                    error={errors.confirmPassword}
                  />
                </FormControlWrappper>

                {/* Service Provider Selector */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 5,
                    }}
                  >
                    <Text
                      style={{ fontSize: 12, fontWeight: "700", color: "gray" }}
                    >
                      Service Provider
                    </Text>
                    {isSpLoading && (
                      <ActivityIndicator size="small" color="#2563eb" />
                    )}
                  </View>
                  <ServiceProviderSelect
                    value={values.serviceProvider}
                    options={serviceProviders} // 🚀 LIVE FROM SP_API
                    disabled={isLoading}
                    onSelect={(sp) => setFieldValue("serviceProvider", sp)}
                  />
                  <FormErrorText
                    touched={touched.serviceProvider}
                    error={errors.serviceProvider}
                  />
                </View>

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
