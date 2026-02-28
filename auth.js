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

const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const regBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const statusMsg = document.getElementById('status-message');

// Проверка: Если мы УЖЕ вошли, переходим в меню
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Пользователь найден, переход в меню...");
        window.location.href = "menu.html";
    }
});

// Регистрация
regBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passInput.value;

    if (password.length < 6) {
        alert("Пароль слишком короткий!");
        return;
    }

    statusMsg.innerText = "Создание аккаунта...";
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // Не нужно вручную делать redirect, сработает onAuthStateChanged выше
        statusMsg.innerText = "Успех! Входим...";
        statusMsg.style.color = "lime";
    } catch (error) {
        statusMsg.innerText = "Ошибка: " + error.message;
        statusMsg.style.color = "red";
    }
});

// Вход
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passInput.value;

    statusMsg.innerText = "Вход...";
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        statusMsg.innerText = "Ошибка входа: " + error.message;
        statusMsg.style.color = "red";
    }
});