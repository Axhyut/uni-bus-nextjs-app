// Import the functions you need from the SDKs you need

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCJB7kvGDwlfiklhSPEuKYpX1C79Gfb-Z8",
  authDomain: "unibuss-e7877.firebaseapp.com",
  projectId: "unibuss-e7877",
  storageBucket: "unibuss-e7877.firebasestorage.app",
  messagingSenderId: "323862128464",
  appId: "1:323862128464:web:3a9e3494d27db44655ee55",
  measurementId: "G-49TFPKQXV1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
