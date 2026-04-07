import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXPgJw-inrarHgzgGxQAZckVEEVVzEDew",
  authDomain: "brand-word-challenge.firebaseapp.com",
  projectId: "brand-word-challenge",
  storageBucket: "brand-word-challenge.firebasestorage.app",
  messagingSenderId: "401741675817",
  appId: "1:401741675817:web:8008e89e2a8ff6379b4b38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export default app;
