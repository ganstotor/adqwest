import React from 'react';
import { View, StyleSheet, Platform, Image, ImageSourcePropType } from 'react-native';

interface AvatarFrameProps {
  children?: React.ReactNode;
  size?: number; // размер внешнего круга
  imageSrc?: ImageSourcePropType;
  imageRatio?: number; // пропорция картинки относительно внутреннего круга
  style?: any;
}

const AvatarFrame: React.FC<AvatarFrameProps> = ({ children, size = 231, imageSrc, imageRatio = 0.8, style }) => {
  // Пропорции исходных кругов
  const outer = size;
  const middle = size * (218 / 231);
  const inner = size * (189 / 231);
  const borderRadiusOuter = outer / 2;
  const borderRadiusMiddle = middle / 2;
  const borderRadiusInner = inner / 2;
  const imageSize = inner * imageRatio;

  return (
    <View style={[{ width: outer, height: outer, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Внешний круг */}
      <View style={{
        width: outer,
        height: outer,
        borderRadius: borderRadiusOuter,
        borderWidth: 1,
        borderColor: '#F1AF07',
        backgroundColor: 'rgba(217, 217, 217, 0.00)',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
          ios: {
            shadowColor: '#FDEA35',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 9 * (size / 231),
          },
          android: {
            elevation: 9 * (size / 231),
          },
        }),
      }}>
        {/* Средний круг */}
        <View style={{
          width: middle,
          height: middle,
          borderRadius: borderRadiusMiddle,
          borderWidth: 2,
          borderColor: '#FDEA35',
          backgroundColor: 'rgba(217, 217, 217, 0.00)',
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: {
              shadowColor: '#FDEA35',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 13.2 * (size / 231),
            },
            android: {
              elevation: 13 * (size / 231),
            },
          }),
        }}>
          {/* Внутренний круг */}
          <View style={{
            width: inner,
            height: inner,
            borderRadius: borderRadiusInner,
            borderWidth: 1,
            borderColor: '#053688',
            backgroundColor: 'rgba(217, 217, 217, 0.00)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            ...Platform.select({
              ios: {
                shadowColor: '#28B9EF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 9 * (size / 231),
              },
              android: {
                elevation: 9 * (size / 231),
              },
            }),
          }}>
            {imageSrc ? (
              <Image
                source={imageSrc}
                style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }}
                resizeMode="contain"
              />
            ) : (
              children
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default AvatarFrame; 