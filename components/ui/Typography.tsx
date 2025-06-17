import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import {
  ACCENT1_LIGHT,
  ACCENT1_DARK,
  ACCENT2_LIGHT,
  ACCENT2_DARK,
  ACCENT3_LIGHT,
  ACCENT3_DARK,
  ALERT,
} from '../../constants/Colors';

// Варианты для Typography
export type TypographyVariant =
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'label1'
  | 'label2'
  | 'label3'
  | 'body1'
  | 'body2'
  | 'caption';

interface TypographyProps extends TextProps {
  variant: TypographyVariant;
  children: React.ReactNode;
  style?: any;
}

const variantStyles = StyleSheet.create({
  h2: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-Bold',
    fontSize: 40,
    fontWeight: '700',
    textShadowColor: ACCENT1_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },
  h3: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-Medium',
    fontSize: 32,
    fontWeight: '500',
    textShadowColor: ACCENT1_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },
  h4: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 25,
    fontWeight: '400',
    textShadowColor: ACCENT1_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },
  h5: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 22,
    fontWeight: '400',
    textShadowColor: ACCENT1_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },
  h6: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-SemiBold',
    fontSize: 20,
    fontWeight: '600',
    textShadowColor: ACCENT1_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },
  label1: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 18,
    fontWeight: '400',
    textShadowColor: ALERT,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },
  label2: {
    color: ACCENT2_LIGHT,
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 18,
    fontWeight: '400',
    textShadowColor: ACCENT2_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },
  label3: {
    color: ACCENT3_LIGHT,
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 18,
    fontWeight: '400',
    textShadowColor: ACCENT3_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0.5,
  },
  body1: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-Light',
    fontSize: 20,
    fontWeight: '300',
  },
  body2: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-Light',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.64,
  },
  caption: {
    color: ACCENT1_LIGHT,
    fontFamily: 'KantumruyPro-Light',
    fontSize: 12,
    fontWeight: '300',
  },
});

const Typography: React.FC<TypographyProps> = ({ variant, children, style, ...props }) => {
  return (
    <Text style={[variantStyles[variant], style]} {...props}>
      {children}
    </Text>
  );
};

export default Typography; 