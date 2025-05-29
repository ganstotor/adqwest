import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
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
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { formatPhoneNumber } from "../../../utils/formatPhoneNumber";

const SettingsScreen = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");

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
          if (data.username) setUsername(data.username);
          if (data.phone) setPhone(data.phone);
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

  const validateUsername = async (username: string, currentUserId: string) => {
    if (!username) {
      setUsernameError("Username is required");
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError(
        "Username can only contain letters, numbers and underscore"
      );
      return false;
    }

    const usersSnapshot = await getDocs(
      query(collection(db, "users_driver"), where("username", "==", username))
    );

    // Проверяем, что найденный username не принадлежит текущему пользователю
    if (!usersSnapshot.empty && usersSnapshot.docs[0].id !== currentUserId) {
      setUsernameError("This username is already taken");
      return false;
    }

    setUsernameError("");
    return true;
  };

  const handleSave = async () => {
    if (userId) {
      const isUsernameValid = await validateUsername(username, userId);
      if (!isUsernameValid) {
        return;
      }

      const docRef = doc(db, "users_driver", userId);
      await setDoc(
        docRef,
        {
          name,
          username,
          phone,
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
    <ScrollView style={styles.scrollContainer}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.avatarWrapper}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Avatar</Text>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={pickImage}>
        <Text
          style={{ textAlign: "center", color: "#007bff", marginBottom: 20 }}
        >
          Change Avatar
        </Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Enter your full name"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            if (userId) validateUsername(text, userId);
          }}
          style={[styles.input, usernameError ? styles.inputError : null]}
          placeholder="Enter your username"
        />
        {usernameError ? (
          <Text style={styles.errorText}>{usernameError}</Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={(text) => {
            const formatted = formatPhoneNumber(text);
            if (formatted !== null) {
              setPhone(formatted);
            }
          }}
          style={styles.input}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      <View style={styles.passwordChangeContainer}>
        <Text style={styles.passwordChangeTitle}>Change Password</Text>
        <TextInput
          placeholder="Current Password"
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handlePasswordChange}
        >
          <Text style={styles.saveButtonText}>Update Password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
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
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  passwordChangeContainer: {
    marginTop: 40,
  },
  passwordChangeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SettingsScreen;
