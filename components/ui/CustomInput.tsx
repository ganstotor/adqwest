import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { ACCENT1_LIGHT } from "../../constants/Colors";

interface CustomInputProps extends TextInputProps {
  label: string;
  containerStyle?: any;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#888"
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: ACCENT1_LIGHT,
    marginBottom: 8,
    fontSize: 16,
    fontFamily: "Kantumruy Pro",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: ACCENT1_LIGHT,
    borderRadius: 100,
    paddingHorizontal: 20,
    backgroundColor: "#000",
    color: "#fff",
    fontSize: 16,
  },
});

export default CustomInput;
