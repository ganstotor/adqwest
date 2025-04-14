import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FontAwesome } from '@expo/vector-icons';

const ProfileScreen = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<{ name: string; avatar?: string; rating: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        router.replace('/');
      } else {
        setUserId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async () => {
    if (!userId) return;
    setLoading(true);
    const ref = doc(db, 'users_driver', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setUserData({
        name: data.name || 'No name',
        avatar: data.avatar,
        rating: data.rating || 0,
      });
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [userId])
  );

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= rating ? 'star' : 'star-o'}
          size={24}
          color="#FFD700"
        />
      );
    }
    return <View style={styles.starRow}>{stars}</View>;
  };

  if (loading || !userData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {userData.avatar ? (
          <Image
            key={userData.avatar} // заставляет пересоздать компонент при обновлении URL
            source={{ uri: userData.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Avatar</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{userData.name}</Text>
      {renderStars(userData.rating)}

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
        style={styles.logOut}
        onPress={() => auth.signOut()}
      >
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
    padding: 20,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#aaa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#777',
    fontSize: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  starRow: {
    flexDirection: 'row',
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
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    marginVertical: 5,
  },
});

export default ProfileScreen;
