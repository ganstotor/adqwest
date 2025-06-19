import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View, GestureResponderEvent, Platform } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';

interface GreenButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: any;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 328;
const DEFAULT_HEIGHT = 87;

const GreenButton: React.FC<GreenButtonProps> = ({ title, onPress, style, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT }) => {
  const scaleW = width / DEFAULT_WIDTH;
  const scaleH = height / DEFAULT_HEIGHT;
  const fontSize = 24 * scaleH;
  const lineHeight = 30 * scaleH;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[{ width, height }, style]}>
      <View style={styles.outerShadow(scaleW, scaleH)}>
        <Svg viewBox={`0 0 ${DEFAULT_WIDTH} ${DEFAULT_HEIGHT}`} style={{ width: '100%', height: '100%' }} fill="none">
          <Defs>
            <RadialGradient
              id="paint0_radial_195_280"
              cx={0}
              cy={0}
              r={1}
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(164.478 43.8257) scale(147.698 26.4468)"
            >
              <Stop stopColor="#0C7873" />
              <Stop offset={1} stopColor="#00030F" />
            </RadialGradient>
          </Defs>
          {/* Внутренняя заливка и рамка */}
          <Path
            d="M27.1847 17.3789L16.7803 29.1053L17.0065 58.7956L27.6371 70.2725H301.546L312.177 58.5461V29.1053L301.546 17.3789H27.1847Z"
            fill="url(#paint0_radial_195_280)"
            stroke="#4C8B00"
            strokeWidth={2}
          />
          {/* Внешняя рамка */}
          <Path
            d="M25.3452 12L12 27.2512V27.7513V60.2539L25.3452 74.7551H302.429L316 60.0039V26.7512L302.655 12H25.3452Z"
            stroke="#77DD00"
          />
        </Svg>
        <View style={[styles.textWrap(width, height)]} pointerEvents="none">
          <Text style={[styles.buttonText, { fontSize, lineHeight }]}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  outerShadow: (scaleW: number, scaleH: number) => ({
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#77DD00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10 * scaleH,
      },
      android: {
        elevation: 8 * scaleH,
      },
    }),
  }),
  textWrap: (width: number, height: number) => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width,
    height,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 1,
    pointerEvents: 'none' as const,
  }),
  buttonText: {
    color: '#77DD00',
    textAlign: 'center' as const,
    fontFamily: 'KantumruyPro-Bold',
    fontStyle: 'normal' as const,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    zIndex: 1,
  },
};

export default GreenButton; 