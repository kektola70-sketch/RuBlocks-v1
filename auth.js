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

// Получаем элементы (они могут быть null, если мы на другой странице)
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const regBtn = document.getElementById('registerBtn'); // Есть только в register.html
const loginBtn = document.getElementById('loginBtn'); // Есть только в index.html
const statusMsg = document.getElementById('status-message');

// Сбрасываем старые входы при загрузке любой из этих страниц
signOut(auth);

// --- ЛОГИКА ДЛЯ СТРАНИЦЫ РЕГИСТРАЦИИ ---
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
                statusMsg.innerText = "Успех! Переход в меню...";
                statusMsg.style.color = "lime";
                setTimeout(() => window.location.href = "menu.html", 1000);
            })
            .catch((error) => {
                statusMsg.innerText = "Ошибка: " + error.message;
                statusMsg.style.color = "red";
            });
    });
}

// --- ЛОГИКА ДЛЯ СТРАНИЦЫ ВХОДА ---
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passInput.value;

        statusMsg.innerText = "Вход...";
        statusMsg.style.color = "yellow";

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                statusMsg.innerText = "Успех! Переход в меню...";
                statusMsg.style.color = "lime";
                setTimeout(() => window.location.href = "menu.html", 1000);
            })
            .catch((error) => {
                statusMsg.innerText = "Ошибка: " + error.message; // Тут покажет, если пароль неверный
                statusMsg.style.color = "red";
            });
    });
}