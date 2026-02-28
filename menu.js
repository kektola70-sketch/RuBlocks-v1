import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Элементы
const myUsername = document.getElementById('myUsername');
const myAvatar = document.getElementById('myAvatar');
const openSearchBtn = document.getElementById('openSearchBtn');
const searchModal = document.getElementById('searchModal');
const closeModal = document.getElementById('closeModal');
const allPlayersList = document.getElementById('allPlayersList');
const logoutBtn = document.getElementById('logoutBtn');

// Главная проверка при загрузке
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Пользователь авторизован
        console.log("User ID:", user.uid);
        
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                // Данные есть - загружаем
                const data = userSnap.data();
                myUsername.innerText = data.username;
                myAvatar.src = data.avatar;
                
                // Ставим онлайн
                await updateDoc(userRef, { isOnline: true });
            } else {
                // Данных нет (первый вход) - создаем
                myUsername.innerText = "Создание профиля...";
                
                const newData = {
                    username: user.email.split('@')[0],
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                    email: user.email,
                    uid: user.uid,
                    isOnline: true
                };
                
                await setDoc(userRef, newData);
                
                // Отображаем
                myUsername.innerText = newData.username;
                myAvatar.src = newData.avatar;
            }

        } catch (error) {
            console.error("CRITICAL ERROR:", error);
            // Выводим ошибку прямо в никнейм, чтобы видеть её на телефоне
            myUsername.innerText = "Ошибка БД: " + error.code;
            myUsername.style.color = "red";
            alert("Ошибка базы данных! Проверь консоль Firebase: " + error.message);
        }

    } else {
        // Пользователя нет - отправляем на вход
        window.location.href = "index.html";
    }
});

// Открытие списка игроков
openSearchBtn.addEventListener('click', async () => {
    searchModal.classList.remove('hidden');
    allPlayersList.innerHTML = '<p style="text-align:center">Загрузка...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        allPlayersList.innerHTML = '';

        if (querySnapshot.empty) {
            allPlayersList.innerHTML = '<p>Нет игроков</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(auth.currentUser && data.uid === auth.currentUser.uid) return;

            const div = document.createElement('div');
            div.className = 'player-search-card';
            div.innerHTML = `
                <img src="${data.avatar}" width="40">
                <div class="player-info">
                    <h4>${data.username}</h4>
                    <span>${data.isOnline ? '🟢 Online' : '⚪ Offline'}</span>
                </div>
                <button class="add-conn-btn">Add</button>
            `;
            allPlayersList.appendChild(div);
        });

    } catch (e) {
        allPlayersList.innerHTML = `<p style="color:red">Ошибка списка: ${e.message}</p>`;
    }
});

closeModal.addEventListener('click', () => {
    searchModal.classList.add('hidden');
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});