import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

interface Order {
  district: string;
  company: string;
  bags: number;
}

const orders: Record<string, Order> = {
  "1": { district: "Manhattan", company: "Empire Logistics", bags: 5 },
  "2": { district: "Brooklyn", company: "Brooklyn Express", bags: 8 },
  "3": { district: "Queens", company: "Queens Cargo", bags: 3 },
};

const OrderDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();

  useEffect(() => {
    console.log("Order ID in [id].tsx:", id);
  }, [id]);

  if (!id || !orders[id]) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found!</Text>
      </View>
    );
  }

  const order = orders[id];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{order.company}</Text>
      <Text style={styles.subtitle}>District: {order.district}</Text>
      <Text style={styles.bags}>Bags: {order.bags}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 5,
  },
  bags: {
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 20,
    color: "red",
  },
});

export default OrderDetailScreen;
