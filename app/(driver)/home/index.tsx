import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

const districts = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const companies = [
  "Empire Logistics",
  "Brooklyn Express",
  "Queens Cargo",
  "Bronx Movers",
  "Island Deliveries",
];

const generateRandomOrders = () => {
  return districts.map((district, index) => ({
    id: index.toString(),
    district,
    company: companies[Math.floor(Math.random() * companies.length)],
    bags: Math.floor(Math.random() * 10) + 1,
  }));
};

const orders = generateRandomOrders();

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>New Campains</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.district}>{item.district}</Text>
            <Text style={styles.company}>{item.company}</Text>
            <Text style={styles.bags}>Bags: {item.bags}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    top: 30,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
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

export default HomeScreen;
