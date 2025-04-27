import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";

const ranks = [
  { name: "Recruit", image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745483287099x211019496407986780/Sergeant.png" },
  { name: "Sergeant", image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1744632963112x260922741835636360/chevron.png" },
  { name: "Captain", image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745483312916x330002207663850050/Captain.png" },
  { name: "General", image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745485247401x540054289440982100/general.png" }
];

const ProfileScreen = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<{ name: string; avatar?: string; rank?: string } | null>(null);
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
        rank: data.rank, // предполагаем, что поле rank есть в users_driver
      });
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [userId])
  );

  if (loading || !userData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Найти ранг в массиве
  const userRank = ranks.find(r => r.name === userData.rank);

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {userData.avatar ? (
          <Image
            key={userData.avatar}
            source={{ uri: userData.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Avatar</Text>
          </View>
        )}
      </View>

      {/* Отображение ранга */}
      {userRank && (
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{userRank.name}</Text>
          <Image source={{ uri: userRank.image }} style={styles.rankIcon} />
        </View>
      )}

      {/* Кнопки */}
      <TouchableOpacity style={styles.button} onPress={() => router.push("/(driver)/profile/settings")}>
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/(driver)/profile/rewards")}>
        <Text style={styles.buttonText}>Rewards</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/(driver)/profile/payments")}>
        <Text style={styles.buttonText}>Earnings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logOut} onPress={() => auth.signOut()}>
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
    marginBottom: 10,
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
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rankIcon: {
    width: 24,
    height: 24,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
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
