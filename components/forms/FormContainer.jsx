import { View } from "react-native";

const FormContainer = (props) => {
  const {
    children,
    paddingHorizontal = 10,
    paddingTop = 40,
    backgroundColor = "white",
  } = props;
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: backgroundColor,
      }}
    >
      {children}
    </View>
  );
};

export default FormContainer;
