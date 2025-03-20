import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, OAuthCredential } from 'firebase/auth';
import * as Google from 'expo-auth-session';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneTab, setIsPhoneTab] = useState(false);
  const router = useRouter();

  // Google Auth setup using expo-auth-session
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      clientId: '635117684890-6fqmlf4gjbrgaudinvgaqth8asgh78id.apps.googleusercontent.com', // Use your Google OAuth Client ID here
      redirectUri: Google.makeRedirectUri(), // This handles the redirect URL for your app
    },
    null // Discovery document can be null
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithGoogle(credential);
    }
  }, [response]);



  // Типизация credential как OAuthCredential
  const signInWithGoogle = async (credential: OAuthCredential) => {
    try {
      const userCredential = await signInWithCredential(auth, credential);
      console.log('Logged in with Google: ', userCredential.user);
      router.replace('/(driver)/home');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error);
        alert('Google sign-in failed: ' + error.message);
      } else {
        console.error('An unknown error occurred during Google sign-in', error);
      }
    }
  };
  

  const signIn = async () => {
    try {
      if (isPhoneTab) {
        // Handle phone number sign in here if needed
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Logged in: ', userCredential.user);
        router.replace('/(driver)/home');
      }
    } catch (error: any) {
      console.log(error);
      alert('Sign in failed: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, !isPhoneTab && styles.activeTab]}
          onPress={() => setIsPhoneTab(false)}>
          <Text style={[styles.tabText, !isPhoneTab && styles.activeTabText]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, isPhoneTab && styles.activeTab]}
          onPress={() => setIsPhoneTab(true)}>
          <Text style={[styles.tabText, isPhoneTab && styles.activeTabText]}>Phone</Text>
        </TouchableOpacity>
      </View>

      {isPhoneTab ? (
        <TextInput
          placeholder="Phone Number (USA)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
          maxLength={14} // Format: (XXX) XXX-XXXX
        />
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
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </>
      )}

      <TouchableOpacity style={styles.loginButton} onPress={signIn}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>or</Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => promptAsync()}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  orText: {
    marginVertical: 10,
  },
  googleButton: {
    backgroundColor: '#DB4437',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginVertical: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabButton: {
    padding: 10,
    borderBottomWidth: 2,
    borderColor: '#ccc',
    marginHorizontal: 10,
  },
  activeTab: {
    borderColor: '#FF9800',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
});
