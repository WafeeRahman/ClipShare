// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB5iwNObO_cKniV0EU-XqxtfV8GT-ydGYA",
    authDomain: "clipshare-f3cec.firebaseapp.com",
    projectId: "clipshare-f3cec",
    appId: "1:803297588460:web:62479e863e97a6d7f1a1c9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Signs user in with Google popup
 * @returns A promise to be resolved with user credentials.
 */
export function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);

}

/**
 * Signs user out with Google popup
 * @returns A promise to be resolved with user credentials.
 */
export function signOut() {
    return auth.signOut();
}


/**
 * Trigger a callback when user auth state changes.
 * @returns A function to unsubscribe callback.
 */
export function onAuthStateChangeHelper(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}