import { Text, TouchableOpacity } from "react-native";

const BtnForm = (props) => {
  const {
    // TochableOpacity props
    backgroundColor = "indigo",
    height = 60,
    width = 90,
    isLoading = false,
    // Text props
    fontSize = 14,
    color = "white",
    title = "title",
    // Press event handle
    handlePress,
  } = props;

  return (
    <TouchableOpacity
      style={{
        width: width,
        height: height,
        backgroundColor: backgroundColor,
        borderRadius: 5,
        opacity: isLoading ? 0.2 : 1,
        disabled: isLoading,
        // padding: 5,
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={handlePress}
    >
      <Text
        style={{
          fontSize: fontSize,
          fontWeight: "bold",
          padding: "3",
          color: color,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default BtnForm;
