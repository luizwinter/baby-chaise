// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// 1. Crie um projeto gratuito em https://console.firebase.google.com
// 2. Dentro do projeto, vá em "Build > Firestore Database" e clique
//    em "Criar banco de dados" (modo de produção ou teste, tanto faz
//    para este evento único).
// 3. Em "Regras" do Firestore, cole isso durante o evento (depois pode
//    apagar o projeto todo, já que é um uso único):
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
// 4. Vá em "Configurações do projeto" (ícone de engrenagem) > role até
//    "Seus apps" > clique no ícone "</>" para criar um app da Web.
// 5. Copie o objeto firebaseConfig gerado e cole substituindo o objeto
//    abaixo.
// ============================================================

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
