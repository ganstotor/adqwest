import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Path,
  Defs,
  Filter,
  FeGaussianBlur,
  FeColorMatrix,
  FeMerge,
  FeMergeNode,
} from "react-native-svg";

interface AutoHeightProps {
  children: React.ReactNode;
  minHeight?: number;
  padding?: number;
}

const glowDefs = (
  <Defs>
    <Filter id="glow-yellow">
      <FeGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <FeColorMatrix
        in="blur"
        type="matrix"
        values="0 0 0 0 0.992 0 0 0 0 0.917 0 0 0 0 0.207 0 0 0 1 0"
        result="coloredBlur"
      />
      <FeMerge>
        <FeMergeNode in="coloredBlur" />
        <FeMergeNode in="SourceGraphic" />
      </FeMerge>
    </Filter>
    <Filter id="glow-gold">
      <FeGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <FeColorMatrix
        in="blur"
        type="matrix"
        values="0 0 0 0 0.945 0 0 0 0 0.686 0 0 0 0 0.027 0 0 0 1 0"
        result="coloredBlur"
      />
      <FeMerge>
        <FeMergeNode in="coloredBlur" />
        <FeMergeNode in="SourceGraphic" />
      </FeMerge>
    </Filter>
    <Filter id="glow-blue">
      <FeGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <FeColorMatrix
        in="blur"
        type="matrix"
        values="0 0 0 0 0.02 0 0 0 0 0.21 0 0 0 0 0.53 0 0 0 1 0"
        result="coloredBlur"
      />
      <FeMerge>
        <FeMergeNode in="coloredBlur" />
        <FeMergeNode in="SourceGraphic" />
      </FeMerge>
    </Filter>
  </Defs>
);

const ORIGINAL_HEIGHT = 296;

const ContainerInfoMain = ({
  children,
  minHeight = 296,
  padding = 45,
}: AutoHeightProps) => {
  const [contentHeight, setContentHeight] = useState(minHeight);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    const finalHeight = Math.max(height, minHeight);

    if (Math.abs(contentHeight - finalHeight) > 1) {
      setContentHeight(finalHeight);
    }
  };

  const delta = contentHeight - ORIGINAL_HEIGHT;
  const viewBox = `0 0 352 ${contentHeight}`;

  const yellowPathD = `M16.8736 1 L1 27.9279 V ${268.514 + delta} L17.3941 ${
    295 + delta
  } H 336.167 L351 ${269.396 + delta} V 27.4865 L334.346 1 H16.8736 Z`;
  const goldPathD = `M6.2041 ${267.389 + delta} L18.955 ${
    289.465 + delta
  } H 333.825 L345.795 ${
    267.389 + delta
  } V 29.0609 L333.044 6.53467 H 19.2153 L6.2041 29.0609 V ${
    267.389 + delta
  } Z`;
  const bluePathD = `M37.3379 17.1035 H313.922 C322.482 17.1037 329.422 24.0432 329.422 32.6035 V ${
    260.813 + delta
  } C329.422 ${269.374 + delta} 322.482 ${276.313 + delta} 313.922 ${
    276.313 + delta
  } H37.3379 C28.7775 ${276.313 + delta} 21.8379 ${269.374 + delta} 21.8379 ${
    260.813 + delta
  } V32.6035 L21.8428 32.2031 C22.0551 23.8278 28.9113 17.1035 37.3379 17.1035 Z`;

  return (
    <View style={[styles.container, { height: contentHeight }]}>
      <View style={StyleSheet.absoluteFillObject}>
        <Svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          preserveAspectRatio="none"
        >
          {glowDefs}
          <Path
            filter="url(#glow-yellow)"
            d={yellowPathD}
            stroke="#FDEA35"
            strokeWidth="1"
          />
          <Path
            filter="url(#glow-gold)"
            d={goldPathD}
            stroke="#F1AF07"
            strokeWidth="2"
          />
          <Path
            filter="url(#glow-blue)"
            d={bluePathD}
            stroke="#053688"
            strokeWidth="1"
          />
        </Svg>
      </View>
      <View
        style={[
          styles.content,
          { paddingVertical: padding, paddingHorizontal: padding },
        ]}
        onLayout={handleLayout}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
  },
  content: {
    paddingVertical: 45,
    paddingHorizontal: 45,
  },
});

export default ContainerInfoMain;
