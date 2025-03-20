// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
//import { getAnalytics, Analytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence, Auth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Define the Firebase configuration object with proper typing
const firebaseConfig: Record<string, string> = {
  apiKey: "AIzaSyCK3ruVGOAZM00yRNWvww1VyLwZt1-Jqj4",
  authDomain: "bagr-4ed70.firebaseapp.com",
  projectId: "bagr-4ed70",
  storageBucket: "bagr-4ed70.firebasestorage.app",
  messagingSenderId: "529539787830",
  appId: "1:529539787830:web:91b88b12ef45092ff87c97",
  measurementId: "G-MD59MZRVLF",
};

// Initialize Firebase app
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Analytics
//const analytics: Analytics = getAnalytics(app);

// Initialize Firebase Auth with React Native AsyncStorage persistence
export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Export Firebase app and analytics if needed
//export { app, analytics };
export { app };
