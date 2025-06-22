import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";

interface ContainerInfoSimpleProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  minHeight?: number;
}

const ContainerInfoSimple: React.FC<ContainerInfoSimpleProps> = ({
  children,
  style,
  padding,
  minHeight,
}) => {
  return (
    <View style={[styles.container, { minHeight, padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "#053688",
    borderRadius: 16,
  },
});

export default ContainerInfoSimple;
