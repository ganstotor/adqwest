// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
//import { getAnalytics, Analytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence, Auth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCA47vxOBlkGm-86Z8IXAoz8spQd3Vpr8M",
  authDomain: "deployed-c1878.firebaseapp.com",
  projectId: "deployed-c1878",
  storageBucket: "deployed-c1878.firebasestorage.app",
  messagingSenderId: "251220864547",
  appId: "1:251220864547:web:c87d1eb618574b4eef0b96",
  measurementId: "G-VGRV00EYX3"
};

// Initialize Firebase app
const app: FirebaseApp = initializeApp(firebaseConfig);
console.log("Firebase projectId:", app.options.projectId);
// Initialize Firebase Analytics
//const analytics: Analytics = getAnalytics(app);

// Initialize Firebase Auth with React Native AsyncStorage persistence
export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore database
const db = getFirestore(app);
const storage = getStorage(app);


// Export Firebase app and analytics if needed
//export { app, analytics };
export { app, db, storage };
