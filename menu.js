import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const searchResults = document.getElementById('searchResults');
const searchInput = document.getElementById('searchInput');
const searchActionBtn = document.getElementById('searchActionBtn');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null; // Тут храним данные о себе

// 1. Проверка входа
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            myUsername.innerText = data.username;
            myAvatar.src = data.avatar;
        } else {
            // Если профиля нет (редкий случай)
            myUsername.innerText = "Player";
        }
    } else {
        window.location.href = "index.html";
    }
});

// 2. Открытие окна поиска
openSearchBtn.addEventListener('click', () => {
    searchModal.classList.remove('hidden');
    loadAllUsers(); // Сразу показываем всех (или можно ждать ввода)
});

// 3. Закрытие окна
closeModal.addEventListener('click', () => {
    searchModal.classList.add('hidden');
});

// 4. Поиск по кнопке
searchActionBtn.addEventListener('click', () => {
    const text = searchInput.value.toLowerCase();
    loadAllUsers(text);
});

// 5. ФУНКЦИЯ ЗАГРУЗКИ ИГРОКОВ
async function loadAllUsers(filterText = "") {
    searchResults.innerHTML = '<p style="text-align:center">Поиск...</p>';
    
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        
        searchResults.innerHTML = ""; // Очищаем

        if (snapshot.empty) {
            searchResults.innerHTML = "<p>Игроков нет</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Не показываем самого себя
            if (data.uid === currentUser.uid) return;

            // Если есть фильтр, проверяем совпадение имени
            if (filterText && !data.username.toLowerCase().includes(filterText)) {
                return;
            }

            // Создаем карточку игрока
            const div = document.createElement('div');
            div.className = 'player-search-card';
            div.innerHTML = `
                <img src="${data.avatar}" width="40" style="border-radius:50%">
                <div class="player-info">
                    <h4>${data.username}</h4>
                    <span style="font-size:12px; color:#aaa;">${data.isOnline ? '🟢 Online' : '⚪ Offline'}</span>
                </div>
                <button class="add-btn" id="btn-${data.uid}">Add</button>
            `;
            
            searchResults.appendChild(div);

            // Добавляем событие на кнопку Add
            const btn = div.querySelector('.add-btn');
            btn.addEventListener('click', () => sendFriendRequest(data.uid, data.username, btn));
        });

    } catch (error) {
        console.error(error);
        searchResults.innerText = "Ошибка поиска: " + error.message;
    }
}

// 6. ФУНКЦИЯ ОТПРАВКИ ЗАПРОСА
async function sendFriendRequest(targetUid, targetName, btnElement) {
    if (!currentUser) return;

    btnElement.innerText = "...";
    btnElement.disabled = true;

    try {
        // Проверяем, не отправляли ли уже (просто проверка, можно усложнить)
        // Пока просто создаем документ в коллекции friend_requests
        
        await addDoc(collection(db, "friend_requests"), {
            from: currentUser.uid,        // Кто отправил (Я)
            fromName: myUsername.innerText, // Моё имя
            to: targetUid,                // Кому отправили
            status: "pending",            // Статус: ожидание
            timestamp: Date.now()
        });

        btnElement.innerText = "Sent"; // Запрос отправлен
        btnElement.style.backgroundColor = "#444"; // Серый цвет

    } catch (error) {
        console.error("Ошибка отправки:", error);
        btnElement.innerText = "Error";
        btnElement.style.backgroundColor = "red";
        alert("Не удалось отправить: " + error.message);
    }
}

// Выход
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});