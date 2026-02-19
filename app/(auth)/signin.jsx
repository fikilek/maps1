import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import BtnForm from "../../components/BtnForm";
import BtnRouting from "../../components/BtnRouting";
import KeyboardView from "../../components/KeyboardView";
import FormContainer from "../../components/forms/FormContainer";
import FormControlWrappper from "../../components/forms/FormControlWrappper";
import FormErrorText from "../../components/forms/FormErrorText";
import FormTitle from "../../components/forms/FormTitle";

import { userSigninValidationSchema } from "../../src/features/userHelper";
import { auth } from "../../src/firebase";
import { useSigninMutation } from "../../src/redux/authApi";

const Signin = () => {
  const [signin, { isLoading: isMutationLoading }] = useSigninMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isLoading = isMutationLoading || isRedirecting;
  const router = useRouter();

  const handleSubmit = async (values, { resetForm }) => {
    try {
      setIsRedirecting(true);
      const result = await signin({
        email: values.email.toLowerCase().trim(),
        password: values.password,
      }).unwrap();

      if (result) {
        await auth.currentUser.getIdToken(true);
        router.replace("/(tabs)/erfs");
        resetForm();
      }
    } catch (err) {
      setIsRedirecting(false);
      Alert.alert("Access Denied", err?.message || "Invalid credentials.");
    }
  };

  return (
    <KeyboardView>
      <FormContainer>
        <Image
          source={require("../../assets/images/login.png")}
          style={styles.heroImage}
          contentFit="contain"
        />

        <Formik
          initialValues={{ email: "spu@smars.co.za", password: "fkpass123" }}
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
            <View style={styles.formContent}>
              <FormTitle title="Signin" />
              <Text style={styles.subtitle}>
                Secure access to iREPS Command
              </Text>

              <View style={{ gap: 15 }}>
                <FormControlWrappper style={styles.inputGroup}>
                  <Octicons name="mail" size={18} color="#2563eb" />
                  <TextInput
                    placeholder="Command Email"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                    style={styles.textInput}
                  />
                  <FormErrorText touched={touched.email} error={errors.email} />
                </FormControlWrappper>

                <View>
                  <FormControlWrappper style={styles.inputGroup}>
                    <Octicons name="lock" size={18} color="#2563eb" />
                    <TextInput
                      placeholder="Password"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                      style={styles.textInput}
                    />
                    <Octicons
                      name={showPassword ? "eye" : "eye-closed"}
                      size={20}
                      color="#94a3b8"
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  </FormControlWrappper>
                  <FormErrorText
                    touched={touched.password}
                    error={errors.password}
                  />

                  <View style={styles.resetContainer}>
                    <BtnRouting
                      destinationRoute="/pwdReset"
                      title="Lost access?"
                      color="#64748b"
                    />
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <BtnForm
                    title="Reset"
                    handlePress={resetForm}
                    type="outline"
                  />
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <BtnForm title="Signin" handlePress={handleSubmit} />
                  )}
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>New User?</Text>
                <BtnRouting destinationRoute="/signup" title="Signup" />
              </View>
            </View>
          )}
        </Formik>
      </FormContainer>
    </KeyboardView>
  );
};

const styles = StyleSheet.create({
  heroImage: { height: 180, marginTop: 20 },
  formContent: { padding: 20 },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 25,
    fontWeight: "500",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },
  resetContainer: { alignItems: "flex-end", marginTop: 4 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 30,
  },
  footerText: { fontSize: 13, color: "#64748b" },
});

export default Signin;

// import { Octicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import { Formik } from "formik";
// import { useState } from "react";
// import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";

// import BtnForm from "../../components/BtnForm";
// import BtnRouting from "../../components/BtnRouting";
// import KeyboardView from "../../components/KeyboardView";
// import FormContainer from "../../components/forms/FormContainer";
// import FormControlWrappper from "../../components/forms/FormControlWrappper";
// import FormErrorText from "../../components/forms/FormErrorText";
// import FormTitle from "../../components/forms/FormTitle";

// import { useRouter } from "expo-router";
// import { userSigninValidationSchema } from "../../src/features/userHelper";
// import { auth } from "../../src/firebase";
// import { useSigninMutation } from "../../src/redux/authApi";

// const signinInitialValues = {
//   email: "spu@smars.co.za",
//   password: "fkpass123",
// };

// const Signin = () => {
//   const [signin, { isLoading: isMutationLoading }] = useSigninMutation();
//   const [showPassword, setShowPassword] = useState(false);
//   const [isRedirecting, setIsRedirecting] = useState(false); // New state
//   // Combine them for the UI
//   const isLoading = isMutationLoading || isRedirecting;

//   const router = useRouter();

//   const handleSubmit = async (values, { resetForm }) => {
//     // console.log(`Signin ----handleSubmit ----values`, values);
//     try {
//       setIsRedirecting(true); // Start the spinner
//       const signinResult = await signin({
//         email: values.email.toLowerCase().trim(),
//         password: values.password,
//       });
//       // console.log(`Signin ----handleSubmit ----signinResult`, signinResult);

//       if (signinResult.data) {
//         // IMPORTANT: Do NOT set isRedirecting(false) here.
//         // Let the AuthGate handle the transition while we keep spinning.
//         await auth.currentUser.getIdToken(true); // 🔑 force refresh
//         const tokenResult = await auth.currentUser.getIdTokenResult();
//         // console.log(`Signin ----handleSubmit ----tokenResult`, tokenResult);

//         setIsRedirecting(false);
//         router.replace("/(tabs)/erfs");
//         resetForm();
//       } else {
//         setIsRedirecting(false); // Only stop spinning if it failed
//         Alert.alert("Sign In Failed");
//         router.replace("/(tabs)/erfs");
//       }
//     } catch {
//       setIsRedirecting(false);
//       Alert.alert("Error");
//     }
//   };

//   return (
//     <KeyboardView>
//       <FormContainer>
//         {/* Signin image */}
//         <Image
//           source={require("../../assets/images/login.png")}
//           style={{ height: 200 }}
//           contentFit="contain"
//         />

//         <Formik
//           initialValues={signinInitialValues}
//           validationSchema={userSigninValidationSchema}
//           onSubmit={handleSubmit}
//         >
//           {({
//             values,
//             errors,
//             touched,
//             handleChange,
//             handleBlur,
//             handleSubmit,
//             resetForm,
//           }) => (
//             <View style={{ margin: 10 }}>
//               <FormTitle title="Signin" />

//               <View style={{ gap: 20 }}>
//                 {/* Email */}
//                 <FormControlWrappper>
//                   <View
//                     style={{
//                       flexDirection: "row",
//                       alignItems: "center",
//                       gap: 10,
//                     }}
//                   >
//                     <Octicons name="mail" size={20} color="gray" />
//                     <TextInput
//                       placeholder="Email Address"
//                       placeholderTextColor="gray"
//                       value={values.email}
//                       onChangeText={handleChange("email")}
//                       onBlur={handleBlur("email")}
//                       autoCapitalize="none"
//                       keyboardType="email-address"
//                       editable={!isLoading}
//                       style={{ flex: 1, fontSize: 14 }}
//                     />
//                   </View>
//                   <FormErrorText touched={touched.email} error={errors.email} />
//                 </FormControlWrappper>

//                 {/* Password */}
//                 <View>
//                   <FormControlWrappper>
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         alignItems: "center",
//                         gap: 10,
//                       }}
//                     >
//                       <Octicons name="lock" size={20} color="gray" />
//                       <TextInput
//                         placeholder="Password"
//                         placeholderTextColor="gray"
//                         value={values.password}
//                         onChangeText={handleChange("password")}
//                         onBlur={handleBlur("password")}
//                         secureTextEntry={!showPassword}
//                         editable={!isLoading}
//                         style={{ flex: 1, fontSize: 14 }}
//                       />
//                       <Octicons
//                         name={showPassword ? "eye" : "eye-closed"}
//                         size={22}
//                         color="#aaa"
//                         onPress={() => setShowPassword((prev) => !prev)}
//                       />
//                     </View>
//                     <FormErrorText
//                       touched={touched.password}
//                       error={errors.password}
//                     />
//                   </FormControlWrappper>

//                   <View style={{ alignItems: "flex-end" }}>
//                     <BtnRouting
//                       destinationRoute="/pwdReset"
//                       title="Password Reset"
//                     />
//                   </View>
//                 </View>

//                 {/* Buttons */}
//                 <View
//                   style={{
//                     flexDirection: "row",
//                     justifyContent: "space-around",
//                   }}
//                 >
//                   <BtnForm
//                     title="Reset"
//                     handlePress={resetForm}
//                     isLoading={isLoading}
//                   />

//                   {isLoading ? (
//                     <ActivityIndicator size="large" color="black" />
//                   ) : (
//                     <BtnForm title="Submit" handlePress={handleSubmit} />
//                   )}
//                 </View>
//               </View>

//               {/* Signup link */}
//               <View
//                 style={{
//                   flexDirection: "row",
//                   gap: 4,
//                   justifyContent: "center",
//                   marginTop: 20,
//                 }}
//               >
//                 <Text style={{ fontSize: 12, fontWeight: "500" }}>
//                   Do NOT have an account?
//                 </Text>
//                 <BtnRouting destinationRoute="/signup" title="Signup" />
//               </View>
//             </View>
//           )}
//         </Formik>
//       </FormContainer>
//     </KeyboardView>
//   );
// };

// export default Signin;
