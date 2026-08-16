import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
const firebaseConfig = {
    apiKey: "AIzaSyCGch4DVVf6oHO_dcvW7Cjg7EsvEFWd6PE",
    authDomain: "sh-jsi28-tuyetminh.firebaseapp.com",
    projectId: "sh-jsi28-tuyetminh",
    storageBucket: "sh-jsi28-tuyetminh.firebasestorage.app",
    messagingSenderId: "1055378685005",
    appId: "1:1055378685005:web:761bddc804179cafe17004",
    measurementId: "G-Y0R97Y76EH"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
};