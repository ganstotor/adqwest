import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeBlend, G } from 'react-native-svg';

interface ContainerInfoSimpleProps {
  children: React.ReactNode;
  style?: ViewStyle;
  width?: number;
  minHeight?: number;
  padding?: number;
}

const ContainerInfoSimple: React.FC<ContainerInfoSimpleProps> = ({ 
  children, 
  style, 
  width = 370, 
  minHeight = 100,
  padding = 15
}) => {
  return (
    <View style={[{ 
      width, 
      minHeight,
      flexShrink: 0,
    }, style]}>
      <Svg width={width} height="100%" viewBox="0 0 370 100" fill="none" preserveAspectRatio="xMidYMid meet">
        <Defs>
          <Filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
            <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <FeOffset/>
            <FeGaussianBlur stdDeviation="4.5"/>
            <FeColorMatrix type="matrix" values="0 0 0 0 0.157 0 0 0 0 0.725 0 0 0 0 0.937 0 0 0 1 0"/>
            <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
          </Filter>
        </Defs>
        
        <G filter="url(#dropShadow)">
          <Path 
            d="M10 10H360V90H10V10Z" 
            stroke="#053688" 
            strokeWidth="1"
            fill="none"
          />
        </G>
      </Svg>
      
      <View style={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
        padding,
      }}>
        {children}
      </View>
    </View>
  );
};

export default ContainerInfoSimple; 