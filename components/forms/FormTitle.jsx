import { Text } from "react-native";

const FormTitle = (props) => {
  const { title, fontSize = 30, marginVertical = 20 } = props;
  return (
    <Text
      style={{
        fontSize: fontSize,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: marginVertical,
      }}
    >
      {title}
    </Text>
  );
};

export default FormTitle;
