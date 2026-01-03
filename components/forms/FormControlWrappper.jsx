import { View } from "react-native";

const FormControlWrappper = (props) => {
  const {
    backgroundColor = "lightgrey",
    // paddingHorizontal = 10,
    borderRadius = 5,
    children,
  } = props;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 40,
        paddingHorizontal: 20,
        backgroundColor: backgroundColor,
        borderRadius: borderRadius,
      }}
    >
      {children}
    </View>
  );
};

export default FormControlWrappper;
