import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const regBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const botCheck = document.getElementById('botCheck'); // Галочка робота
const statusMsg = document.getElementById('status-message');

// Сброс сессии при заходе на страницу входа
signOut(auth);

// --- ВХОД (index.html) ---
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        // 1. ПРОВЕРКА РОБОТА
        if (!botCheck.checked) {
            statusMsg.innerText = "⛔ Подтвердите, что вы не робот!";
            statusMsg.style.color = "red";
            return;
        }

        const email = emailInput.value;
        const password = passInput.value;

        if(!email || !password) {
            statusMsg.innerText = "Заполните все поля";
            return;
        }

        statusMsg.innerText = "Вход...";
        statusMsg.style.color = "yellow";

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                statusMsg.innerText = "Успех!";
                statusMsg.style.color = "lime";
                setTimeout(() => window.location.href = "menu.html", 1000);
            })
            .catch((error) => {
                statusMsg.innerText = "Ошибка: " + error.message;
                statusMsg.style.color = "red";
            });
    });
}

// --- РЕГИСТРАЦИЯ (register.html) ---
if (regBtn) {
    regBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passInput.value;

        if (password.length < 6) {
            statusMsg.innerText = "Пароль слишком короткий!";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.innerText = "Создание...";
        statusMsg.style.color = "yellow";

        createUserWithEmailAndPassword(auth, email, password)
            .then(() => {
                statusMsg.innerText = "Аккаунт создан! Входим...";
                statusMsg.style.color = "lime";
                setTimeout(() => window.location.href = "menu.html", 1000);
            })
            .catch((error) => {
                statusMsg.innerText = "Ошибка: " + error.message;
                statusMsg.style.color = "red";
            });
    });
}