import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My Qwests" }} />
      <Stack.Screen name="missions" options={{ title: "Missions" }} />
      <Stack.Screen name="complete-drop" options={{ title: "Complete Drop" }} />
      <Stack.Screen name="scan-case" options={{ title: "Scan Case" }} />
    </Stack>
  );
}
