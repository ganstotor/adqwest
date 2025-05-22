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
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../../firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebaseConfig";

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

const deliveryApps = [
  { id: 'uber', name: 'Uber Eats' },
  { id: 'doordash', name: 'DoorDash' },
  { id: 'grubhub', name: 'GrubHub' },
  { id: 'others', name: 'Others' },
];

const ProfileScreen = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<{
    name: string;
    avatar?: string;
    rank?: string;
    status: string;
    selectedApps?: string[];
    screenshots?: string[];
    activationPopupShown?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);

  useEffect(() => {
    if (userData?.status !== "active") {
      setShowActivationModal(true);
    } else {
      setShowActivationModal(false);
    }

    if (userData?.activationPopupShown) {
      setShowLocationPopup(true);
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
            screenshots: data.screenshots || [],
            activationPopupShown: data.activationPopupShown,
          });
          setSelectedApps(data.selectedApps || []);
          setScreenshots(data.screenshots || []);
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload screenshots!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
            screenshots: newScreenshots
          });
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      }
      setUploading(false);
    }
  };

  const toggleApp = async (appId: string) => {
    const newSelectedApps = selectedApps.includes(appId)
      ? selectedApps.filter(id => id !== appId)
      : [...selectedApps, appId];
    
    setSelectedApps(newSelectedApps);
    
    if (userId) {
      await updateDoc(doc(db, "users_driver", userId), {
        selectedApps: newSelectedApps
      });
    }
  };

  const handleLocationPopupClose = async () => {
    if (userId) {
      await updateDoc(doc(db, "users_driver", userId), {
        activationPopupShown: false
      });
      setShowLocationPopup(false);
      router.push("/profile/location-google");
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
    <View style={styles.container}>
      {showLocationPopup && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile Activated!</Text>
            <Text style={styles.modalText}>
              Your profile has been successfully activated. To start using the app, please add your delivery location on the next screen.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleLocationPopupClose}
            >
              <Text style={styles.modalButtonText}>Continue to Location Setup</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showActivationModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {userData.status === "active" ? (
              <>
                <Text style={styles.modalText}>
                  Your profile is activated. You can start Qwest
                </Text>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setShowActivationModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalTitle}>Activation Questions</Text>
                  
                  <Text style={styles.questionText}>1. What apps do you use?</Text>
                  <View style={styles.appsContainer}>
                    {deliveryApps.map((app) => (
                      <TouchableOpacity
                        key={app.id}
                        style={[
                          styles.appButton,
                          selectedApps.includes(app.id) && styles.appButtonSelected
                        ]}
                        onPress={() => toggleApp(app.id)}
                      >
                        <Text style={[
                          styles.appButtonText,
                          selectedApps.includes(app.id) && styles.appButtonTextSelected
                        ]}>
                          {app.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.questionText}>
                    2. Please provide screenshots of your current activity with the chosen service
                  </Text>
                  <View style={styles.screenshotsContainer}>
                    {screenshots.map((url, index) => (
                      <Image
                        key={index}
                        source={{ uri: url }}
                        style={styles.screenshot}
                      />
                    ))}
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={pickImage}
                      disabled={uploading}
                    >
                      <Text style={styles.uploadButtonText}>
                        {uploading ? 'Uploading...' : '+ Add Screenshot'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {selectedApps.length > 0 && screenshots.length > 0 && (
                    <Text style={styles.submitMessage}>
                      Thank you for submitting! Please wait for our team to review it. Usually it is very quickly but sometimes can take up to 24 hours.
                    </Text>
                  )}
                </ScrollView>
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
        onPress={() => router.push("/(driver)/profile/support")}
      >
        <Text style={styles.buttonText}>Support</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(driver)/profile/location")}
      >
        <Text style={styles.buttonText}>Location</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(driver)/profile/location-google")}
      >
        <Text style={styles.buttonText}>Location Google</Text>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: '100%',
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  appsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
    width: '100%',
  },
  appButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    backgroundColor: 'white',
    minWidth: 120,
    alignItems: 'center',
  },
  appButtonSelected: {
    backgroundColor: '#007bff',
  },
  appButtonText: {
    color: '#007bff',
    fontSize: 16,
  },
  appButtonTextSelected: {
    color: 'white',
  },
  screenshotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
    width: '100%',
  },
  screenshot: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#007bff',
    fontSize: 14,
    textAlign: 'center',
  },
  submitMessage: {
    fontSize: 16,
    color: '#28a745',
    textAlign: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    width: '100%',
  },
});

export default ProfileScreen;
