import {
  DarkTheme,
  DefaultTheme,
  Link,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

// Предотвращаем скрытие SplashScreen до загрузки ассетов
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  let user = false; // Симуляция авторизации

  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isAppReady, setIsAppReady] = useState(false);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().then(() => setIsAppReady(true));
    }
  }, [loaded]);

  useEffect(() => {
    if (isAppReady) {
      if (user) {
        router.replace("/(driver)/home"); // Если залогинен, переходим на (tabs)
      } else {
        router.replace("/"); // Иначе — на регистрацию
      }
    }
  }, [isAppReady]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, headerTitle: "" }}/>
        <Stack.Screen name="signup" options={{ headerTitle: "" }} />
        <Stack.Screen name="login" options={{ headerTitle: "" }} />
        <Stack.Screen name="(driver)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
