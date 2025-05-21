import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Available Campaigns" }} />
      <Stack.Screen name="order-bags" options={{ title: "Order Bags" }} />
    </Stack>
  );
}
