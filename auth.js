import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// КОНФИГУРАЦИЯ
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

// Элементы управления
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const regBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const statusMsg = document.getElementById('status-message');
const loginContainer = document.querySelector('.login-container');

// Скрываем форму пока проверяем вход, чтобы не моргало
if(loginContainer) loginContainer.style.display = 'none';

// --- ГЛАВНАЯ ПРОВЕРКА (АВТО-ВХОД) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // УРА! Телефон помнит аккаунт.
        console.log("Аккаунт найден: " + user.email);
        statusMsg.innerText = "Вход выполнен! Переходим в меню...";
        
        // Перенаправляем в Меню через 1 секунду (чтобы успела прогрузиться база)
        setTimeout(() => {
            window.location.href = "menu.html";
        }, 500);
    } else {
        // Аккаунта нет. Показываем форму входа.
        console.log("Аккаунт не найден. Нужно войти.");
        if(loginContainer) loginContainer.style.display = 'block';
    }
});

// --- ЛОГИКА КНОПОК ---

// Кнопка РЕГИСТРАЦИЯ
if(regBtn) {
    regBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passInput.value;

        if (password.length < 6) {
            statusMsg.innerText = "Пароль слишком короткий (минимум 6 символов)!";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.innerText = "Регистрация...";
        statusMsg.style.color = "yellow";

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Успех! onAuthStateChanged сработает сам и перекинет в меню
                statusMsg.innerText = "Успех! Создаем профиль...";
                statusMsg.style.color = "lime";
            })
            .catch((error) => {
                showError(error);
            });
    });
}

// Кнопка ВХОД
if(loginBtn) {
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passInput.value;

        statusMsg.innerText = "Вход...";
        statusMsg.style.color = "yellow";

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Успех!
                statusMsg.innerText = "Пароль верный! Заходим...";
                statusMsg.style.color = "lime";
            })
            .catch((error) => {
                showError(error);
            });
    });
}

function showError(error) {
    console.error(error);
    statusMsg.style.color = "red";
    if (error.code === 'auth/invalid-credential') {
        statusMsg.innerText = "Неверная почта или пароль!";
    } else if (error.code === 'auth/email-already-in-use') {
        statusMsg.innerText = "Такая почта уже зарегистрирована!";
    } else {
        statusMsg.innerText = "Ошибка: " + error.code;
    }
}