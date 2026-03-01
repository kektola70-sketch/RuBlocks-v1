
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// Элементы
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const regBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const botCheck = document.getElementById('botCheck');
const statusMsg = document.getElementById('status-message');

// 1. АВТО-ВХОД
onAuthStateChanged(auth, (user) => {
    if (user) {
        if(statusMsg) {
            statusMsg.innerText = "Аккаунт найден! Входим...";
            statusMsg.style.color = "lime";
        }
        setTimeout(() => window.location.href = "menu.html", 500);
    }
});

// 2. ВХОД С ЗАПОМИНАНИЕМ
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        if (!botCheck.checked) {
            statusMsg.innerText = "⛔ Подтвердите, что вы не робот!";
            statusMsg.style.color = "red";
            return;
        }

        const email = emailInput.value;
        const password = passInput.value;

        statusMsg.innerText = "Вход...";
        statusMsg.style.color = "yellow";

        try {
            // ВАЖНО: Принудительно включаем запоминание перед входом
            await setPersistence(auth, browserLocalPersistence);
            
            await signInWithEmailAndPassword(auth, email, password);
            statusMsg.innerText = "Успех!";
            statusMsg.style.color = "lime";
            // onAuthStateChanged сработает сам
        } catch (error) {
            statusMsg.innerText = "Ошибка: " + error.message;
            statusMsg.style.color = "red";
        }
    });
}

// 3. РЕГИСТРАЦИЯ С ЗАПОМИНАНИЕМ
if (regBtn) {
    regBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passInput.value;

        if (password.length < 6) {
            statusMsg.innerText = "Пароль < 6 символов!";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.innerText = "Создание...";
        statusMsg.style.color = "yellow";

        try {
            // ВАЖНО: Принудительно включаем запоминание
            await setPersistence(auth, browserLocalPersistence);

            await createUserWithEmailAndPassword(auth, email, password);
            statusMsg.innerText = "Готово! Входим...";
            statusMsg.style.color = "lime";
        } catch (error) {
            statusMsg.innerText = "Ошибка: " + error.message;
            statusMsg.style.color = "red";
        }
    });
};