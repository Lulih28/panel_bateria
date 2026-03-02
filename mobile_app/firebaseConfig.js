// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace the following with your app's standard Firebase project configuration
// You can get these values from the Firebase Console: Project settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyC1pB3zEHBb2opE7j2G33pzjoAw_KhmVDM",
  authDomain: "proyectoapp-a688c.firebaseapp.com",
  projectId: "proyectoapp-a688c",
  storageBucket: "proyectoapp-a688c.firebasestorage.app",
  messagingSenderId: "281563587230",
  appId: "1:281563587230:web:95fd03759f5ed1182fd18f",
  measurementId: "G-7GFD2FNG1Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth };
