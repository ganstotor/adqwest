import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';  // Импортируем User
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

// Функция для получения координат по ZIP коду с использованием Google Geocoding API
const getCoordinatesForZip = async (zipCode: string) => {
  const apiKey = 'AIzaSyAKzJHmT9Mxs2G6voDa-';  // Замените на ваш API ключ Google
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${apiKey}`
  );
  const data = await response.json();
  
  if (data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return { latitude: location.lat, longitude: location.lng };
  }

  return null;
};

type ZipListItem = {
  key: string;
  latitude: number;
  longitude: number;
};

const ZipSelectorScreen = () => {
  const [zipInput, setZipInput] = useState('');
  const [zipCodes, setZipCodes] = useState<ZipListItem[]>([]);
  const [user, setUser] = useState<User | null>(null); // Обновленный тип
  const [region, setRegion] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Используем правильный тип
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users_driver', user.uid);
    const unsubscribe = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.zipCodes)) {
          setZipCodes(data.zipCodes);
        }
      }
    });
    return unsubscribe;
  }, [user]);

  // Получение текущего местоположения
  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    };
    fetchLocation();
  }, []);

  // Добавление нового ZIP кода и его координат
  const addZip = async (zip: string) => {
    if (!zip || zip.length < 3 || zipCodes.some((item) => item.key === zip)) return;

    const coordinates = await getCoordinatesForZip(zip);

    if (coordinates) {
      const newZip = { key: zip, latitude: coordinates.latitude, longitude: coordinates.longitude };
      const updatedZipCodes = [...zipCodes, newZip];
      setZipCodes(updatedZipCodes);

      if (user) {
        const ref = doc(db, 'users_driver', user.uid);
        await setDoc(ref, { zipCodes: updatedZipCodes }, { merge: true });
      }
    } else {
      alert('Не удалось найти координаты для этого ZIP кода.');
    }

    setZipInput('');
  };

  // Удаление ZIP кода
  const removeZip = async (zip: string) => {
    const updatedZipCodes = zipCodes.filter((z) => z.key !== zip);
    setZipCodes(updatedZipCodes);

    if (user) {
      const ref = doc(db, 'users_driver', user.uid);
      await setDoc(ref, { zipCodes: updatedZipCodes }, { merge: true });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter ZIP"
          value={zipInput}
          onChangeText={setZipInput}
          keyboardType="numeric"
        />
        <Button title="Add" onPress={() => addZip(zipInput)} />
      </View>

      <FlatList
        data={zipCodes}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.zipItem}>
            <Text style={styles.zipText}>{item.key}</Text>
            <TouchableOpacity onPress={() => removeZip(item.key)}>
              <Icon name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      {region && (
        <MapView style={styles.map} region={region} showsUserLocation>
          {zipCodes.map((zip) => (
            <Marker
              key={zip.key}
              coordinate={{ latitude: zip.latitude, longitude: zip.longitude }}
              title={`ZIP: ${zip.key}`}
            />
          ))}
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  inputContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    padding: 5,
  },
  zipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  zipText: {
    fontSize: 16,
  },
  map: {
    width: Dimensions.get('window').width,
    height: 300,
  },
});

export default ZipSelectorScreen;
