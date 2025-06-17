import React from 'react';
import { Text, View } from 'react-native';
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'KantumruyPro-Bold': require('./assets/fonts/KantumruyPro-Bold.ttf'),
    'KantumruyPro-Light': require('./assets/fonts/KantumruyPro-Light.ttf'),
    'KantumruyPro-Medium': require('./assets/fonts/KantumruyPro-Medium.ttf'),
    'KantumruyPro-Regular': require('./assets/fonts/KantumruyPro-Regular.ttf'),
    'KantumruyPro-SemiBold': require('./assets/fonts/KantumruyPro-SemiBold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontFamily: 'KantumruyPro-Bold', fontSize: 40 }}>Bold 40px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-Light', fontSize: 12 }}>Light 12px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-Light', fontSize: 16 }}>Light 16px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-Light', fontSize: 20 }}>Light 20px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-Medium', fontSize: 32 }}>Medium 32px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-Regular', fontSize: 18 }}>Regular 18px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-Regular', fontSize: 22 }}>Regular 22px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-Regular', fontSize: 25 }}>Regular 25px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-SemiBold', fontSize: 20 }}>SemiBold 20px</Text>
      <Text style={{ fontFamily: 'KantumruyPro-SemiBold', fontSize: 45 }}>SemiBold 45px</Text>
    </View>
  );
} 