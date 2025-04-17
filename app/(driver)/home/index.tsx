import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import MapView, { Polygon, Marker } from "react-native-maps";
import Icon from "react-native-vector-icons/Ionicons";
import * as Location from "expo-location";

type GeoFeature = {
  type: string;
  properties: {
    ZCTA5CE10: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
};

type ZipListItem = {
  key: string;
  state: string;
};

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function ZipMapScreen() {
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [savedZips, setSavedZips] = useState<ZipListItem[]>([]);
  const [zipInput, setZipInput] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const radius = 10;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users_driver", user.uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.zipCodes)) {
          setSavedZips(data.zipCodes);
        }
      }
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/oh_ohio_zip_codes_geo.min.json"
        );
        const geo = await res.json();

        if (!currentLocation) return;

        const filtered = geo.features.filter((f: GeoFeature) => {
          const { geometry } = f;
          let polygons =
            geometry.type === "Polygon"
              ? (geometry.coordinates as number[][][])
              : (geometry.coordinates as number[][][][]).flat();

          return polygons.some((polygon) =>
            polygon.some(([lng, lat]) => {
              const dist = haversineDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                lat,
                lng
              );
              return dist <= radius;
            })
          );
        });

        setFeatures(filtered);
      } catch (err) {
        console.error("GeoJSON error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentLocation) {
      fetchGeoJSON();
    }
  }, [currentLocation]);

  const updateFirestoreZips = async (updated: ZipListItem[]) => {
    if (user) {
      const ref = doc(db, "users_driver", user.uid);
      await setDoc(ref, { zipCodes: updated }, { merge: true });
    }
  };

  const handleAddZip = async () => {
    const zip = zipInput.trim();
    if (!zip || zip.length < 3 || savedZips.some((z) => z.key === zip)) return;
    const updated = [...savedZips, { key: zip, state: "OH" }];
    setSavedZips(updated);
    setZipInput("");
    updateFirestoreZips(updated);
  };

  const handleRemoveZip = async (zip: string) => {
    const updated = savedZips.filter((z) => z.key !== zip);
    setSavedZips(updated);
    updateFirestoreZips(updated);
  };

  const toggleZipFromMap = async (zip: string) => {
    const exists = savedZips.some((z) => z.key === zip);
    const updated = exists
      ? savedZips.filter((z) => z.key !== zip)
      : [...savedZips, { key: zip, state: "OH" }];
    setSavedZips(updated);
    updateFirestoreZips(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter ZIP"
          value={zipInput}
          onChangeText={setZipInput}
          keyboardType="numeric"
        />
        <Button title="Add" onPress={handleAddZip} />
      </View>

      <View style={styles.zipList}>
        {savedZips.map((item) => (
          <View key={item.key} style={styles.zipItem}>
            <Text style={styles.zipText}>{item.key}</Text>
            <TouchableOpacity onPress={() => handleRemoveZip(item.key)}>
              <Icon name="close-circle" size={18} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {loading || !currentLocation ? (
        <ActivityIndicator size="large" />
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2,
          }}
          showsUserLocation={true} // Отображает стандартный синий маркер
        >
          {features.map((feature) => {
            const { geometry, properties } = feature;
            const zipCode = properties.ZCTA5CE10;
            const isSelected = savedZips.some((z) => z.key === zipCode);
            let polygons =
              geometry.type === "Polygon"
                ? (geometry.coordinates as number[][][])
                : (geometry.coordinates as number[][][][]).flat();

            return polygons.map((polygon, i) => {
              const coords = polygon.map(([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
              }));

              return (
                <Polygon
                  key={`${zipCode}-${i}`}
                  coordinates={coords}
                  strokeColor="#000"
                  fillColor={
                    isSelected ? "rgba(0,200,0,0.4)" : "rgba(0,150,255,0.3)"
                  }
                  strokeWidth={1}
                  tappable
                  onPress={() => toggleZipFromMap(zipCode)}
                />
              );
            });
          })}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 6,
  },
  zipList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  zipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  zipText: {
    marginRight: 6,
    fontSize: 14,
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
});
