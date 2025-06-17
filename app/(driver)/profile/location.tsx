import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import Icon from "react-native-vector-icons/Ionicons";
import * as Location from "expo-location";
import {
  haversineDistance,
  getStateFromCoords,
  findNearbyStates,
} from "../../../utils/geo";
import { getBoundingRegion } from "../../../utils/mapUtils";
import Typography from '../../../components/ui/Typography';
import GoldButton from '../../../components/ui/GoldButton';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type {
  Feature,
  Point,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";
import stateAbbrMap from "../../../utils/stateAbbreviations";

MapboxGL.setAccessToken(
  "pk.eyJ1IjoiZ2Fuc3RvdG9yIiwiYSI6ImNtOW55bzY0cDA0YmEycHM0dzl5NGhta3cifQ.3pjHBvYQeyD-ztr2sEYhUA"
);

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
  const [initialLocation, setInitialLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [currentState, setCurrentState] = useState<string | null>(null);
  const [radius, setRadius] = useState<number | null>(null);
  const [newRadius, setNewRadius] = useState<string>("");
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const boundingRegion = useMemo(() => getBoundingRegion(features), [features]);

  const fetchGeoJSON = async (customRadius = radius) => {
    const locationCenter = initialLocation;
    if (!locationCenter || !customRadius) return;

    try {
      setLoading(true);

      const nearbyStates = await findNearbyStates(
        locationCenter,
        customRadius,
        currentState
      );

      const allFeatures: GeoFeature[] = [];

      for (const state of nearbyStates) {
        const abbr = stateAbbrMap[state];
        if (!abbr) continue;

        const url = `https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/${abbr}_${state
          .toLowerCase()
          .replace(/ /g, "_")}_zip_codes_geo.min.json`;

        const res = await fetch(url);
        const geo = await res.json();

        const filtered = geo.features.filter((f: GeoFeature) => {
          const polygons =
            f.geometry.type === "Polygon"
              ? (f.geometry.coordinates as number[][][])
              : (f.geometry.coordinates as number[][][][]).flat();

          return polygons.some((polygon) =>
            polygon.some(
              ([lng, lat]) =>
                haversineDistance(
                  locationCenter.latitude,
                  locationCenter.longitude,
                  lat,
                  lng
                ) <= customRadius
            )
          );
        });

        allFeatures.push(...filtered);
      }

      setFeatures(allFeatures);
    } catch (err) {
      console.error("GeoJSON error:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveRadiusToFirestore = async () => {
    if (user) {
      const num = parseInt(newRadius);
      const parsedRadius = isNaN(num) ? 25 : Math.min(num, 50);
      const ref = doc(db, "users_driver", user.uid);

      setRadius(parsedRadius);
      await setDoc(
        ref,
        {
          milesRadius: parsedRadius,
          zipCodes: [], // Очищаем ZIP-коды при изменении радиуса
        },
        { merge: true }
      );

      fetchGeoJSON(parsedRadius);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users_driver", user.uid);

    const unsubscribe = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      const newLat = data.location?.latitude;
      const newLon = data.location?.longitude;
      if (newLat && newLon) {
        setInitialLocation((prev) => {
          if (prev?.latitude === newLat && prev?.longitude === newLon) {
            return prev;
          }
          return { latitude: newLat, longitude: newLon };
        });

        const region = await getStateFromCoords(newLat, newLon);
        setCurrentState(region || null);
      } else {
        setInitialLocation(null);
      }

      if (Array.isArray(data.zipCodes)) {
        setSavedZips(data.zipCodes);
      }

      if (data.milesRadius) {
        setRadius(data.milesRadius);
        setNewRadius(String(data.milesRadius));
      }

      setUserDataLoaded(true);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setRadius((prev) => prev ?? 25);
      setNewRadius((prev) => prev || "25");
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    if (initialLocation && currentState && userDataLoaded) {
      fetchGeoJSON();
    }
  }, [initialLocation, currentState, userDataLoaded]);

  useEffect(() => {
    if (!loading && features.length > 0 && currentState && user) {
      const abbr = stateAbbrMap[currentState.trim()];
      if (!abbr) return;

      const stateCode = abbr.toUpperCase();
      const allZips = features.map((f) => ({
        key: f.properties.ZCTA5CE10,
        state: stateCode,
      }));

      setSavedZips(allZips);
      updateFirestoreZips(allZips);
    }
  }, [loading, features, currentState, user]);

  useEffect(() => {
    if (initialLocation && radius && currentState) {
      fetchGeoJSON(radius);
    }
  }, [radius, initialLocation, currentState]);

  const updateFirestoreZips = async (updated: ZipListItem[]) => {
    if (!user) return;
    const ref = doc(db, "users_driver", user.uid);
    await setDoc(ref, { zipCodes: updated }, { merge: true });
  };

  const getStateFromZip = async (zip: string): Promise<string | null> => {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.places?.[0]?.state || null;
    } catch {
      return null;
    }
  };

  const handleAddZip = async () => {
    const zip = zipInput.trim();
    if (!zip || zip.length < 3 || savedZips.some((z) => z.key === zip)) return;

    const zipState = await getStateFromZip(zip);
    if (!zipState) return;
    console.log("zipState", zipState);
    const abbr = stateAbbrMap[zipState.trim()];
    if (!abbr) return;

    const updated = [...savedZips, { key: zip, state: abbr.toUpperCase() }];
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
    if (!currentState) return;
    const abbr = stateAbbrMap[currentState.trim()];
    if (!abbr) return;
    const stateCode = abbr.toUpperCase();
    const exists = savedZips.some((z) => z.key === zip);
    const updated = exists
      ? savedZips.filter((z) => z.key !== zip)
      : [...savedZips, { key: zip, state: stateCode }];
    setSavedZips(updated);
    updateFirestoreZips(updated);
  };

  const generateGeoJson = () => ({
    type: "FeatureCollection",
    features: features.map((feature) => ({
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        ZCTA5CE10: feature.properties.ZCTA5CE10,
        selected: savedZips.some((z) => z.key === feature.properties.ZCTA5CE10),
      },
    })),
  });

  const handleMapPress = async (e: any) => {
    if (initialLocation !== null) {
      return;
    }

    const coordinates = e.geometry.coordinates;
    if (!coordinates) {
      return;
    }

    const [longitude, latitude] = coordinates;
    const newLocation = {
      latitude,
      longitude,
    };

    setInitialLocation(newLocation);

    if (user) {
      try {
        const ref = doc(db, "users_driver", user.uid);

        const locationData = {
          location: {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          },
        };

        await setDoc(ref, locationData, { merge: true });

        const region = await getStateFromCoords(
          newLocation.latitude,
          newLocation.longitude
        );

        setCurrentState(region || null);
      } catch (error) {
        Alert.alert("Error", "Failed to save location. Please try again.");
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Svg height="100%" width="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        <Defs>
          <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#02010C" />
            <Stop offset="100%" stopColor="#08061A" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGradient)" />
      </Svg>
      {showPopup && (
        <View style={styles.popup}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ marginRight: 8 }}>Radius (miles):</Text>
            <TextInput
              style={[styles.input, { width: 80 }]}
              value={newRadius}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (isNaN(num)) {
                  setNewRadius(""); // если пусто
                } else if (num <= 50) {
                  setNewRadius(String(num)); // разрешаем только до 50
                } else {
                  setNewRadius("50"); // если больше 50, ставим 50
                }
              }}
              keyboardType="numeric"
            />
            <GoldButton title="Save" onPress={saveRadiusToFirestore} style={{ marginVertical: 12 }} />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter ZIP"
              value={zipInput}
              onChangeText={setZipInput}
              keyboardType="numeric"
            />
            <GoldButton title="Add" onPress={handleAddZip} />
          </View>
          <View style={styles.zipScrollList}>
            <ScrollView
              style={{ maxHeight: "90%", marginTop: 10, marginBottom: 10 }}
              horizontal={false}
              contentContainerStyle={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {savedZips.map((item) => (
                <View key={item.key} style={styles.zipItem}>
                  <Text style={styles.zipText}>{item.key}</Text>
                  <TouchableOpacity onPress={() => handleRemoveZip(item.key)}>
                    <Icon name="close-circle" size={18} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <GoldButton
          title="Clear"
          onPress={async () => {
            setSavedZips([]);
            await updateFirestoreZips([]);
          }}
          style={{ marginVertical: 0, alignSelf: 'flex-start'}}
        />
        <TouchableOpacity
          style={{ marginLeft: 8, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowPopup(!showPopup)}
        >
          <Icon
            name={showPopup ? "close" : "options"}
            size={30}
            color="#FDEA35"
          />
        </TouchableOpacity>
      </View>

      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onPress={handleMapPress}
        onTouchEnd={handleMapPress}
      >
        <MapboxGL.Camera
          centerCoordinate={
            boundingRegion?.center ??
            (initialLocation
              ? [initialLocation.longitude, initialLocation.latitude]
              : currentLocation
              ? [currentLocation.longitude, currentLocation.latitude]
              : [-95.7129, 37.0902])
          }
          zoomLevel={boundingRegion?.zoom ?? 10}
        />

        <MapboxGL.UserLocation />
        {initialLocation && (
          <MapboxGL.PointAnnotation
            id="center-point"
            coordinate={[initialLocation.longitude, initialLocation.latitude]}
          >
            <View
              style={{
                height: 20,
                width: 20,
                backgroundColor: "red",
                borderRadius: 10,
                borderColor: "white",
                borderWidth: 2,
              }}
            />
          </MapboxGL.PointAnnotation>
        )}

        {features.length > 0 && (
          <MapboxGL.ShapeSource
            id="zip-polygons"
            shape={
              generateGeoJson() as FeatureCollection<
                Geometry,
                GeoJsonProperties
              >
            }
            onPress={(e) => {
              const feature = e.features?.[0];
              if (feature && feature.properties?.ZCTA5CE10) {
                const zip = feature.properties.ZCTA5CE10;
                toggleZipFromMap(zip);
              }
            }}
          >
            <MapboxGL.FillLayer
              id="zip-fill"
              style={{
                fillColor: [
                  "case",
                  ["==", ["get", "selected"], true],
                  "rgba(0,200,0,0.4)",
                  "rgba(0,150,255,0.3)",
                ],
                fillOutlineColor: "#000",
              }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  input: { flex: 1, borderBottomWidth: 1, borderColor: "#ccc", padding: 6 },
  zipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  zipText: { marginRight: 6, fontSize: 14 },
  map: { flex: 1, borderRadius: 12 },

  iconButton: {
    right: 20,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 20,
    elevation: 5,
  },
  popup: {
    position: "absolute",
    top: 70,
    height: "90%",
    right: 10,
    left: 10,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    elevation: 5,
    zIndex: 9,
  },

  zipScrollList: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  smallButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
