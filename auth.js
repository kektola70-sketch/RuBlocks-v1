// Используем CDN ссылки, так как в Acode нет Node.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Твоя конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyBtElNGI8_4BSDO2XRnTjSw7AnjDQb83Kk",
  authDomain: "rublocks-v1.firebaseapp.com",
  projectId: "rublocks-v1",
  storageBucket: "rublocks-v1.firebasestorage.app",
  messagingSenderId: "571591636842",
  appId: "1:571591636842:web:c450a1c15ec983fd535713",
  measurementId: "G-82D3V3YJ7V"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Инициализация Аутентификации

// Получаем элементы из HTML
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const regBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const statusMsg = document.getElementById('status-message');

// Логика кнопки РЕГИСТРАЦИЯ
regBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;

    if (!email || !password) {
        showMessage("Введите Email и пароль", "red");
        return;
    }

    showMessage("Регистрация...", "yellow");

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            showMessage(`Успех! Создан ID: ${user.uid}`, "lime");
            console.log(user);
            // Тут позже сделаем переход в игру
        })
        .catch((error) => {
            handleError(error);
        });
});

// Логика кнопки ВХОД (на будущее)
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;

    if (!email || !password) {
        showMessage("Введите Email и пароль", "red");
        return;
    }

    showMessage("Вход...", "yellow");

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            showMessage(`Вход выполнен! Привет, ${user.email}`, "lime");
        })
        .catch((error) => {
            handleError(error);
        });
});

// Вспомогательные функции
function showMessage(text, color) {
    statusMsg.innerText = text;
    statusMsg.style.color = color;
}

function handleError(error) {
    console.error(error);
    if (error.code === 'auth/email-already-in-use') {
        showMessage("Этот Email уже занят!", "red");
    } else if (error.code === 'auth/weak-password') {
        showMessage("Пароль должен быть от 6 символов", "red");
    } else if (error.code === 'auth/invalid-credential') {
        showMessage("Неверный логин или пароль", "red");
    } else {
        showMessage("Ошибка: " + error.message, "red");
    }
}