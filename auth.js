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
const regBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const botCheck = document.getElementById('botCheck');
const statusMsg = document.getElementById('status-message');

// --- ЛОГИКА АВТОМАТИЗАЦИИ ---

// Если мы на странице РЕГИСТРАЦИИ (есть кнопка regBtn)
if (regBtn) {
    // 1. Сразу выходим из старого аккаунта, чтобы не мешал
    signOut(auth).then(() => console.log("Сброс сессии для новой регистрации"));
}

// Если мы на странице ВХОДА (есть кнопка loginBtn)
if (loginBtn) {
    // 2. Включаем авто-вход только здесь
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if(statusMsg) {
                statusMsg.innerText = "Аккаунт найден! Входим...";
                statusMsg.style.color = "lime";
            }
            setTimeout(() => window.location.href = "menu.html", 500);
        }
    });
}


// --- ОБРАБОТЧИКИ КНОПОК ---

// 1. Кнопка ВХОД
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        if (!botCheck.checked) {
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
            await setPersistence(auth, browserLocalPersistence); // Запоминаем
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged сработает сам и перекинет
        } catch (error) {
            statusMsg.innerText = "Ошибка: " + error.message;
            statusMsg.style.color = "red";
        }
    });
}

// 2. Кнопка РЕГИСТРАЦИЯ
if (regBtn) {
    regBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passInput.value;

        if (password.length < 6) {
            statusMsg.innerText = "Пароль слишком короткий!";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.innerText = "Создание аккаунта...";
        statusMsg.style.color = "yellow";

        try {
            // Сначала создаем
            await createUserWithEmailAndPassword(auth, email, password);
            
            // Если успешно - пишем и перекидываем ВРУЧНУЮ
            statusMsg.innerText = "Успех! Переход...";
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