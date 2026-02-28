import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Элементы UI
const myUsername = document.getElementById('myUsername');
const myAvatar = document.getElementById('myAvatar');
const openSearchBtn = document.getElementById('openSearchBtn');
const searchModal = document.getElementById('searchModal');
const closeModal = document.getElementById('closeModal');
const allPlayersList = document.getElementById('allPlayersList');
const logoutBtn = document.getElementById('logoutBtn');

let currentUserData = null;

// 1. Проверка авторизации
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Пользователь вошел
        console.log("Logged in:", user.uid);
        
        // Проверяем, есть ли данные в базе, если нет - создаем
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            currentUserData = userSnap.data();
            updateStatus(user.uid, true); // Ставим Online
        } else {
            // Создаем профиль новичка
            currentUserData = {
                username: user.email.split('@')[0], // Делаем ник из email
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                email: user.email,
                uid: user.uid,
                isOnline: true
            };
            await setDoc(userRef, currentUserData);
        }

        // Обновляем интерфейс
        myUsername.innerText = currentUserData.username;
        myAvatar.src = currentUserData.avatar;

    } else {
        // Если не вошел - выкидываем на страницу входа
        window.location.href = "index.html";
    }
});

// 2. Функция обновления статуса
async function updateStatus(uid, status) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        isOnline: status
    });
}

// 3. Открытие списка игроков
openSearchBtn.addEventListener('click', async () => {
    searchModal.classList.remove('hidden');
    allPlayersList.innerHTML = '<p style="text-align:center">Загрузка...</p>';
    
    // Получаем всех пользователей из базы
    const querySnapshot = await getDocs(collection(db, "users"));
    allPlayersList.innerHTML = ''; // Очищаем

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Не показываем себя в списке
        if(data.uid === auth.currentUser.uid) return;

        // Определяем статус
        const statusClass = data.isOnline ? 'online' : 'offline';
        const statusText = data.isOnline ? 'Online' : 'Offline';

        // Создаем карточку HTML
        const playerCard = document.createElement('div');
        playerCard.className = 'player-search-card';
        playerCard.innerHTML = `
            <img src="${data.avatar}" alt="ava">
            <div class="player-info">
                <h4>${data.username}</h4>
                <span class="status-dot ${statusClass}"></span>
                <span style="font-size:12px; color:#888;">${statusText}</span>
            </div>
            <button class="add-conn-btn" onclick="sendRequest('${data.uid}')">Add Connection</button>
        `;
        allPlayersList.appendChild(playerCard);
    });
});

// Закрытие окна
closeModal.addEventListener('click', () => {
    searchModal.classList.add('hidden');
});

// Выход из аккаунта
logoutBtn.addEventListener('click', () => {
    updateStatus(auth.currentUser.uid, false).then(() => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        });
    });
});

// Глобальная функция для кнопки (чтобы работала из HTML строки)
window.sendRequest = (targetUid) => {
    alert("Запрос отправлен игроку! (Пока симуляция)");
    // Тут в будущем будет логика записи запроса в базу
};