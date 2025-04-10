import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Campaigns" }} />
      <Stack.Screen name="scan-case" options={{ title: "Scan Case" }} />
      <Stack.Screen name="order-bags" options={{ title: "Order Bags" }} />
      <Stack.Screen name="missions" options={{ title: "Missions" }} />
      <Stack.Screen name="complete-drop" options={{ title: "Complete Drop" }} />
    </Stack>
  );
}
