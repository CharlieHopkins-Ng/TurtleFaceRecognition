// filepath: d:\Projects\TurtleFaceRecognition\firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBYwkwNAoJ2kKSZBV_kQcsi-kFmjVxwCGU",
    authDomain: "turtlefacerecognition.firebaseapp.com",
    projectId: "turtlefacerecognition",
    storageBucket: "turtlefacerecognition.firebasestorage.app",
    messagingSenderId: "87133347647",
    appId: "1:87133347647:web:e89947c0c4dc3508d27d8a",
    measurementId: "G-KGMNB5PMNW"
};

const app = initializeApp(firebaseConfig); // Initialize Firebase App
export const db = getFirestore(app); // Export Firestore instance
export const auth = getAuth(app); // Export Auth instance
export default app; // Export the app instance