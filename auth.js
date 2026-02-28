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

// 1. ПРИНУДИТЕЛЬНЫЙ ВЫХОД ПРИ ЗАГРУЗКЕ
// Чтобы старые глючные сессии не мешали
signOut(auth).then(() => {
    console.log("Сессия очищена. Ждем действий пользователя.");
}).catch((error) => console.error(error));


// 2. ЛОГИКА РЕГИСТРАЦИИ
regBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;

    // Простая проверка
    if (!email.includes('@')) {
        statusMsg.innerText = "Введите нормальный Email!";
        statusMsg.style.color = "red";
        return;
    }
    if (password.length < 6) {
        statusMsg.innerText = "Пароль должен быть от 6 символов!";
        statusMsg.style.color = "red";
        return;
    }

    statusMsg.innerText = "Создаю аккаунт...";
    statusMsg.style.color = "yellow";

    // Отправляем запрос в Firebase
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // ТОЛЬКО ЗДЕСЬ, КОГДА ВСЁ УСПЕШНО:
            statusMsg.innerText = "Успех! Аккаунт создан.";
            statusMsg.style.color = "lime";
            
            // Ждем 1.5 секунды, чтобы пользователь прочитал сообщение, и перекидываем
            setTimeout(() => {
                window.location.href = "menu.html";
            }, 1500);
        })
        .catch((error) => {
            // ЕСЛИ ОШИБКА - ОСТАЕМСЯ ТУТ И ПИШЕМ ОШИБКУ
            console.error("Ошибка регистрации:", error);
            statusMsg.style.color = "red";
            
            if (error.code === 'auth/email-already-in-use') {
                statusMsg.innerText = "Этот Email уже занят! Попробуй кнопку Вход.";
            } else if (error.code === 'auth/invalid-email') {
                statusMsg.innerText = "Некорректный Email.";
            } else {
                statusMsg.innerText = "Ошибка: " + error.message;
            }
        });
});

// 3. ЛОГИКА ВХОДА
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;

    statusMsg.innerText = "Вхожу...";
    statusMsg.style.color = "yellow";

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // ТОЛЬКО ЗДЕСЬ ПЕРЕХОДИМ
            statusMsg.innerText = "Пароль верный! Загрузка...";
            statusMsg.style.color = "lime";
            
            setTimeout(() => {
                window.location.href = "menu.html";
            }, 1500);
        })
        .catch((error) => {
            console.error("Ошибка входа:", error);
            statusMsg.style.color = "red";
            
            if (error.code === 'auth/invalid-credential') {
                statusMsg.innerText = "Неверная почта или пароль!";
            } else {
                statusMsg.innerText = "Ошибка: " + error.message;
            }
        });
});