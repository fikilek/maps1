import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";

import { Image } from "expo-image";
import BtnForm from "../../components/BtnForm";
import BtnRouting from "../../components/BtnRouting";
import KeyboardView from "../../components/KeyboardView";
import FormContainer from "../../components/forms/FormContainer";
import FormControlWrappper from "../../components/forms/FormControlWrappper";
import FormTitle from "../../components/forms/FormTitle";
import { useSigninMutation } from "../../src/redux/authApi";

const emailInit = "fikile@gmail.com";
const pwdInit = "fkpass123";

const Signin = () => {
  console.log(` `);
  console.log(` `);
  console.log(`Signin ----START START START`);
  console.log(`Signin ----START START START`);

  const [signin, { isLoading }] = useSigninMutation();

  // const [isLoading, setIsLoading] = useState(false);
  console.log(`Signin ----isLoading`, isLoading);

  // const emailRef = useRef("");
  const [email, setEmail] = useState(emailInit);
  console.log(`Signin ----email`, email);

  const [password, setPassword] = useState(pwdInit);
  console.log(`Signin ----password`, password);

  // State variable to track password visibility
  const [showPassword, setShowPassword] = useState(false);

  // const { logon } = useAuth();

  const router = useRouter();

  const handleSignin = async () => {
    // trim email and password
    setEmail(email?.trim());
    setPassword(password?.trim());

    // check if email and password are not empty
    if (
      (email === "",
      email === null,
      email === undefined || password === "",
      password === null,
      password === undefined)
    ) {
      Alert.alert("Sign In", "Please fill in all fields");
      return;
    }

    // Signin process
    // setIsLoading(true);

    console.log(`Signin ----About to sign in with email: ${email}`);
    const result = await signin({ email, password });
    console.log(`Signin ----result`, result);
    // console.log(`Signin ----result`, JSON.stringify(result, null, 2));

    if (result.data) {
      // setIsLoading(false);
      console.log("Signin ----Sign In Successful");
      handleReset();
      router.navigate("/(app)/(app)");
      Alert.alert("Sign In Successful", result.data.email);
    } else {
      // setIsLoading(false);
      let msg = "";
      if (result.error.includes("invalid-email")) {
        msg = "Invalid email. Please use another email.";
      } else {
        msg = "Sign In Failed. Please try again.";
      }
      console.log("Signin ----Sign In", msg);
      Alert.alert("Sign In", msg);
    }

    // Simulate a network request
  };

  const handleReset = () => {
    console.log("Signin ----handleReset");
    setEmail(emailInit);
    setPassword(pwdInit);
  };

  const togglePasswordVisibility = () => {
    console.log("Signin ----togglePasswordVisibility");
    setShowPassword(!showPassword);
  };

  console.log(`Signin ----END END END`);
  console.log(`Signin ----END END END`);
  console.log(` `);
  console.log(` `);

  return (
    <KeyboardView>
      <FormContainer>
        {/* signin image */}
        <Image
          source={require("../../assets/images/login.png")}
          style={{ height: 200 }}
          contentFit="contain"
        />

        <View style={{ margin: 10 }}>
          {/* Form Title */}
          <FormTitle title="Signin" />

          <View style={{ gap: 20 }}>
            {/* Form Input Control - Email */}
            <FormControlWrappper>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Octicons name="mail" size={20} color="gray" />
                <TextInput
                  style={{ fontSize: 14 }}
                  placeholder="Email Address"
                  placeholderTextColor="gray"
                  onChangeText={(text) => setEmail(text)}
                  value={email}
                  editable={!isLoading}
                />
              </View>
            </FormControlWrappper>

            <View>
              {/* Form Input Control - Password */}
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
                    style={{ fontSize: 14 }}
                    placeholder="Password"
                    placeholderTextColor="gray"
                    secureTextEntry={!showPassword}
                    onChangeText={(value) => setPassword(value)}
                    value={password}
                    editable={!isLoading}
                  />
                </View>
                <Octicons
                  name={showPassword ? "eye" : "eye-closed"}
                  size={25}
                  color="#aaa"
                  style={{
                    marginLeft: 10,
                  }}
                  onPress={togglePasswordVisibility}
                />
              </FormControlWrappper>

              <View style={{ alignItems: "flex-end" }}>
                <BtnRouting
                  destinationRoute={"/pwdReset"}
                  title={"Password Reset"}
                />
              </View>
            </View>

            {/* reset and submit button */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-around" }}
            >
              <BtnForm
                handlePress={handleReset}
                isLoading={isLoading}
                title={"Reset"}
              />

              {isLoading ? (
                <View style={{ height: 30, width: 40, alignItems: "center" }}>
                  <ActivityIndicator size="large" color="black" />
                </View>
              ) : (
                <BtnForm handlePress={handleSignin} title={"Submit"} />
              )}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 4,
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                textAlign: "right",
                marginRight: 2,
              }}
            >
              Don NOT have an account?
            </Text>
            <BtnRouting destinationRoute={"/signup"} title={"Signup"} />
          </View>
        </View>
      </FormContainer>
    </KeyboardView>
  );
};

export default Signin;
