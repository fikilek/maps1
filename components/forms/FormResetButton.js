import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const FormResetButton = () => {
  const { resetForm, isSubmitting, isValid } = useFormikContext();

  // 🎨 Rule-based styling from Excel Forge
  const getStyles = () => {
    if (isSubmitting)
      return {
        border: "black",
        text: "#10b981",
        bg: "transparent",
        disabled: true,
      };
    if (!isValid)
      return {
        border: "#ef4444",
        text: "#ef4444",
        bg: "#f1f5f9",
        disabled: false,
      };
    return {
      border: "#10b981",
      text: "#10b981",
      bg: "#f1f5f9",
      disabled: false,
    };
  };

  const config = getStyles();

  return (
    <TouchableOpacity
      disabled={config.disabled}
      onPress={() => resetForm()}
      style={[
        styles.btn,
        {
          borderColor: config.border,
          backgroundColor: config.bg,
          opacity: isSubmitting ? 0.5 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons name="refresh" size={20} color={config.text} />
      <Text style={[styles.text, { color: config.text }]}>RESET</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { fontWeight: "900", marginLeft: 8, letterSpacing: 1 },
});

export default FormResetButton;
