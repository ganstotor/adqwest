import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Profile" }} />
      <Stack.Screen
        name="settings"
        options={{ headerShown: true, title: "Settings" }}
      />
      <Stack.Screen
        name="payments"
        options={{ headerShown: true, title: "Payments" }}
      />
      <Stack.Screen
        name="rewards"
        options={{ headerShown: true, title: "Rewards" }}
      />
      <Stack.Screen
        name="support"
        options={{ headerShown: true, title: "Support" }}
      />
      <Stack.Screen
        name="location"
        options={{ headerShown: true, title: "Location" }}
      />
      <Stack.Screen
        name="location-google"
        options={{ headerShown: true, title: "Location Google" }}
      />
    </Stack>
  );
}
