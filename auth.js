import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Твой конфиг
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
const statusMsg = document.getElementById('status-message');

// --- ОТКЛЮЧЕНИЕ ЗАПОМИНАНИЯ (СБРОС ВХОДА) ---
// Как только открывается эта страница, мы выходим из аккаунта
signOut(auth).then(() => {
    console.log("Аккаунт сброшен. Требуется вход.");
    statusMsg.innerText = "Введите данные для входа";
}).catch((error) => {
    console.error("Ошибка сброса:", error);
});


// --- ЛОГИКА КНОПОК ---

// 1. Регистрация
regBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;

    if (password.length < 6) {
        statusMsg.innerText = "Пароль слишком короткий!";
        statusMsg.style.color = "red";
        return;
    }

    statusMsg.innerText = "Регистрация...";
    statusMsg.style.color = "yellow";

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // УСПЕХ -> ПЕРЕХОДИМ В МЕНЮ ВРУЧНУЮ
            statusMsg.innerText = "Успех! Переход...";
            statusMsg.style.color = "lime";
            setTimeout(() => {
                window.location.href = "menu.html";
            }, 1000);
        })
        .catch((error) => {
            showError(error);
        });
});

// 2. Вход
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;

    statusMsg.innerText = "Вход...";
    statusMsg.style.color = "yellow";

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // УСПЕХ -> ПЕРЕХОДИМ В МЕНЮ ВРУЧНУЮ
            statusMsg.innerText = "Вход выполнен! Переход...";
            statusMsg.style.color = "lime";
            setTimeout(() => {
                window.location.href = "menu.html";
            }, 1000);
        })
        .catch((error) => {
            showError(error);
        });
});

// Показ ошибок
function showError(error) {
    console.error(error);
    statusMsg.style.color = "red";
    if (error.code === 'auth/invalid-credential') {
        statusMsg.innerText = "Ошибка: Неверный Email или пароль!";
    } else if (error.code === 'auth/email-already-in-use') {
        statusMsg.innerText = "Ошибка: Этот Email уже занят!";
    } else {
        statusMsg.innerText = "Ошибка: " + error.code;
    }
}