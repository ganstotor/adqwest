import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import {
  getAuth,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Typography from '../../../components/ui/Typography';
import GoldButton from '../../../components/ui/GoldButton';
import { BACKGROUND1_LIGHT } from '../../../constants/Colors';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const SettingsScreen = () => {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const docRef = doc(db, "users_driver", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setName(data.name);
          if (data.avatar) setAvatar(data.avatar);
        }
      }
    });
    return unsubscribe;
  }, []);

  const uriToBlob = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Permission to access media library is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0 && userId) {
      const localUri = result.assets[0].uri;

      try {
        const blob = await uriToBlob(localUri);

        const storageRef = ref(storage, `avatars/${userId}.jpg`);
        await uploadBytes(storageRef, blob);

        const downloadURL = await getDownloadURL(storageRef);

        setAvatar(downloadURL);

        const userDocRef = doc(db, "users_driver", userId);
        await setDoc(userDocRef, { avatar: downloadURL }, { merge: true });
      } catch (error) {
        Alert.alert(
          "Upload error",
          "Could not upload avatar. Please try again."
        );
      }
    }
  };

  const handleSave = async () => {
    if (userId) {
      const docRef = doc(db, "users_driver", userId);
      await setDoc(
        docRef,
        {
          name,
          avatar: avatar || null,
        },
        { merge: true }
      );
      alert("Profile updated successfully!");
    }
  };

  const handlePasswordChange = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user && oldPassword && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "New password and confirm password do not match");
        return;
      }

      try {
        const credential = EmailAuthProvider.credential(
          user.email || "",
          oldPassword
        );

        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        Alert.alert("Success", "Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        Alert.alert(
          "Error",
          "Failed to change password. Please check your credentials and try again."
        );
      }
    } else {
      Alert.alert("Error", "Please fill all fields.");
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
      <ScrollView style={[styles.scrollContainer, { backgroundColor: 'transparent' }]}> 
        <Typography variant="h2" style={{ textAlign: 'center', marginBottom: 30 }}>
          Settings
        </Typography>

        <View style={styles.avatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholder}>
              <Typography variant="caption">Avatar</Typography>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={pickImage}>
          <Typography variant="label2" style={{ textAlign: "center", marginBottom: 20 }}>
            Change Avatar
          </Typography>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Typography variant="label1">Full Name</Typography>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#888"
          />
        </View>

        <GoldButton title="Save Changes" onPress={handleSave} style={{ marginVertical: 12 }} />

        <View style={styles.passwordChangeContainer}>
          <Typography variant="h4" style={{ textAlign: 'center', marginBottom: 10 }}>
            Change Password
          </Typography>
          <TextInput
            placeholder="Current Password"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
          />
          <GoldButton title="Update Password" onPress={handlePasswordChange} style={{ marginVertical: 12 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    // backgroundColor: "#fff", // заменено на BACKGROUND1_LIGHT
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#aaa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#eee",
  },
  placeholderText: {
    color: "#777",
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: '#FDEA35',
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  passwordChangeContainer: {
    marginTop: 30,
  },
  passwordChangeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
});

export default SettingsScreen;
