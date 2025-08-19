// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_b4KuDnM4530t1uDj2NaZdhr3d-QGnPc",
  authDomain: "rentify-n8ge3.firebaseapp.com",
  databaseURL: "https://rentify-n8ge3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rentify-n8ge3",
  storageBucket: "rentify-n8ge3.firebasestorage.app",
  messagingSenderId: "1025540698370",
  appId: "1:1025540698370:web:3b1c49da2b4dd1fe87d21b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const storage = getStorage(app);

export { app, db, storage };
