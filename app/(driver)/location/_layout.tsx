import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Location" }} />
      <Stack.Screen name="google-map" options={{ title: "Google Map" }} />
    </Stack>
  );
}
