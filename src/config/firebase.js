import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
apiKey: "AIzaSyC5QH6PLy9HRq4B5ni5su66L0lPk-WLtGg",
authDomain: "ludos-f9143.firebaseapp.com",
projectId: "ludos-f9143",
storageBucket: "ludos-f9143.firebasestorage.app",
messagingSenderId: "764958054021",
appId: "1:764958054021:web:7fb08810204d60c60efbec"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);