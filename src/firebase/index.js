import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { MMKV } from "../redux/mmkv";

// ireps2 (Staging)
const firebaseConfig = {
  apiKey: "AIzaSyAkE9nf-G-gW9Pv9ZSxRzyr0FL3G6XXJA8",
  authDomain: "ireps2.firebaseapp.com",
  projectId: "ireps2",
  storageBucket: "ireps2.appspot.com",
  messagingSenderId: "885517634969",
  appId: "1:885517634969:web:f013c3961097836245d708",
};

// ipreps (production)
// const firebaseConfig = {
// 	apiKey: "AIzaSyCivNf1fZ_8d692nLhjpuiRwSqZVBofMIM",
// 	authDomain: "ireps-5c3e9.firebaseapp.com",
// 	projectId: "ireps-5c3e9",
// 	storageBucket: "ireps-5c3e9.firebasestorage.app",
// 	messagingSenderId: "236369917108",
// 	appId: "1:236369917108:web:85b87ec389686408d1d3e1",
// 	measurementId: "G-EC8PYLH79J",
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize firestore
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  // localCache: persistentLocalCache(),
});
// export const db = getFirestore(app);
// export const db = initializeFirestore(app, {
//   experimentalForceLongPolling: true, // 🎯 THE STABILIZER
// });
// export const db = initializeFirestore(app, {
//   experimentalForceLongPolling: true,
//   useFetchStreams: false,
// });

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(MMKV),
});

// initialize firebase storage
export const storage = getStorage(app);

// Initialize functions
export const functions = getFunctions(app);
