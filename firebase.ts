// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfRLrBGosU4y6uQfeQ98ivZMtm2nWFexU",
  authDomain: "seoul-arena-request-app.firebaseapp.com",
  projectId: "seoul-arena-request-app",
  storageBucket: "seoul-arena-request-app.firebasestorage.app",
  messagingSenderId: "639055970703",
  appId: "1:639055970703:web:d23b87051039a8ec4e8bfa",
  measurementId: "G-1ST1QH6XTC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
