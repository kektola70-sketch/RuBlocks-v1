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

// Элементы
const myUsername = document.getElementById('myUsername');
const myUserId = document.getElementById('myUserId');
const myAvatar = document.getElementById('myAvatar');
const verifiedBadge = document.getElementById('verifiedBadge');
const friendsContainer = document.getElementById('friendsContainer');

// Нижнее меню (FAB)
const moreBtn = document.getElementById('moreBtn');
const moreMenuPopup = document.getElementById('moreMenuPopup');
const openSettingsBtn = document.getElementById('openSettingsBtn'); // Кнопка в меню
const logoutBtn = document.getElementById('logoutBtn'); // Кнопка в меню

// Настройки Модалка
const settingsModal = document.getElementById('settingsModal');
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

// --- ЗАГРУЗКА ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        try {
            let snap = await getDoc(userRef);
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
        } catch (e) { console.error(e); }
    } else {
        window.location.href = "index.html";
    }
});

function updateProfileUI() {
    myUsername.innerText = myUserData.username;
    myUserId.innerText = "@" + currentUser.uid.slice(0, 8);
    myAvatar.src = myUserData.avatar;
    if (currentUser.emailVerified) {
        verifiedBadge.style.display = "inline";
        emailStatusText.innerText = "Email подтвержден ✅";
        emailStatusText.style.color = "lime";
        verifyEmailBtn.style.display = "none";
    }
    editNickInput.value = myUserData.username;
    readOnlyId.value = "@" + currentUser.uid.slice(0, 8);
    if(myUserData.birthDate) birthDateInput.value = myUserData.birthDate;
}

async function loadFriends(uid) {
    friendsContainer.innerHTML = "";
    const snap = await getDocs(collection(db, `users/${uid}/friends`));
    snap.forEach(doc => {
        const f = doc.data();
        const div = document.createElement('div');
        div.className = 'friend-card';
        div.innerHTML = `<img src="${f.avatar}"><span>${f.username}</span>`;
        friendsContainer.appendChild(div);
    });
}

// --- УПРАВЛЕНИЕ МЕНЮ (FAB) ---
moreBtn.addEventListener('click', () => {
    moreMenuPopup.classList.toggle('active');
});

// Открыть настройки из нижнего меню
openSettingsBtn.addEventListener('click', () => {
    moreMenuPopup.classList.remove('active'); // Закрыть маленькое меню
    settingsModal.classList.remove('hidden'); // Открыть модалку
});

// Выход из нижнего меню
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});


// --- НАСТРОЙКИ ---
saveNickBtn.addEventListener('click', async () => {
    const newName = editNickInput.value.trim();
    if(newName.length < 3) return alert("Ник короткий");
    await updateDoc(doc(db, "users", currentUser.uid), { username: newName });
    myUserData.username = newName;
    updateProfileUI();
    alert("Ник изменен!");
});
saveDateBtn.addEventListener('click', async () => {
    const date = birthDateInput.value;
    if(!date) return;
    await updateDoc(doc(db, "users", currentUser.uid), { birthDate: date });
    alert("Дата сохранена");
});
verifyEmailBtn.addEventListener('click', () => {
    sendEmailVerification(currentUser)
        .then(() => alert(`Письмо отправлено!`))
        .catch(e => alert(e.message));
});
closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

// --- УВЕДОМЛЕНИЯ ---
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
                    </div>`;
                notifDropdown.appendChild(el);
            });
        } else {
            notifBadge.style.display = "none";
            notifDropdown.innerHTML = '<p class="empty-msg">Нет новых заявок</p>';
        }
    });
}
window.acceptReq = async (reqId, fromId, fromName, fromAvatar) => {
    await setDoc(doc(db, `users/${currentUser.uid}/friends/${fromId}`), { uid: fromId, username: fromName, avatar: fromAvatar });
    await setDoc(doc(db, `users/${fromId}/friends/${currentUser.uid}`), { uid: currentUser.uid, username: myUserData.username, avatar: myUserData.avatar });
    await deleteDoc(doc(db, "friend_requests", reqId));
    loadFriends(currentUser.uid);
};
window.declineReq = async (reqId) => await deleteDoc(doc(db, "friend_requests", reqId));
notifBtn.addEventListener('click', () => notifDropdown.classList.toggle('active'));

// --- ПОИСК ---
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
            <button class="add-conn-btn">Add</button>`;
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