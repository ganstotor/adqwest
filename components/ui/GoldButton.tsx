import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View, GestureResponderEvent, Platform } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';

const BUTTON_WIDTH = 306;
const BUTTON_HEIGHT = 83;

interface GoldButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: any;
}

const GoldButton: React.FC<GoldButtonProps> = ({ title, onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[{ width: BUTTON_WIDTH, height: BUTTON_HEIGHT }, style]}>
      <View style={styles.outerShadow}>
        <Svg viewBox="0 0 306 83" style={{ width: '100%', height: '100%' }} fill="none">
          <Defs>
            <RadialGradient
              id="paint0_radial_263_246"
              cx={0}
              cy={0}
              r={1}
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(153 41.5) scale(137 25.5)"
            >
              <Stop stopColor="#074B47" />
              <Stop offset={1} stopColor="#00030F" />
            </RadialGradient>
          </Defs>
          {/* Внутренняя заливка и рамка */}
          <G>
            <Path
              d="M25.6508 16L16 27.3066L16.2098 55.934L26.0704 67H280.139L290 55.6934V27.3066L280.139 16H25.6508Z"
              fill="url(#paint0_radial_263_246)"
            />
            <Path
              d="M25.6508 16L16 27.3066L16.2098 55.934L26.0704 67H280.139L290 55.6934V27.3066L280.139 16H25.6508Z"
              stroke="#F1AF07"
              strokeWidth={2}
            />
          </G>
          {/* Внешняя рамка */}
          <G>
            <Path
              d="M24.3795 12L12 26.2782V26.7464V57.1754L24.3795 70.7514H281.411L294 56.9413V25.8101L281.621 12H24.3795Z"
              stroke="#FDEA35"
            />
          </G>
        </Svg>
        <View style={styles.textWrap} pointerEvents="none">
          <Text style={styles.buttonText}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outerShadow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FDEA35',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  textWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  buttonText: {
    color: '#FDEA35',
    textAlign: 'center',
    fontFamily: 'KantumruyPro-Bold',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: 0.5,
    zIndex: 1,
  },
});

export default GoldButton; 