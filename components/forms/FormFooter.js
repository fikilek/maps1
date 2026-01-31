import { StyleSheet, View } from "react-native";
import FormResetButton from "./FormResetButton";
import FormSubmitButton from "./FormSubmitButton";

const FormFooter = () => {
  return (
    <View style={styles.footer}>
      <FormResetButton />
      <View style={{ width: 12 }} />
      <FormSubmitButton />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#f1f5f9",
  },
});

export default FormFooter;
