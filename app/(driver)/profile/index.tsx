import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import BurgerMenu from '../../../components/ui/BurgerMenu';
import { auth, db } from "../../../firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebaseConfig";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { GeoPoint } from "firebase/firestore";
import Icon from "react-native-vector-icons/Ionicons";
import { getZipList } from "../../../utils/zipUtils";
import GoldButton from '../../../components/ui/GoldButton';
import Svg, { Defs, LinearGradient, Rect, Stop, RadialGradient } from "react-native-svg";
import CustomInput from '../../../components/ui/CustomInput';
import BlueButton from '../../../components/ui/BlueButton';
import { BACKGROUND1_DARK_MAIN, ACCENT1_LIGHT, ACCENT2_DARK } from '../../../constants/Colors';

type UserData = {
  name: string;
  avatar?: string;
  rank?: string;
  status: string;
  selectedApps?: string[];
  otherAppName?: string;
  screenshots?: string[];
  location?: GeoPoint;
  milesRadius?: number;
};

type DeliveryApp = {
  id: string;
  name: string;
};

const ranks = [
  {
    name: "Recruit",
    image:
      "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745483287099x211019496407986780/Sergeant.png",
  },
  {
    name: "Sergeant",
    image:
      "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1744632963112x260922741835636360/chevron.png",
  },
  {
    name: "Captain",
    image:
      "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745483312916x330002207663850050/Captain.png",
  },
  {
    name: "General",
    image:
      "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745485247401x540054289440982100/general.png",
  },
];

const deliveryApps: DeliveryApp[] = [
  {
    id: "no_delivery",
    name: "I do not currently deliver for other delivery services",
  },
  { id: "uber", name: "Uber Eats" },
  { id: "doordash", name: "DoorDash" },
  { id: "grubhub", name: "GrubHub" },
  { id: "others", name: "Others" },
];

const totalSteps = 3;

const getRegionForRadius = (
  latitude: number,
  longitude: number,
  radiusInMiles: number
) => {
  const radiusInDegrees = radiusInMiles / 69; // approximate miles per degree
  return {
    latitude,
    longitude,
    latitudeDelta: radiusInDegrees * 2.5, // multiply by 2.5 to add some padding
    longitudeDelta: radiusInDegrees * 2.5,
  };
};

const ProgressBar = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <View
            style={[
              styles.progressStep,
              index + 1 === currentStep && styles.progressStepActive,
              index + 1 < currentStep && styles.progressStepCompleted,
            ]}
          >
            <Text style={styles.progressText}>{index + 1}</Text>
          </View>
          {index < totalSteps - 1 && (
            <View
              style={[
                styles.progressLine,
                index + 1 < currentStep && styles.progressLineActive,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const ProfileScreen = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [otherAppName, setOtherAppName] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [savedLocation, setSavedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [radius, setRadius] = useState<string>("");
  const [initialRegion, setInitialRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [canCloseModal, setCanCloseModal] = useState(false);
  const [mapRef, setMapRef] = useState<MapView | null>(null);

  useEffect(() => {
    if (userData?.status === "pending") {
      setShowVerificationModal(true);
    } else {
      setShowVerificationModal(false);
    }
  }, [userData]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        router.replace("/");
      } else {
        setUserId(user.uid);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const unsubscribeSnapshot = onSnapshot(
      doc(db, "users_driver", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            name: data.name || "No name",
            avatar: data.avatar,
            rank: data.rank,
            status: data.status,
            selectedApps: data.selectedApps || [],
            otherAppName: data.otherAppName || "",
            screenshots: data.screenshots || [],
            location: data.location,
            milesRadius: data.milesRadius,
          });
          setSelectedApps(data.selectedApps || []);
          setOtherAppName(data.otherAppName || "");
          setScreenshots(data.screenshots || []);
          if (data.location) {
            const locationData = {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
            };
            setSavedLocation(locationData);
            setLocation(locationData);
          } else {
            setSavedLocation(null);
          }
          if (data.milesRadius) {
            setRadius(String(data.milesRadius));
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, [userId]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert(
          "Sorry, we need location permissions to get your current location!"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      setInitialRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      if (!userData?.location) {
        setLocation({ latitude, longitude });
      }
    })();
  }, []);

  useEffect(() => {
    if (
      selectedApps.length > 0 &&
      savedLocation &&
      radius &&
      screenshots.length > 0
    ) {
      setCanCloseModal(true);
    } else {
      setCanCloseModal(false);
    }
  }, [selectedApps, savedLocation, radius, screenshots]);

  useEffect(() => {
    if (mapRef && savedLocation && radius) {
      const radiusInMiles = parseFloat(radius);
      if (!isNaN(radiusInMiles)) {
        const region = getRegionForRadius(
          savedLocation.latitude,
          savedLocation.longitude,
          radiusInMiles
        );
        mapRef.animateToRegion(region, 1000);
      }
    }
  }, [savedLocation, radius]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to upload screenshots!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const filename = `screenshots/${userId}/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        const newScreenshots = [...screenshots, downloadURL];
        setScreenshots(newScreenshots);

        if (userId) {
          await updateDoc(doc(db, "users_driver", userId), {
            screenshots: newScreenshots,
          });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image");
      }
      setUploading(false);
    }
  };

  const toggleApp = async (appId: string) => {
    const newSelectedApps = selectedApps.includes(appId)
      ? selectedApps.filter((id) => id !== appId)
      : [...selectedApps, appId];

    setSelectedApps(newSelectedApps);

    if (!newSelectedApps.includes("others")) {
      setOtherAppName("");
    }

    if (userId) {
      await updateDoc(doc(db, "users_driver", userId), {
        selectedApps: newSelectedApps,
        ...(newSelectedApps.includes("others")
          ? { otherAppName }
          : { otherAppName: "" }),
      });
    }
  };

  const handleVerificationSubmit = async () => {
    if (userId && location) {
      const zipCodes = await getZipList(location, parseInt(radius));

      await updateDoc(doc(db, "users_driver", userId), {
        location: new GeoPoint(location.latitude, location.longitude),
        milesRadius: parseInt(radius),
        zipCodes: zipCodes,
      });

      setShowVerificationModal(false);
    }
  };

  const handleLocationSelect = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });

    if (userId) {
      const geoPoint = new GeoPoint(latitude, longitude);
      updateDoc(doc(db, "users_driver", userId), {
        location: geoPoint,
      }).then(() => {
        setSavedLocation({ latitude, longitude });
      });
    }
  };

  const handleRadiusChange = (text: string) => {
    const num = parseInt(text);
    if (isNaN(num)) {
      setRadius("");
    } else if (num <= 50) {
      setRadius(String(num));
      if (userId) {
        updateDoc(doc(db, "users_driver", userId), {
          milesRadius: num,
        });
      }
    } else {
      setRadius("50");
      if (userId) {
        updateDoc(doc(db, "users_driver", userId), {
          milesRadius: 50,
        });
      }
    }
  };

  const handleNavigation = (route: string) => {
    switch (route) {
      case 'home':
        router.push('/(driver)/home');
        break;
      case 'my-qwests':
        router.push('/(driver)/my-qwests');
        break;
      case 'profile':
        router.push('/(driver)/profile');
        break;
      case 'rewards':
        router.push('/(driver)/profile/rewards');
        break;
      case 'logout':
        // Обработка выхода
        router.replace('/');
        break;
      default:
        break;
    }
  };

  if (loading || !userData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  const userRank = ranks.find((r) => r.name === userData.rank);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: -1 }}>
        {/* Градиентный фон Background1-dark */}
        <Svg height="100%" width="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Defs>
            <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#02010C" />
              <Stop offset="100%" stopColor="#08061A" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGradient)" />
        </Svg>
      </View>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        {showVerificationModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Verification - Step {verificationStep}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowVerificationModal(false)}
                >
                  <Icon name="close" size={24} color={ACCENT2_DARK} />
                </TouchableOpacity>
              </View>

              <ProgressBar
                currentStep={verificationStep}
                totalSteps={totalSteps}
              />

              {verificationStep === 1 && (
                <>
                  <Text style={styles.questionText}>
                    Select delivery apps you use:
                  </Text>
                  <View style={styles.appsContainer}>
                    {deliveryApps.map((app) => {
                      const isSelected = selectedApps.includes(app.id);
                      return (
                        <TouchableOpacity
                          key={app.id}
                          style={{
                            borderWidth: 2,
                            borderColor: ACCENT2_DARK,
                            borderRadius: 12,
                            margin: 6,
                            minWidth: 120,
                            backgroundColor: 'transparent',
                            overflow: 'hidden',
                          }}
                          onPress={() => toggleApp(app.id)}
                        >
                          {isSelected && (
                            <Svg
                              width="100%"
                              height="100%"
                              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                              viewBox="0 0 120 48"
                              fill="none"
                            >
                              <Defs>
                                <RadialGradient
                                  id={`app-gradient-${app.id}`}
                                  cx="0.5"
                                  cy="0.5"
                                  r="0.5"
                                  gradientUnits="objectBoundingBox"
                                >
                                  <Stop offset="0" stopColor="#106D68" />
                                  <Stop offset="1" stopColor="#00030F" />
                                </RadialGradient>
                              </Defs>
                              <Rect
                                x="0"
                                y="0"
                                width="120"
                                height="48"
                                rx="12"
                                fill={`url(#app-gradient-${app.id})`}
                              />
                            </Svg>
                          )}
                          <Text
                            style={{
                              color: ACCENT1_LIGHT,
                              fontWeight: isSelected ? 'bold' : 'normal',
                              fontSize: 16,
                              textAlign: 'center',
                              padding: 12,
                              zIndex: 1,
                            }}
                          >
                            {app.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedApps.includes("others") && (
                    <CustomInput
                      label="Other delivery app name"
                      placeholder="Enter other delivery app name"
                      value={otherAppName}
                      onChangeText={(text) => {
                        setOtherAppName(text);
                        if (userId) {
                          updateDoc(doc(db, "users_driver", userId), {
                            otherAppName: text,
                          });
                        }
                      }}
                      containerStyle={{ marginBottom: 4 }}
                    />
                  )}
                  <View style={{ alignItems: 'center', marginTop: 10 }}>
                    <GoldButton
                      title="Next"
                      onPress={
                        selectedApps.length === 0 ||
                        (selectedApps.includes("others") && !otherAppName) ||
                        selectedApps.includes("no_delivery")
                          ? () => {}
                          : () => setVerificationStep(2)
                      }
                      width={150}
                      height={50}
                      style={{
                        opacity:
                          selectedApps.length === 0 ||
                          (selectedApps.includes("others") && !otherAppName) ||
                          selectedApps.includes("no_delivery")
                            ? 0.5
                            : 1,
                      }}
                    />
                  </View>
                </>
              )}

              {verificationStep === 2 && (
                <>
                  <Text style={styles.questionText}>
                    Select your location and radius:
                  </Text>
                  <View style={styles.radiusContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ color: ACCENT1_LIGHT, fontSize: 16, marginRight: 10, minWidth: 120 }}>
                        Delivery Radius:
                      </Text>
                      <CustomInput
                        label=""
                        value={radius}
                        onChangeText={handleRadiusChange}
                        keyboardType="numeric"
                        placeholder="Enter address"
                        containerStyle={{ marginBottom: 0, width: 120 }}
                      />
                    </View>
                  </View>
                  <View style={styles.mapContainer}>
                    <MapView
                      ref={(ref) => setMapRef(ref)}
                      provider={PROVIDER_GOOGLE}
                      style={styles.map}
                      initialRegion={
                        initialRegion || {
                          latitude: 37.78825,
                          longitude: -122.4324,
                          latitudeDelta: 0.0922,
                          longitudeDelta: 0.0421,
                        }
                      }
                      onPress={handleLocationSelect}
                      showsUserLocation={true}
                    >
                      {savedLocation && (
                        <>
                          <Marker
                            coordinate={{
                              latitude: savedLocation.latitude,
                              longitude: savedLocation.longitude,
                            }}
                            pinColor="red"
                          />
                          <Circle
                            center={{
                              latitude: savedLocation.latitude,
                              longitude: savedLocation.longitude,
                            }}
                            radius={parseFloat(radius || "0") * 1609.34}
                            strokeWidth={2}
                            strokeColor="rgba(0, 122, 255, 1)"
                            fillColor="rgba(0, 122, 255, 0.2)"
                          />
                        </>
                      )}
                    </MapView>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 10 }}>
                    <BlueButton
                      title="Back"
                      onPress={() => setVerificationStep(1)}
                      width={150}
                      height={50}
                      style={{ marginRight: 10 }}
                    />
                    <GoldButton
                      title="Next"
                      onPress={!savedLocation || !radius ? () => {} : () => setVerificationStep(3)}
                      width={150}
                      height={50}
                      style={{ opacity: !savedLocation || !radius ? 0.5 : 1 }}
                    />
                  </View>
                </>
              )}

              {verificationStep === 3 && (
                <>
                  <Text style={styles.questionText}>Upload screenshots:</Text>
                  <Text style={styles.termsText}>
                    The screenshot must show your name matching your account and
                    delivery statistics for the last 30 days
                  </Text>
                  <ScrollView style={styles.screenshotsContainer}>
                    {screenshots.map((url, index) => (
                      <View key={index} style={styles.screenshotContainer}>
                        <Image source={{ uri: url }} style={styles.screenshot} />
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => {
                            const newScreenshots = screenshots.filter(
                              (_, i) => i !== index
                            );
                            setScreenshots(newScreenshots);
                            if (userId) {
                              updateDoc(doc(db, "users_driver", userId), {
                                screenshots: newScreenshots,
                              });
                            }
                          }}
                        >
                          <Text style={styles.deleteButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={pickImage}
                      disabled={uploading}
                    >
                      <Text style={styles.uploadButtonText}>
                        {uploading ? "Uploading..." : "+ Add Screenshot"}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                  <View style={styles.buttonRow}>
                    <BlueButton
                      title="Back"
                      onPress={() => setVerificationStep(2)}
                      width={150}
                      height={50}
                      style={{ marginRight: 10 }}
                    />
                    <GoldButton
                      title="Submit"
                      onPress={screenshots.length === 0 ? () => {} : handleVerificationSubmit}
                      width={150}
                      height={50}
                      style={{ opacity: screenshots.length === 0 ? 0.5 : 1 }}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        )}
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

        {userRank && (
          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>{userRank.name}</Text>
            <Image source={{ uri: userRank.image }} style={styles.rankIcon} />
          </View>
        )}

        {userData.status === "pending" && (
          <GoldButton
            title="Verification Status: Pending"
            onPress={() => setShowVerificationModal(true)}
            style={{ marginBottom: 8 }}
          />
        )}

        <GoldButton
          title="Settings"
          onPress={() => router.push("/(driver)/profile/settings")}
          style={{ marginVertical: -4 }}
        />
        <GoldButton
          title="Rewards"
          onPress={() => router.push("/(driver)/profile/rewards")}
          style={{ marginVertical: -4 }}
        />
        <GoldButton
          title="Earnings"
          onPress={() => router.push("/(driver)/profile/payments")}
          style={{ marginVertical: -4 }}
        />
        <GoldButton
          title="Support"
          onPress={() => router.push("/(driver)/profile/support")}
          style={{ marginVertical: -4 }}
        />
        <GoldButton
          title="Location"
          onPress={() => router.push("/(driver)/profile/location")}
          style={{ marginVertical: -4 }}
        />
        <GoldButton
          title="Location Google"
          onPress={() => router.push("/(driver)/profile/location-google")}
          style={{ marginVertical: -4 }}
        />
        <GoldButton
          title="Log out"
          onPress={() => auth.signOut()}
          style={{ marginVertical: -4 }}
        />
      </View>
      
      {/* BurgerMenu внизу */}
      <BurgerMenu onNavigate={handleNavigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#aaa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#777",
    fontSize: 14,
  },
  rankContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  rankIcon: {
    width: 24,
    height: 24,
  },
  rankText: {
    fontSize: 18,
    fontWeight: "bold",
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
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
    marginVertical: 5,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: BACKGROUND1_DARK_MAIN,
    padding: 10,
    borderRadius: 10,
    width: "90%",
    maxHeight: "90%",
    borderWidth: 2,
    borderColor: ACCENT2_DARK,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    position: "relative",
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: ACCENT1_LIGHT,
  },
  closeButton: {
    position: "absolute",
    right: 0,
    padding: 5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: ACCENT1_LIGHT,
  },
  appsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginBottom: 10,
  },
  appButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007bff",
    backgroundColor: "white",
    minWidth: 120,
  },
  appButtonSelected: {
    backgroundColor: "#007bff",
  },
  appButtonText: {
    color: "#007bff",
    fontSize: 16,
    textAlign: "center",
  },
  appButtonTextSelected: {
    color: "white",
  },
  modalButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonDisabled: {
    backgroundColor: "#ccc",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  mapContainer: {
    height: 300,
    marginVertical: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  radiusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginLeft: 10,
    width: 100,
  },
  screenshotsContainer: {
    flexGrow: 0,
    height: 300,
  },
  screenshot: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: "#007bff",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "#007bff",
    fontSize: 16,
  },
  verificationButton: {
    backgroundColor: "#ffc107",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    width: "80%",
  },
  verificationButtonText: {
    color: "#000",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    padding: 10,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  progressStepActive: {
    backgroundColor: "#007bff",
  },
  progressStepCompleted: {
    backgroundColor: "#28a745",
  },
  progressLine: {
    height: 2,
    backgroundColor: "#ccc",
    flex: 1,
    alignSelf: "center",
    marginHorizontal: 5,
  },
  progressLineActive: {
    backgroundColor: "#007bff",
  },
  progressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  deleteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  screenshotContainer: {
    position: "relative",
    marginBottom: 10,
  },
  otherAppInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    width: "100%",
  },
  termsContainer: {
    marginVertical: 20,
  },
  termsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#007bff",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007bff",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  errorText: {
    color: ACCENT1_LIGHT,
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
});

export default ProfileScreen;
