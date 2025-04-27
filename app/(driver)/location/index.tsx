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
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import Icon from "react-native-vector-icons/Ionicons";
import * as Location from "expo-location";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

MapboxGL.setAccessToken(
  "pk.eyJ1IjoiZ2Fuc3RvdG9yIiwiYSI6ImNtOW55bzY0cDA0YmEycHM0dzl5NGhta3cifQ.3pjHBvYQeyD-ztr2sEYhUA"
);

const stateAbbrMap: Record<string, string> = {
  Alabama: "al",
  Alaska: "ak",
  Arizona: "az",
  Arkansas: "ar",
  California: "ca",
  Colorado: "co",
  Connecticut: "ct",
  Delaware: "de",
  Florida: "fl",
  Georgia: "ga",
  Hawaii: "hi",
  Idaho: "id",
  Illinois: "il",
  Indiana: "in",
  Iowa: "ia",
  Kansas: "ks",
  Kentucky: "ky",
  Louisiana: "la",
  Maine: "me",
  Maryland: "md",
  Massachusetts: "ma",
  Michigan: "mi",
  Minnesota: "mn",
  Mississippi: "ms",
  Missouri: "mo",
  Montana: "mt",
  Nebraska: "ne",
  Nevada: "nv",
  "New Hampshire": "nh",
  "New Jersey": "nj",
  "New Mexico": "nm",
  "New York": "ny",
  "North Carolina": "nc",
  "North Dakota": "nd",
  Ohio: "oh",
  Oklahoma: "ok",
  Oregon: "or",
  Pennsylvania: "pa",
  "Rhode Island": "ri",
  "South Carolina": "sc",
  "South Dakota": "sd",
  Tennessee: "tn",
  Texas: "tx",
  Utah: "ut",
  Vermont: "vt",
  Virginia: "va",
  Washington: "wa",
  "West Virginia": "wv",
  Wisconsin: "wi",
  Wyoming: "wy",
};
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
  const R = 3958.8; // Радиус Земли в милях
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

const getStateFromCoords = async (latitude: number, longitude: number) => {
  const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
  return geocode.length > 0 ? geocode[0].region : null;
};

const findNearbyStates = async (
  center: { latitude: number; longitude: number },
  radius: number,
  currentState: string | null
) => {
  const directions = [
    { latOffset: radius / 69, lonOffset: 0 }, // север
    { latOffset: -radius / 69, lonOffset: 0 }, // юг
    {
      latOffset: 0,
      lonOffset: radius / (Math.cos((center.latitude * Math.PI) / 180) * 69),
    }, // восток
    {
      latOffset: 0,
      lonOffset: -radius / (Math.cos((center.latitude * Math.PI) / 180) * 69),
    }, // запад
    {
      latOffset: radius / 69 / Math.sqrt(2),
      lonOffset:
        radius /
        (Math.cos((center.latitude * Math.PI) / 180) * 69) /
        Math.sqrt(2),
    }, // северо-восток
    {
      latOffset: radius / 69 / Math.sqrt(2),
      lonOffset:
        -radius /
        (Math.cos((center.latitude * Math.PI) / 180) * 69) /
        Math.sqrt(2),
    }, // северо-запад
    {
      latOffset: -radius / 69 / Math.sqrt(2),
      lonOffset:
        radius /
        (Math.cos((center.latitude * Math.PI) / 180) * 69) /
        Math.sqrt(2),
    }, // юго-восток
    {
      latOffset: -radius / 69 / Math.sqrt(2),
      lonOffset:
        -radius /
        (Math.cos((center.latitude * Math.PI) / 180) * 69) /
        Math.sqrt(2),
    }, // юго-запад
  ];

  const states = new Set<string>();

  for (const dir of directions) {
    const lat = center.latitude + dir.latOffset;
    const lon = center.longitude + dir.lonOffset;
    const region = await getStateFromCoords(lat, lon);
    if (region) states.add(region);
  }

  if (currentState) {
    states.add(currentState); // Обязательно добавляем текущий штат
  }

  return Array.from(states);
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
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [radius, setRadius] = useState<number | null>(null);
  const [newRadius, setNewRadius] = useState<string>("");
  const [showPopup, setShowPopup] = useState(false);

  const getBoundingRegion = () => {
    if (features.length === 0) return null;

    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180;

    features.forEach((feature) => {
      const polygons =
        feature.geometry.type === "Polygon"
          ? (feature.geometry.coordinates as number[][][])
          : (feature.geometry.coordinates as number[][][][]).flat();

      polygons.forEach((polygon) => {
        polygon.forEach(([lng, lat]) => {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      });
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom = 8;

    if (maxDiff < 0.01) zoom = 15;
    else if (maxDiff < 0.05) zoom = 13;
    else if (maxDiff < 0.1) zoom = 11;
    else if (maxDiff < 0.5) zoom = 10;
    else if (maxDiff < 1) zoom = 8;
    else if (maxDiff < 5) zoom = 6;
    else zoom = 4;

    return {
      center: [centerLng, centerLat],
      zoom,
    };
  };

  const boundingRegion = useMemo(() => getBoundingRegion(), [features]);

  const fetchGeoJSON = async (customRadius = radius) => {
    if (!currentLocation || customRadius == null) return;
    try {
      setLoading(true);

      const nearbyStates = await findNearbyStates(
        currentLocation,
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
                  currentLocation.latitude,
                  currentLocation.longitude,
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
      const ref = doc(db, "users_driver", user.uid);
      await setDoc(ref, { milesRadius: Number(newRadius) }, { merge: true });
      setRadius(Number(newRadius)); // чтобы обновить radius в стейте
      fetchGeoJSON(Number(newRadius)); // перезагрузить зоны на карте с новым радиусом
    }
  };

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
        if (data.milesRadius) {
          setRadius(data.milesRadius);
          setNewRadius(String(data.milesRadius));
        }
      }
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      const region = await getStateFromCoords(
        location.coords.latitude,
        location.coords.longitude
      );
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setCurrentState(region);
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    if (currentLocation && currentState && radius != null) {
      fetchGeoJSON();
    }
  }, [currentLocation, currentState, radius]);

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

  return (
    <View style={styles.container}>
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
            <TouchableOpacity
              style={{
                backgroundColor: "#007BFF",
                padding: 8,
                marginLeft: 10,
                borderRadius: 5,
              }}
              onPress={saveRadiusToFirestore}
            >
              <Text style={{ color: "white" }}>Apply</Text>
            </TouchableOpacity>
          </View>
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
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => {
            if (!currentState) return;

            const abbr = stateAbbrMap[currentState.trim()];
            if (!abbr) return;

            const stateCode = abbr.toUpperCase();
            const allZips = features.map((f) => f.properties.ZCTA5CE10);
            const uniqueZips = Array.from(
              new Set([...savedZips.map((z) => z.key), ...allZips])
            );

            const updated = uniqueZips.map((zip) => ({
              key: zip,
              state: stateCode,
            }));

            setSavedZips(updated);
            updateFirestoreZips(updated);
          }}
        >
          <Text style={styles.smallButtonText}>Select All ZIPs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => {
            setSavedZips([]);
            updateFirestoreZips([]);
          }}
        >
          <Text style={styles.smallButtonText}>Deselect All ZIPs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowPopup(!showPopup)}
        >
          <Icon
            name={showPopup ? "close" : "options"}
            size={30}
            color="#007BFF"
          />
        </TouchableOpacity>
      </View>
      {loading || !currentLocation || radius == null ? (
        <ActivityIndicator size="large" />
      ) : (
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
        >
          <MapboxGL.Camera
            centerCoordinate={
              boundingRegion?.center ?? [
                currentLocation.longitude,
                currentLocation.latitude,
              ]
            }
            zoomLevel={boundingRegion?.zoom ?? 10}
          />

          <MapboxGL.UserLocation />
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
        </MapboxGL.MapView>
      )}
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
