// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// Regras do Firestore usadas neste projeto (Firestore Database > Regras):
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /players/{playerId} {
//          allow read, write: if true;
//        }
//        match /config/{doc} {
//          allow read, write: if true;
//        }
//      }
//    }
//
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCXj7MZcLg_e4cVC_IxDmwXylEEPiiteBk",
  authDomain: "cha-de-bebe-karina-junior.firebaseapp.com",
  projectId: "cha-de-bebe-karina-junior",
  storageBucket: "cha-de-bebe-karina-junior.firebasestorage.app",
  messagingSenderId: "824593652370",
  appId: "1:824593652370:web:8d25676f471eccd3f4e44b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
