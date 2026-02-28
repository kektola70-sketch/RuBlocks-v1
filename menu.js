import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBtElNGI8_4BSDO2XRnTjSw7AnjDQb83Kk",
  authDomain: "rublocks-v1.firebaseapp.com",
  projectId: "rublocks-v1",
  storageBucket: "rublocks-v1.firebasestorage.app",
  messagingSenderId: "571591636842",
  appId: "1:571591636842:web:c450a1c15ec983fd535713",
  measurementId: "G-82D3V3YJ7V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const myUsername = document.getElementById('myUsername');
const myAvatar = document.getElementById('myAvatar');
const openSearchBtn = document.getElementById('openSearchBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Главная логика
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Мы вошли
        console.log("Authorized: " + user.email);
        
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                // Данные уже есть
                const data = userSnap.data();
                myUsername.innerText = data.username;
                myAvatar.src = data.avatar;
            } else {
                // Данных нет - СОЗДАЕМ
                myUsername.innerText = "Создание профиля...";
                
                const newData = {
                    username: user.email.split('@')[0], // Берем имя до @
                    email: user.email,
                    uid: user.uid,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                    isOnline: true
                };

                await setDoc(userRef, newData);
                
                // Обновляем экран
                myUsername.innerText = newData.username;
                myAvatar.src = newData.avatar;
            }
        } catch (error) {
            // ЕСЛИ ОШИБКА - ПИШЕМ ЕЁ НА ЭКРАНЕ, А НЕ ПЕРЕЗАГРУЖАЕМСЯ
            console.error(error);
            myUsername.innerText = "ERROR: " + error.code;
            myUsername.style.color = "red";
            alert("Ошибка Базы Данных: " + error.message);
        }

    } else {
        // Если не вошли - назад на регистрацию
        window.location.href = "index.html";
    }
});

// Кнопка выхода
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = "index.html");
    });
}