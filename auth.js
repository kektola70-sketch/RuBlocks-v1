import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// --- 1. АВТОМАТИЧЕСКАЯ ПРОВЕРКА (ЗАПОМИНАНИЕ) ---
// Этот код срабатывает сам при запуске страницы
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Если Firebase помнит пользователя
        console.log("Найден активный сеанс: " + user.email);
        
        if(statusMsg) {
            statusMsg.innerText = "Вход выполнен! Переход...";
            statusMsg.style.color = "lime";
        }
        
        // Сразу перекидываем в меню
        window.location.href = "menu.html";
    } else {
        // Если пользователя нет - ничего не делаем, ждем ввода пароля
        console.log("Пользователь не найден. Нужен вход.");
    }
});

// --- 2. ЛОГИКА РЕГИСТРАЦИИ (register.html) ---
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
                // onAuthStateChanged сработает сам и перекинет
                statusMsg.innerText = "Успех!";
            })
            .catch((error) => {
                statusMsg.innerText = "Ошибка: " + error.message;
                statusMsg.style.color = "red";
            });
    });
}

// --- 3. ЛОГИКА ВХОДА (index.html) ---
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passInput.value;

        statusMsg.innerText = "Вход...";
        statusMsg.style.color = "yellow";

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                // onAuthStateChanged сработает сам и перекинет
                statusMsg.innerText = "Успех!";
            })
            .catch((error) => {
                statusMsg.innerText = "Ошибка: " + error.message;
                statusMsg.style.color = "red";
            });
    });
}