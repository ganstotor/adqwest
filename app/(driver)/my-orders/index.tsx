import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface Order {
  id: number;
  district: string;
  company: string;
  bags: number;
}

const orders: Order[] = [
  { id: 1, district: "Manhattan", company: "Empire Logistics", bags: 5 },
  { id: 2, district: "Brooklyn", company: "Brooklyn Express", bags: 8 },
  { id: 3, district: "Queens", company: "Queens Cargo", bags: 3 },
];

const OrdersScreen: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {orders.map((order) => (
        <TouchableOpacity
          key={order.id}
          style={styles.orderContainer}
          onPress={() => {
            const path = `my-orders/${order.id}`; // Убираем as const
            console.log("Navigating to:", path );
            router.push(`/my-orders/${order.id}`);
            //router.push(path); // Переход по маршруту
          }}
        >
          <Text style={styles.district}>{order.district}</Text>
          <Text style={styles.company}>{order.company}</Text>
          <Text style={styles.bags}>Bags: {order.bags}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  orderContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  district: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  company: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  bags: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OrdersScreen;
