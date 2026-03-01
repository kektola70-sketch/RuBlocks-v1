import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

// INIT
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const snap = await getDoc(doc(db, "users", user.uid));
        if(snap.exists()) {
            const data = snap.data();
            document.getElementById('myUsername').innerText = data.username;
            document.getElementById('myAvatar').src = data.avatar;
            document.getElementById('myUserId').innerText = "@" + user.uid.slice(0,6);
            loadFriends(user.uid);
        }
    } else {
        window.location.href = "index.html";
    }
});

// КНОПКИ (Обработчики событий)
const moreBtn = document.getElementById('moreBtn');
const moreMenuPopup = document.getElementById('moreMenuPopup');
const openSearchBtn = document.getElementById('openSearchBtn');
const searchModal = document.getElementById('searchModal');
const closeSearch = document.getElementById('closeSearch');
const searchActionBtn = document.getElementById('searchActionBtn');
const chatFabBtn = document.getElementById('chatFabBtn');
const gameSelectorModal = document.getElementById('gameSelectorModal');
const closeGameSel = document.getElementById('closeGameSel');

// 1. МЕНЮ "ТРИ ТОЧКИ"
if(moreBtn) {
    moreBtn.addEventListener('click', () => {
        moreMenuPopup.classList.toggle('active');
    });
}

// 2. ВЫХОД
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

// 3. ПОИСК
if(openSearchBtn) openSearchBtn.addEventListener('click', () => searchModal.classList.remove('hidden'));
if(closeSearch) closeSearch.addEventListener('click', () => searchModal.classList.add('hidden'));

if(searchActionBtn) {
    searchActionBtn.addEventListener('click', async () => {
        const txt = document.getElementById('searchInput').value.toLowerCase();
        const res = document.getElementById('searchResults');
        res.innerHTML = "Поиск...";
        const snap = await getDocs(collection(db, "users"));
        res.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.uid === currentUser.uid) return;
            if(txt && !u.username.toLowerCase().includes(txt)) return;
            const div = document.createElement('div');
            div.style.background = "#333";
            div.style.padding = "10px";
            div.style.marginBottom = "5px";
            div.innerHTML = `<img src="${u.avatar}" width="30"> ${u.username} <button>Add</button>`;
            div.querySelector('button').onclick = async (e) => {
                e.target.innerText = "Sent";
                await addDoc(collection(db, "friend_requests"), {
                    from: currentUser.uid, fromName: u.username, to: u.uid, status: "pending"
                });
            };
            res.appendChild(div);
        });
    });
}

// 4. ДРУЗЬЯ И ЗАПУСК ИГРЫ
async function loadFriends(uid) {
    const cont = document.getElementById('friendsContainer');
    cont.innerHTML = "";
    const snap = await getDocs(collection(db, `users/${uid}/friends`));
    snap.forEach(d => {
        const f = d.data();
        const div = document.createElement('div');
        div.className = 'friend-card';
        div.innerHTML = `<img src="${f.avatar}"><span>${f.username}</span>`;
        // При клике на друга - открываем меню игр (для теста)
        div.onclick = () => gameSelectorModal.classList.remove('hidden');
        cont.appendChild(div);
    });
}

// 5. ЗАКРЫТИЕ ВЫБОРА ИГРЫ
if(closeGameSel) closeGameSel.addEventListener('click', () => gameSelectorModal.classList.add('hidden'));

// ГЛОБАЛЬНАЯ ФУНКЦИЯ ЗАПУСКА (для HTML onclick)
window.launchGame = (type) => {
    gameSelectorModal.classList.add('hidden');
    startGame(type); // Из game_pizza.js
};