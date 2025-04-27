import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Profile" }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
      <Stack.Screen name="payments" options={{ headerShown: true, title: "Payments" }} />
      <Stack.Screen name="rewards" options={{ headerShown: true, title: "Rewards" }} />
    </Stack>
  );
}
