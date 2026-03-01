import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const regBtn = document.getElementById('registerBtn'); // Кнопка регистрации
const loginBtn = document.getElementById('loginBtn'); // Кнопка входа
const botCheck = document.getElementById('botCheck');
const statusMsg = document.getElementById('status-message');

// ==========================================
// ЛОГИКА ДЛЯ СТРАНИЦЫ РЕГИСТРАЦИИ (register.html)
// ==========================================
if (regBtn) {
    // 1. Сразу сбрасываем старый вход, чтобы не мешал создавать новый аккаунт
    signOut(auth).then(() => {
        console.log("Сессия очищена для регистрации");
    });

    // 2. Обработка нажатия кнопки
    regBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passInput.value;

        if (password.length < 6) {
            statusMsg.innerText = "Пароль минимум 6 символов!";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.innerText = "Создание...";
        statusMsg.style.color = "yellow";

        try {
            // Создаем аккаунт
            await createUserWithEmailAndPassword(auth, email, password);
            
            // Если успешно - пишем и перекидываем
            statusMsg.innerText = "Успех! Входим...";
            statusMsg.style.color = "lime";
            
            setTimeout(() => {
                window.location.href = "menu.html";
            }, 1000);

        } catch (error) {
            statusMsg.innerText = "Ошибка: " + error.message;
            statusMsg.style.color = "red";
        }
    });
}

// ==========================================
// ЛОГИКА ДЛЯ СТРАНИЦЫ ВХОДА (index.html)
// ==========================================
if (loginBtn) {
    // 1. Только здесь включаем авто-вход
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if(statusMsg) {
                statusMsg.innerText = "Аккаунт найден! Входим...";
                statusMsg.style.color = "lime";
            }
            setTimeout(() => window.location.href = "menu.html", 500);
        }
    });

    // 2. Обработка кнопки
    loginBtn.addEventListener('click', async () => {
        if (botCheck && !botCheck.checked) {
            statusMsg.innerText = "⛔ Подтвердите, что вы не робот!";
            statusMsg.style.color = "red";
            return;
        }

        const email = emailInput.value;
        const password = passInput.value;

        if (!email || !password) {
            statusMsg.innerText = "Заполните поля";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.innerText = "Вход...";
        statusMsg.style.color = "yellow";

        try {
            // Запоминаем вход
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            // Дальше сработает onAuthStateChanged выше
        } catch (error) {
            statusMsg.innerText = "Ошибка: " + error.message;
            statusMsg.style.color = "red";
        }
    });
}