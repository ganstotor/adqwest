import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../../firebaseConfig';

const SettingsScreen = () => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const docRef = doc(db, 'users_driver', user.uid);
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      const localUri = result.assets[0].uri;

      try {
        const formData = new FormData();
        formData.append('file', {
          uri: localUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
        formData.append('upload_preset', 'drop_photos');

        const uploadResponse = await fetch(
          'https://api.cloudinary.com/v1_1/dae8c4cok/image/upload',
          {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        const uploadData = await uploadResponse.json();
        if (uploadData.secure_url) {
          setAvatar(uploadData.secure_url);
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        Alert.alert('Upload error', 'Could not upload avatar. Please try again.');
      }
    }
  };

  const saveSettings = async () => {
    if (userId) {
      const ref = doc(db, 'users_driver', userId);
      await setDoc(ref, { name, avatar }, { merge: true });
      Alert.alert('Saved', 'Settings updated successfully');
    }
  };

  const handlePasswordChange = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user && oldPassword && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'New password and confirm password do not match');
        return;
      }

      try {
        // Create credentials for re-authentication
        const credential = EmailAuthProvider.credential(user.email || '', oldPassword);

        // Re-authenticate user
        await reauthenticateWithCredential(user, credential);

        // Update the password
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error) {
        console.error('Password change error:', error);
        Alert.alert('Error', 'Failed to change password. Please check your credentials and try again.');
      }
    } else {
      Alert.alert('Error', 'Please fill all fields.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity onPress={pickImage}>
        <View style={styles.avatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Avatar</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
      </View>

      <Button title="Save Settings" onPress={saveSettings} />

      <View style={styles.passwordChangeContainer}>
        <Text style={styles.passwordChangeTitle}>Change Password</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Old Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter old password"
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <Button title="Change Password" onPress={handlePasswordChange} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#aaa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
  placeholderText: {
    color: '#777',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  passwordChangeContainer: {
    marginTop: 40,
  },
  passwordChangeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});

export default SettingsScreen;
