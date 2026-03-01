import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, 
    collection, getDocs, onSnapshot, query, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// Импорт игры
import { startGame } from "./game_pizza.js";

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

let currentUser = null;

// --- 1. АВТОРИЗАЦИЯ И ЗАГРУЗКА ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        try {
            const userRef = doc(db, "users", user.uid);
            let snap = await getDoc(userRef);

            // Если профиля нет, создаем
            if (!snap.exists()) {
                const newData = {
                    username: user.email.split('@')[0],
                    email: user.email,
                    uid: user.uid,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                    isVerified: false
                };
                await setDoc(userRef, newData);
                snap = await getDoc(userRef);
            }

            const data = snap.data();
            
            // Заполняем UI
            const elUser = document.getElementById('myUsername');
            const elAva = document.getElementById('myAvatar');
            const elId = document.getElementById('myUserId');
            
            if(elUser) elUser.innerText = data.username;
            if(elAva) elAva.src = data.avatar;
            if(elId) elId.innerText = "@" + user.uid.slice(0, 6);

            // Грузим друзей
            loadFriends(user.uid);

        } catch (e) {
            console.error("Ошибка загрузки:", e);
        }
    } else {
        // Если не вошли - на выход
        window.location.href = "index.html";
    }
});

// --- 2. ФУНКЦИЯ ДЛЯ БЕЗОПАСНОГО НАЗНАЧЕНИЯ КНОПОК ---
// Чтобы скрипт не падал, если кнопки еще не прогрузились
function safeClick(id, callback) {
    const el = document.getElementById(id);
    if (el) {
        // Клонируем узел, чтобы убрать старые обработчики (защита от дублей)
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        newEl.addEventListener('click', callback);
    } else {
        console.warn("Кнопка не найдена:", id);
    }
}

// --- 3. НАЗНАЧЕНИЕ ВСЕХ КНОПОК ПОСЛЕ ЗАГРУЗКИ ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Нижнее меню (Три точки)
    safeClick('moreBtn', () => {
        document.getElementById('moreMenuPopup').classList.toggle('active');
    });

    // Настройки
    safeClick('openSettingsBtn', () => {
        document.getElementById('moreMenuPopup').classList.remove('active');
        document.getElementById('settingsModal').classList.remove('hidden');
    });
    safeClick('closeSettings', () => document.getElementById('settingsModal').classList.add('hidden'));

    // Выход
    safeClick('logoutBtn', () => {
        signOut(auth).then(() => window.location.href = "index.html");
    });

    // Поиск
    safeClick('openSearchBtn', () => document.getElementById('searchModal').classList.remove('hidden'));
    safeClick('closeSearch', () => document.getElementById('searchModal').classList.add('hidden'));

    // Логика Поиска
    safeClick('searchActionBtn', async () => {
        const input = document.getElementById('searchInput');
        const list = document.getElementById('searchResults');
        if(!input || !list) return;

        const txt = input.value.toLowerCase();
        list.innerHTML = "Поиск...";
        
        const snap = await getDocs(collection(db, "users"));
        list.innerHTML = "";
        
        snap.forEach(doc => {
            const u = doc.data();
            if(u.uid === currentUser.uid) return;
            if(txt && !u.username.toLowerCase().includes(txt)) return;

            const div = document.createElement('div');
            div.className = 'player-search-card'; // Используем класс из CSS
            div.innerHTML = `
                <img src="${u.avatar}" width="30" style="border-radius:50%">
                <h4 style="margin:0; margin-left:10px; flex:1;">${u.username}</h4>
                <button class="add-conn-btn">Add</button>
            `;
            
            div.querySelector('button').addEventListener('click', async (e) => {
                e.target.innerText = "Sent";
                e.target.disabled = true;
                await addDoc(collection(db, "friend_requests"), {
                    from: currentUser.uid,
                    fromName: document.getElementById('myUsername').innerText, // Берем актуальное имя
                    to: u.uid,
                    status: "pending"
                });
            });
            list.appendChild(div);
        });
    });

    // ЗАПУСК ИГРЫ (Клик по карточке пиццерии)
    safeClick('startPizzaGame', () => {
        document.getElementById('gameSelectorModal').classList.add('hidden');
        startGame(); // Вызываем функцию из game_pizza.js
    });

    safeClick('closeGameSel', () => document.getElementById('gameSelectorModal').classList.add('hidden'));
});

// --- 4. ЗАГРУЗКА ДРУЗЕЙ ---
async function loadFriends(uid) {
    const cont = document.getElementById('friendsContainer');
    if(!cont) return;
    
    cont.innerHTML = "";
    const snap = await getDocs(collection(db, `users/${uid}/friends`));
    
    snap.forEach(doc => {
        const f = doc.data();
        const div = document.createElement('div');
        div.className = 'friend-card';
        div.innerHTML = `<img src="${f.avatar}"><span>${f.username}</span>`;
        
        // При клике на друга - открываем меню выбора игры
        div.addEventListener('click', () => {
            document.getElementById('gameSelectorModal').classList.remove('hidden');
        });
        
        cont.appendChild(div);
    });
}