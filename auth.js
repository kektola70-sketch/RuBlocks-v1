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

// ==========================================
// СТРАНИЦА ВХОДА (index.html)
// ==========================================
if (loginBtn) {
    console.log("Мы на странице Входа. Включаем авто-вход.");

    // 1. АВТО-ПЕРЕАДРЕСАЦИЯ (Работает только здесь!)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Пользователь найден, переходим в меню...");
            if(statusMsg) {
                statusMsg.innerText = "Аккаунт найден! Входим...";
                statusMsg.style.color = "lime";
            }
            setTimeout(() => window.location.href = "menu.html", 500);
        }
    });

    // 2. КНОПКА ВОЙТИ
    loginBtn.addEventListener('click', async () => {
        if (botCheck && !botCheck.checked) {
            statusMsg.innerText = "⛔ Подтвердите, что вы не робот!";
            statusMsg.style.color = "red";
            return;
        }

        const email = emailInput.value;
        const password = passInput.value;

        statusMsg.innerText = "Вход...";
        statusMsg.style.color = "yellow";

        try {
            await setPersistence(auth, browserLocalPersistence); // Запоминаем
            await signInWithEmailAndPassword(auth, email, password);
            // Дальше сработает onAuthStateChanged выше
        } catch (error) {
            statusMsg.innerText = "Ошибка: " + error.message;
            statusMsg.style.color = "red";
        }
    });
}

// ==========================================
// СТРАНИЦА РЕГИСТРАЦИИ (register.html)
// ==========================================
if (regBtn) {
    console.log("Мы на странице Регистрации. Сбрасываем старый вход.");
    
    // 1. ПРИНУДИТЕЛЬНЫЙ ВЫХОД (Чтобы не кидало в меню)
    signOut(auth); 

    // 2. КНОПКА СОЗДАТЬ АККАУНТ
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
            
            // Здесь переходим ВРУЧНУЮ, так как авто-вход отключен на этой странице
            setTimeout(() => {
                window.location.href = "menu.html";
            }, 1000);

        } catch (error) {
            statusMsg.innerText = "Ошибка: " + error.message;
            statusMsg.style.color = "red";
        }
    });
}