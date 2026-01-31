import { Feather } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FormSubmitButton = () => {
  const { handleSubmit, isSubmitting, isValid } = useFormikContext();

  // 🎨 Rule-based styling from Excel Forge
  const getStyles = () => {
    if (isSubmitting)
      return {
        border: "black",
        text: "#10b981",
        bg: "#e2e8f0",
        spinner: true,
        disabled: true,
        icon: "check",
      };
    if (!isValid)
      return {
        border: "#ef4444",
        text: "#ef4444",
        bg: "#e2e8f0",
        spinner: false,
        disabled: true,
        icon: "x",
      };
    return {
      border: "#10b981",
      text: "#10b981",
      bg: "#e2e8f0",
      spinner: false,
      disabled: false,
      icon: "check",
    };
  };

  const config = getStyles();

  return (
    <TouchableOpacity
      disabled={config.disabled}
      onPress={handleSubmit}
      style={[
        styles.btn,
        { borderColor: config.border, backgroundColor: config.bg },
      ]}
    >
      {config.spinner ? (
        <ActivityIndicator color={config.text} />
      ) : (
        <View style={styles.content}>
          <Feather name={config.icon} size={24} color={config.text} />
          <Text style={[styles.text, { color: config.text }]}>SUBMIT</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flex: 2,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flexDirection: "row", alignItems: "center" },
  text: { fontWeight: "900", marginLeft: 8, letterSpacing: 1 },
});

export default FormSubmitButton;
