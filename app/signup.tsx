import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  Dimensions,
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

import GoldButton from "../components/ui/GoldButton";
import GreenButton from "../components/ui/GreenButton";
import BlueButton from "../components/ui/BlueButton";
import { BACKGROUND1_DARK_MAIN } from "../constants/Colors";

const { width, height } = Dimensions.get("window");
// Извлекаем цвета из BACKGROUND1_DARK_GRADIENT для использования в SVG
const backgroundGradient = ["#02010C", "#08061A"];

const GOOGLE_WEB_CLIENT_ID =
  "251220864547-nl5afre9cfa1lko18a51vbun8jhkv4mh.apps.googleusercontent.com";

// Configure Google Sign-In
console.log(
  "Configuring Google Sign-In with webClientId:",
  GOOGLE_WEB_CLIENT_ID
);
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
  scopes: ["profile", "email"],
});
console.log("Google Sign-In configuration completed");

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
          rank: "Page",
          completedMissionsCount: 0,
          uncompletedMissionsCount: 0,
          failedMissionsCount: 0,
          milesRadius: 10,
          status: "pending",
          activationPopupShown: false,
        });

        router.replace("/(driver)/home");
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

          router.replace("/(driver)/home");
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
      router.replace("/(driver)/home");
    } catch (error: any) {
      alert(`Quick login failed: ${error.message}`);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google Sign-In...");
      console.log("Checking Play Services...");
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log("Play Services check passed");

      console.log("Attempting to sign in with Google...");
      const userInfo = await GoogleSignin.signIn();
      console.log("Google Sign-In successful, user info:", userInfo);

      console.log("Getting tokens...");
      const { idToken } = await GoogleSignin.getTokens();
      console.log("Got tokens, idToken exists:", !!idToken);

      if (!idToken) {
        throw new Error("No ID token present!");
      }

      console.log("Creating Firebase credential...");
      const credential = GoogleAuthProvider.credential(idToken);
      console.log("Firebase credential created");

      console.log("Signing in to Firebase...");
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      console.log("Firebase sign in successful, user:", user.uid);

      console.log("Checking user document...");
      const userDocRef = doc(db, "users_driver", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      console.log("User document exists:", userDocSnap.exists());

      if (!userDocSnap.exists()) {
        console.log("Creating new user document...");
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
        console.log("New user document created");
        router.replace("/(driver)/home");
      } else {
        const userData = userDocSnap.data();
        console.log("Existing user data:", userData);
        router.replace("/(driver)/home");
      }
    } catch (error: any) {
      console.error("Google Sign-In Error Details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      alert("Google Sign-In failed: " + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>
          {mode === "signup" ? "Sign Up" : "Login"}
        </Text>

        {mode === "signup" && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>

        {mode === "signup" && (
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={[styles.checkbox, termsAgreed && styles.checkboxAgreed]}
              onPress={() => setTermsAgreed(!termsAgreed)}
            >
              {termsAgreed && <Text style={styles.checkboxCheck}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text
                style={styles.linkText}
                onPress={() => setShowTermsModal(true)}
              >
                Terms and Conditions
              </Text>
            </Text>
          </View>
        )}

        <GoldButton
          title={mode === "signup" ? "Create Account" : "Login"}
          onPress={handleAuth}
          style={{ marginTop: 20 }}
        />

        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.separatorText}>or</Text>
          <View style={styles.line} />
        </View>

        <GreenButton
          title="Quick Login"
          onPress={handleQuickLogin}
          style={{ marginBottom: 10 }}
        />
        <BlueButton title="Continue with Google" onPress={signInWithGoogle} />

        <TouchableOpacity
          onPress={() => setMode(mode === "login" ? "signup" : "login")}
        >
          <Text style={styles.toggleText}>
            {mode === "login"
              ? "Don't have an account? Sign Up"
              : "Already have an account? "}
            <Text style={styles.linkText}>
              {mode === "login" ? "" : "Login"}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Terms Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showTermsModal}
          onRequestClose={() => setShowTermsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Terms and Conditions</Text>
              <ScrollView>
                <Text>Here are the terms and conditions...</Text>
              </ScrollView>
              <Button title="Close" onPress={() => setShowTermsModal(false)} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND1_DARK_MAIN,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FDEA35",
    marginBottom: 30,
    fontFamily: "Kantumruy Pro",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: "#FDEA35",
    marginBottom: 8,
    fontSize: 16,
    fontFamily: "Kantumruy Pro",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#FDEA35",
    borderRadius: 100,
    paddingHorizontal: 20,
    backgroundColor: "#000",
    color: "#fff",
    fontSize: 16,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#FDEA35",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxAgreed: {
    backgroundColor: "#FDEA35",
  },
  checkboxCheck: {
    color: "#000",
    fontWeight: "bold",
  },
  termsText: {
    color: "#FDEA35",
    fontSize: 16,
  },
  linkText: {
    color: "#28B9EF",
    textDecorationLine: "underline",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#FDEA35",
  },
  separatorText: {
    color: "#FDEA35",
    marginHorizontal: 10,
  },
  toggleText: {
    color: "#FDEA35",
    marginTop: 20,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#08061A",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FDEA35",
    marginBottom: 15,
  },
});
