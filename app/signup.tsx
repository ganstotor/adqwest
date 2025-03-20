import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";
import { PhoneAuthProvider, signInWithCredential, createUserWithEmailAndPassword } from "firebase/auth";

import * as Google from "expo-auth-session/providers/google";
import PhoneInput from "react-native-phone-number-input";

export default function SignUpScreen() {
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [confirm, setConfirm] = useState<any>(null);
  const router = useRouter();

  // Google Auth
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID", // Замените на свой
  });

  const signUp = async () => {
    try {
      if (tab === "email") {
        // Email registration
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential) router.replace("/(driver)/home");
      } else {
        // Phone authentication
        if (confirm) {
          const credential = PhoneAuthProvider.credential(confirm.verificationId, verificationCode);
          const userCredential = await signInWithCredential(auth, credential);
          if (userCredential) router.replace("/(driver)/home");
        } else {
          alert("Please enter the verification code.");
        }
      }
    } catch (error: any) {
      console.log(error);
      alert("Sign up failed: " + error.message);
    }
  };

  const sendVerificationCode = async () => {
    const phoneProvider = new PhoneAuthProvider(auth);
    try {
      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedPhone
      );
      setConfirm({ verificationId });
    } catch (error: any) {
      console.log("Phone verification failed:", error);
      alert("Verification failed: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Sign Up</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === "phone" && styles.activeTab]}
          onPress={() => setTab("phone")}
        >
          <Text style={styles.tabText}>Phone</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "email" && styles.activeTab]}
          onPress={() => setTab("email")}
        >
          <Text style={styles.tabText}>Email</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      {tab === "phone" ? (
        <>
          <PhoneInput
            defaultValue={phone}
            defaultCode="US"
            layout="first"
            onChangeText={setPhone}
            onChangeFormattedText={setFormattedPhone}
            containerStyle={styles.phoneInput}
            textContainerStyle={{ paddingVertical: 0 }}
          />
          <TouchableOpacity style={styles.signupButton} onPress={sendVerificationCode}>
            <Text style={styles.buttonText}>Send Verification Code</Text>
          </TouchableOpacity>
          <TextInput
            placeholder="Enter Verification Code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            style={styles.input}
          />
        </>
      ) : (
        <>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            placeholder="Create Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </>
      )}

      <TouchableOpacity style={styles.signupButton} onPress={signUp}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>or</Text>

      <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <Text style={styles.loginText}>
        If you have an account,
        <Text style={styles.loginLink} onPress={() => router.push("/login")}>
          {" "}Login
        </Text>
      </Text>
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
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tab: {
    padding: 10,
    marginHorizontal: 5,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  activeTab: {
    borderColor: "#FF9800",
  },
  tabText: {
    fontSize: 16,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  phoneInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  signupButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginVertical: 5,
  },
  googleButton: {
    backgroundColor: "#DB4437",
    padding: 12,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginVertical: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  orText: {
    marginVertical: 10,
  },
  loginText: {
    marginTop: 15,
    fontSize: 16,
  },
  loginLink: {
    fontWeight: "bold",
    color: "#007AFF",
  },
});
