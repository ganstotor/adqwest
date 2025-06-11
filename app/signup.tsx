import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Button } from "react-native";

const GOOGLE_WEB_CLIENT_ID = "251220864547-nl5afre9cfa1lko18a51vbun8jhkv4mh.apps.googleusercontent.com";

// Configure Google Sign-In
console.log('Configuring Google Sign-In with webClientId:', GOOGLE_WEB_CLIENT_ID);
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
  scopes: ['profile', 'email'],
});
console.log('Google Sign-In configuration completed');

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (mode === "signup") {
        if (!termsAgreed) {
          alert("Please agree to the Terms and Conditions to continue");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        const userDocRef = doc(db, "users_driver", user.uid);
        await setDoc(userDocRef, {
          email: user.email,
          name: name,
          rank: "Recruit",
          completedMissionsCount: 0,
          uncompletedMissionsCount: 0,
          failedMissionsCount: 0,
          milesRadius: 10,
          status: "pending",
          activationPopupShown: false,
        });

        router.push("/(driver)/profile");
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        const userDocRef = doc(db, "users_driver", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          if (userData.activationPopupShown) {
            router.push("/(driver)/profile");
          } else if (userData.status === "active") {
            router.push("/(driver)/my-qwests");
          } else {
            router.push("/(driver)/profile");
          }
        } else {
          alert("User data not found in users_driver collection.");
        }
      }
    } catch (error: any) {
      alert(
        `${mode === "signup" ? "Sign up" : "Sign in"} failed: ${error.message}`
      );
    }
  };

  const handleQuickLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, "alex@mail.com", "123321");
      router.push("/(driver)/profile" as any);
    } catch (error: any) {
      alert(`Quick login failed: ${error.message}`);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google Sign-In...');
      console.log('Checking Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Play Services check passed');
      
      console.log('Attempting to sign in with Google...');
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful, user info:', userInfo);
      
      console.log('Getting tokens...');
      const { idToken } = await GoogleSignin.getTokens();
      console.log('Got tokens, idToken exists:', !!idToken);
      
      if (!idToken) {
        throw new Error('No ID token present!');
      }
      
      console.log('Creating Firebase credential...');
      const credential = GoogleAuthProvider.credential(idToken);
      console.log('Firebase credential created');
      
      console.log('Signing in to Firebase...');
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      console.log('Firebase sign in successful, user:', user.uid);
      
      console.log('Checking user document...');
      const userDocRef = doc(db, "users_driver", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      console.log('User document exists:', userDocSnap.exists());
      
      if (!userDocSnap.exists()) {
        console.log('Creating new user document...');
        await setDoc(userDocRef, {
          email: user.email,
          name: user.displayName || name,
          rank: "Recruit",
          completedMissionsCount: 0,
          uncompletedMissionsCount: 0,
          failedMissionsCount: 0,
          milesRadius: 10,
          status: "pending",
          activationPopupShown: false,
        });
        console.log('New user document created');
        router.push("/(driver)/profile");
      } else {
        const userData = userDocSnap.data();
        console.log('Existing user data:', userData);
        if (userData.activationPopupShown) {
          router.push("/(driver)/profile");
        } else if (userData.status === "active") {
          router.push("/(driver)/my-qwests");
        } else {
          router.push("/(driver)/profile");
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In Error Details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert('Google Sign-In failed: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === "signup" ? "Sign Up" : "Login"}
      </Text>

      {mode === "signup" && (
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {mode === "signup" && (
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setTermsAgreed(!termsAgreed)}
          >
            <View
              style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}
            >
              {termsAgreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>I agree to the </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTermsModal(true)}>
            <Text style={styles.termsLink}>Terms and Conditions</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
        <Text style={styles.buttonText}>
          {mode === "signup" ? "Create Account" : "Login"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.switchText}>
        {mode === "signup"
          ? "Already have an account?"
          : "Don't have an account?"}{" "}
        <Text
          style={styles.switchLink}
          onPress={() => setMode(mode === "signup" ? "login" : "signup")}
        >
          {mode === "signup" ? "Login" : "Sign Up"}
        </Text>
      </Text>

      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity style={styles.quickButton} onPress={handleQuickLogin}>
        <Text style={styles.buttonText}>Quick Login (alex@mail.com)</Text>
      </TouchableOpacity>

      <GoogleSigninButton
        style={{ width: 192, height: 48, marginTop: 10 }}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={signInWithGoogle}
      />

      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms and Agreement</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                By accepting these terms, you agree to:
                {"\n\n"}
                1. Provide accurate and truthful information about your delivery
                experience
                {"\n\n"}
                2. Maintain professional conduct while using our platform
                {"\n\n"}
                3. Follow all local regulations and guidelines for delivery
                services
                {"\n\n"}
                4. Keep your account information up to date
                {"\n\n"}
                5. Respect the privacy and confidentiality of customer
                information
                {"\n\n"}
                6. Comply with our platform's policies and procedures
                {"\n\n"}
                7. Understand that violation of these terms may result in
                account suspension
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setTermsAgreed(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.modalButtonText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  authButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginVertical: 5,
  },
  quickButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  switchText: {
    marginTop: 15,
    fontSize: 16,
  },
  switchLink: {
    fontWeight: "bold",
    color: "#007AFF",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#777",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    flexWrap: "wrap",
    width: "100%",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  termsText: {
    fontSize: 14,
    color: "#333",
  },
  termsLink: {
    fontSize: 14,
    color: "#007bff",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  modalBody: {
    maxHeight: "80%",
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  modalButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});