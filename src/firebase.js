import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAo5pJTA6O7qIgtqjtKyG7oo5cdb0WJtBg",
  authDomain: "sim-madrasah-jun.firebaseapp.com",
  projectId: "sim-madrasah-jun",
  storageBucket: "sim-madrasah-jun.firebasestorage.app",
  messagingSenderId: "351778428771",
  appId: "1:351778428771:web:c592b7aff64156f12fa556"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);