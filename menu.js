import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, 
    collection, getDocs, onSnapshot, query, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Твой конфиг Firebase
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
const notifBtn = document.getElementById('notifBtn');
const notifBadge = document.getElementById('notifBadge');
const notifDropdown = document.getElementById('notifDropdown');
const openSearchBtn = document.getElementById('openSearchBtn');
const searchModal = document.getElementById('searchModal');
const closeModal = document.getElementById('closeModal');
const searchResults = document.getElementById('searchResults');
const searchInput = document.getElementById('searchInput');
const searchActionBtn = document.getElementById('searchActionBtn');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;
let myUserData = null;

// --- 1. АВТОРИЗАЦИЯ И ЗАГРУЗКА ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        
        try {
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                myUserData = snap.data();
                myUsername.innerText = myUserData.username;
                myAvatar.src = myUserData.avatar;
                
                // Начинаем слушать уведомления
                listenForNotifications(user.uid);
            }
        } catch (e) {
            console.error("Ошибка загрузки профиля:", e);
        }
    } else {
        // Если не вошли - на выход
        window.location.href = "index.html";
    }
});

// --- 2. КОЛОКОЛЬЧИК (REALTIME) ---
function listenForNotifications(uid) {
    const q = query(
        collection(db, "friend_requests"), 
        where("to", "==", uid),
        where("status", "==", "pending")
    );

    // Слушаем базу данных постоянно
    onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        updateBellUI(requests);
    });
}

// Обновление интерфейса колокольчика
function updateBellUI(requests) {
    if (requests.length > 0) {
        notifBadge.style.display = "block";
        notifBadge.innerText = requests.length;
        notifDropdown.innerHTML = "";
        
        requests.forEach(req => {
            const div = document.createElement('div');
            div.className = 'request-item';
            div.innerHTML = `
                <img src="${req.fromAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown'}">
                <div class="req-info">
                    <b>${req.fromName}</b><br>хочет в друзья
                </div>
                <div class="req-actions">
                    <button class="btn-accept" id="acc-${req.id}">✔</button>
                    <button class="btn-decline" id="dec-${req.id}">✖</button>
                </div>
            `;
            notifDropdown.appendChild(div);

            // Назначаем кнопки
            document.getElementById(`acc-${req.id}`).onclick = () => acceptRequest(req);
            document.getElementById(`dec-${req.id}`).onclick = () => declineRequest(req.id);
        });
    } else {
        notifBadge.style.display = "none";
        notifDropdown.innerHTML = '<p class="empty-msg">Нет новых заявок</p>';
    }
}

// Открытие/закрытие меню колокольчика
notifBtn.addEventListener('click', () => {
    notifDropdown.classList.toggle('active');
});

// --- 3. ЛОГИКА ДРУЗЕЙ ---

// Принять заявку
async function acceptRequest(req) {
    try {
        // 1. Добавляем друга МНЕ
        await setDoc(doc(db, `users/${currentUser.uid}/friends/${req.from}`), {
            uid: req.from,
            username: req.fromName,
            avatar: req.fromAvatar || ""
        });

        // 2. Добавляем МЕНЯ другу
        await setDoc(doc(db, `users/${req.from}/friends/${currentUser.uid}`), {
            uid: currentUser.uid,
            username: myUserData.username,
            avatar: myUserData.avatar
        });

        // 3. Удаляем заявку
        await deleteDoc(doc(db, "friend_requests", req.id));
        alert("Вы теперь друзья!");
        
    } catch (e) {
        console.error(e);
        alert("Ошибка: " + e.message);
    }
}

// Отклонить заявку
async function declineRequest(reqId) {
    try {
        await deleteDoc(doc(db, "friend_requests", reqId));
    } catch (e) {
        console.error(e);
    }
}

// --- 4. ПОИСК И ОТПРАВКА ---

// Открыть поиск
openSearchBtn.addEventListener('click', () => {
    searchModal.classList.remove('hidden');
});

// Закрыть поиск
closeModal.addEventListener('click', () => {
    searchModal.classList.add('hidden');
});

// Кнопка "Найти"
searchActionBtn.addEventListener('click', () => {
    const text = searchInput.value.toLowerCase();
    searchUsers(text);
});

async function searchUsers(filterText) {
    searchResults.innerHTML = '<p style="text-align:center">Поиск...</p>';
    
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        
        searchResults.innerHTML = "";

        if (snapshot.empty) {
            searchResults.innerHTML = "<p style='text-align:center'>Никого нет</p>";
            return;
        }

        let foundCount = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Не показываем себя
            if (data.uid === currentUser.uid) return;

            // Фильтр по имени
            if (filterText && !data.username.toLowerCase().includes(filterText)) return;

            foundCount++;

            const div = document.createElement('div');
            div.className = 'player-search-card';
            div.innerHTML = `
                <img src="${data.avatar}" width="40" style="border-radius:50%">
                <div style="flex:1">
                    <h4>${data.username}</h4>
                </div>
                <button class="add-conn-btn">Add</button>
            `;
            searchResults.appendChild(div);

            // Кнопка Add
            div.querySelector('.add-conn-btn').onclick = (e) => sendFriendRequest(data.uid, data.username, e.target);
        });

        if (foundCount === 0) {
            searchResults.innerHTML = "<p style='text-align:center'>Не найдено</p>";
        }

    } catch (error) {
        console.error(error);
        searchResults.innerText = "Ошибка: " + error.message;
    }
}

// Отправка запроса
async function sendFriendRequest(targetUid, targetName, btn) {
    btn.innerText = "...";
    try {
        await addDoc(collection(db, "friend_requests"), {
            from: currentUser.uid,
            fromName: