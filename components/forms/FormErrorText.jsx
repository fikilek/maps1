import { Text } from "react-native";

const FormErrorText = ({ error, touched }) => {
  if (!touched || !error) return null;

  return (
    <Text
      style={{
        color: "red",
        fontSize: 12,
      }}
    >
      {error}
    </Text>
  );
};

export default FormErrorText;
