  //import { initializeApp } from "firebase/app";
//  import { getAuth } from "firebase/auth";
 // import { getFirestore } from "firebase/firestore";

  //const firebaseConfig = {
   // apiKey: "AIzaSyCTg5NvAqYxFRJV1AXfklJm1hBSP52fVB0",
   // authDomain: "chalobus-4c65f.firebaseapp.com",
    //projectId: "chalobus-4c65f",
   // storageBucket: "chalobus-4c65f.firebasestorage.app",
   // messagingSenderId: "446646374138",
   // appId: "1:446646374138:web:0361a20d7cc0afbedc4343"
  //};

  // Initialize Firebase
 // const app = initializeApp(firebaseConfig);

  // Export services
  //export const auth = getAuth(app);
 // export const db = getFirestore(app);

  //
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCTg5NvAqYxFRJV1AXfklJm1hBSP52fVB0",
  authDomain: "chalobus-4c65f.firebaseapp.com",
  projectId: "chalobus-4c65f",
  storageBucket: "chalobus-4c65f.appspot.com",
  messagingSenderId: "446646374138",
  appId: "1:446646374138:web:0361a20d7cc0afbedc4343"
};

const app = initializeApp(firebaseConfig);
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Le4mjksAAAAAEMuGtBOUjM0LejvnTeGy8LwOa-B"),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const db = getFirestore(app);
//export default app;