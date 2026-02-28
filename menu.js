import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, 
    collection, getDocs, onSnapshot, query, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// UI Элементы
const myUsername = document.getElementById('myUsername');
const myUserId = document.getElementById('myUserId');
const myAvatar = document.getElementById('myAvatar');
const verifiedBadge = document.getElementById('verifiedBadge');
const friendsContainer = document.getElementById('friendsContainer');

// Настройки
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettings = document.getElementById('closeSettings');
const editNickInput = document.getElementById('editNickInput');
const saveNickBtn = document.getElementById('saveNickBtn');
const readOnlyId = document.getElementById('readOnlyId');
const birthDateInput = document.getElementById('birthDateInput');
const saveDateBtn = document.getElementById('saveDateBtn');
const verifyEmailBtn = document.getElementById('verifyEmailBtn');
const emailStatusText = document.getElementById('emailStatusText');

// Уведомления и Поиск
const notifBtn = document.getElementById('notifBtn');
const notifBadge = document.getElementById('notifBadge');
const notifDropdown = document.getElementById('notifDropdown');
const openSearchBtn = document.getElementById('openSearchBtn');
const searchModal = document.getElementById('searchModal');
const closeModal = document.getElementById('closeModal');
const searchResults = document.getElementById('searchResults');
const searchInput = document.getElementById('searchInput');
const searchActionBtn = document.getElementById('searchActionBtn');

let currentUser = null;
let myUserData = null;

// --- 1. ЗАГРУЗКА ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        
        try {
            let snap = await getDoc(userRef);

            // Если профиля нет - создаем
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

            myUserData = snap.data();
            updateProfileUI();
            listenForNotifications(user.uid);
            loadFriends(user.uid);

        } catch (e) {
            console.error("Ошибка загрузки профиля:", e);
        }
    } else {
        window.location.href = "index.html";
    }
});

function updateProfileUI() {
    // Основное инфо
    myUsername.innerText = myUserData.username;
    myUserId.innerText = "@" + currentUser.uid.slice(0, 8); // ID из первых 8 символов UID
    myAvatar.src = myUserData.avatar;

    // Верификация
    if (currentUser.emailVerified) {
        verifiedBadge.style.display = "inline"; // Показываем галочку
        emailStatusText.innerText = "Email подтвержден ✅";
        emailStatusText.style.color = "lime";
        verifyEmailBtn.style.display = "none";
    }

    // Заполняем поля настроек
    editNickInput.value = myUserData.username;
    readOnlyId.value = "@" + currentUser.uid.slice(0, 8);
    if(myUserData.birthDate) birthDateInput.value = myUserData.birthDate;
}

// --- 2. ДРУЗЬЯ (CONNECTIONS) ---
async function loadFriends(uid) {
    friendsContainer.innerHTML = "";
    const friendsRef = collection(db, `users/${uid}/friends`);
    const snap = await getDocs(friendsRef);

    if (snap.empty) {
        // friendsContainer.innerHTML = "<span style='font-size:10px; color:#555;'>Пусто</span>";
        return;
    }

    snap.forEach(doc => {
        const f = doc.data();
        const div = document.createElement('div');
        div.className = 'friend-card';
        div.innerHTML = `
            <img src="${f.avatar}">
            <span>${f.username}</span>
        `;
        friendsContainer.appendChild(div);
    });
}

// --- 3. НАСТРОЙКИ ---
// Смена ника
saveNickBtn.addEventListener('click', async () => {
    const newName = editNickInput.value.trim();
    if(newName.length < 3) return alert("Ник слишком короткий");

    await updateDoc(doc(db, "users", currentUser.uid), { username: newName });
    myUserData.username = newName;
    updateProfileUI();
    alert("Ник изменен!");
});

// Дата рождения
saveDateBtn.addEventListener('click', async () => {
    const date = birthDateInput.value;
    if(!date) return;
    await updateDoc(doc(db, "users", currentUser.uid), { birthDate: date });
    alert("Дата сохранена");
});

// Верификация
verifyEmailBtn.addEventListener('click', () => {
    sendEmailVerification(currentUser)
        .then(() => alert(`Письмо отправлено на ${currentUser.email}. Проверьте почту!`))
        .catch(e => alert(e.message));
});

// Модальное окно настроек
settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

// --- 4. УВЕДОМЛЕНИЯ И ПОИСК (Как в прошлом коде) ---
function listenForNotifications(uid) {
    const q = query(collection(db, "friend_requests"), where("to", "==", uid), where("status", "==", "pending"));
    onSnapshot(q, (snap) => {
        const reqs = [];
        snap.forEach(d => reqs.push({id: d.id, ...d.data()}));
        
        if (reqs.length > 0) {
            notifBadge.style.display = "block";
            notifBadge.innerText = reqs.length;
            notifDropdown.innerHTML = "";
            reqs.forEach(r => {
                const el = document.createElement('div');
                el.className = 'request-item';
                el.innerHTML = `
                    <img src="${r.fromAvatar}">
                    <div style="flex:1; font-size:12px;"><b>${r.fromName}</b><br>хочет в друзья</div>
                    <div class="req-actions">
                        <button class="btn-accept" onclick="acceptReq('${r.id}', '${r.from}', '${r.fromName}', '${r.fromAvatar}')">✔</button>
                        <button class="btn-decline" onclick="declineReq('${r.id}')">✖</button>
                    </div>
                `;
                notifDropdown.appendChild(el);
            });
        } else {
            notifBadge.style.display = "none";
            notifDropdown.innerHTML = '<p class="empty-msg">Нет новых заявок</p>';
        }
    });
}

// Эти функции должны быть глобальными, чтобы работать через onclick="" в HTML строке выше
window.acceptReq = async (reqId, fromId, fromName, fromAvatar) => {
    try {
        await setDoc(doc(db, `users/${currentUser.uid}/friends/${fromId}`), { uid: fromId, username: fromName, avatar: fromAvatar });
        await setDoc(doc(db, `users/${fromId}/friends/${currentUser.uid}`), { uid: currentUser.uid, username: myUserData.username, avatar: myUserData.avatar });
        await deleteDoc(doc(db, "friend_requests", reqId));
        alert("Вы теперь друзья!");
        loadFriends(currentUser.uid); // Обновляем список
    } catch (e) { console.error(e); }
};

window.declineReq = async (reqId) => {
    await deleteDoc(doc(db, "friend_requests", reqId));
};

notifBtn.addEventListener('click', () => notifDropdown.classList.toggle('active'));

// Поиск
openSearchBtn.addEventListener('click', () => searchModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => searchModal.classList.add('hidden'));

searchActionBtn.addEventListener('click', async () => {
    const txt = searchInput.value.toLowerCase();
    searchResults.innerHTML = "Поиск...";
    const snap = await getDocs(collection(db, "users"));
    searchResults.innerHTML = "";
    
    snap.forEach(d => {
        const u = d.data();
        if(u.uid === currentUser.uid) return;
        if(txt && !u.username.toLowerCase().includes(txt)) return;

        const el = document.createElement('div');
        el.className = 'player-search-card';
        el.innerHTML = `
            <img src="${u.avatar}" width="40" style="border-radius:50%">
            <div style="flex:1"><h4>${u.username}</h4></div>
            <button class="add-conn-btn">Add</button>
        `;
        searchResults.appendChild(el);
        el.querySelector('.add-conn-btn').onclick = async (e) => {
            e.target.innerText = "...";
            await addDoc(collection(db, "friend_requests"), {
                from: currentUser.uid, fromName: myUserData.username, fromAvatar: myUserData.avatar,
                to: u.uid, status: "pending"
            });
            e.target.innerText = "Sent";
            e.target.disabled = true;
        };
    });
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(() => window.location.href = "index.html"));