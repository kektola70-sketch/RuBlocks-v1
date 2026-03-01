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
const goRegisterLink = document.getElementById('goRegister'); // Ссылка "Создать аккаунт"

// ==========================================
// ЛОГИКА СТРАНИЦЫ ВХОДА (index.html)
// ==========================================
if (loginBtn) {
    let autoRedirectTimer = null; // Таймер переадресации

    // 1. АВТО-ВХОД
    onAuthStateChanged(auth, (user) => {
        if (user) {
            statusMsg.innerText = `Привет, ${user.email}! Входим...`;
            statusMsg.style.color = "lime";
            
            // Задержка 1.5 сек, чтобы ты успел нажать "Создать аккаунт", если передумал
            autoRedirectTimer = setTimeout(() => {
                window.location.href = "menu.html";
            }, 1500);
        }
    });

    // 2. ЕСЛИ НАЖАЛИ "СОЗДАТЬ АККАУНТ"
    if (goRegisterLink) {
        goRegisterLink.addEventListener('click', (e) => {
            e.preventDefault(); // Остановить стандартный клик
            
            // Остановить авто-переход в меню
            if (autoRedirectTimer) clearTimeout(autoRedirectTimer);
            
            statusMsg.innerText = "Переход на регистрацию...";
            
            // Выходим из старого аккаунта и идем на регистрацию
            signOut(auth).then(() => {
                window.location.href = "register.html";
            });
        });
    }

    // 3. КНОПКА ВОЙТИ
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
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged сработает сам
        } catch (error) {
            statusMsg.innerText = "Ошибка: " + error.message;
            statusMsg.style.color = "red";
        }
    });
}

// ==========================================
// ЛОГИКА СТРАНИЦЫ РЕГИСТРАЦИИ (register.html)
// ==========================================
if (regBtn) {
    // При заходе сюда - сбрасываем вход
    signOut(auth);

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
            await setPersistence(auth, browserLocalPersistence);
            await createUserWithEmailAndPassword(auth, email, password);
            
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