import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getAuth } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';


const ProfileScreen = () => {
  const router = useRouter();

  getAuth().onAuthStateChanged((user) => {
    if (!user) router.replace('/');
  });

  return (
    <View style={styles.container}>
      {/* Аватар */}
      <Image
        source={{ uri: "https://via.placeholder.com/100" }}
        style={styles.avatar}
      />

      {/* Имя и фамилия */}
      <Text style={styles.name}>John Doe</Text>

      {/* Кнопки */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(driver)/profile/settings")}
      >
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(driver)/profile/rewards")}
      >
        <Text style={styles.buttonText}>Rewards</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(driver)/profile/payments")}
      >
        <Text style={styles.buttonText}>Earnings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(driver)/profile/statistic")}
      >
        <Text style={styles.buttonText}>Statistic</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logOut} onPress={() => auth.signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  logOut: {
    backgroundColor: '#FF9800', // Оранжевая кнопка
    padding: 12,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    marginVertical: 5,
  },
});

export default ProfileScreen;
