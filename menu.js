
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

// Нижнее меню
const moreBtn = document.getElementById('moreBtn');
const moreMenuPopup = document.getElementById('moreMenuPopup');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Настройки
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const editNickInput = document.getElementById('editNickInput');
const saveNickBtn = document.getElementById('saveNickBtn');
const readOnlyId = document.getElementById('readOnlyId');
const birthDateInput = document.getElementById('birthDateInput');
const saveDateBtn = document.getElementById('saveDateBtn');
const verifyEmailBtn = document.getElementById('verifyEmailBtn');
const emailStatusText = document.getElementById('emailStatusText');
const langSelect = document.getElementById('langSelect');

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
let currentLang = localStorage.getItem('rublocks_lang') || 'ru';

// --- ПЕРЕВОДЫ ---
const translations = {
    ru: {
        settings: "Настройки", logout: "Выйти", connections: "Connections",
        search: "Поиск", searchTitle: "Поиск игроков", noReq: "Нет новых заявок",
        lang: "Язык / Language", nick: "Никнейм", birth: "Дата рождения",
        emailSt: "Статус Email", verify: "Подтвердить почту",
        emailOk: "Email подтвержден ✅", emailNo: "Не подтвержден",
        sent: "Отправлено", req: "хочет в друзья"
    },
    en: {
        settings: "Settings", logout: "Log Out", connections: "Connections",
        search: "Search", searchTitle: "Search Players", noReq: "No new requests",
        lang: "Language", nick: "Nickname", birth: "Birth Date",
        emailSt: "Email Status", verify: "Verify Email",
        emailOk: "Email Verified ✅", emailNo: "Not Verified",
        sent: "Sent", req: "sent friend request"
    }
};

// Функция безопасного перевода (не ломает скрипт, если элемента нет)
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('rublocks_lang', lang);
    const t = translations[lang];

    safeSetText('lblSettings', t.settings);
    safeSetText('lblLogout', t.logout);
    safeSetText('lblConnections', t.connections);
    safeSetText('lblSearch', t.search);
    safeSetText('lblSearchTitle', t.searchTitle);
    safeSetText('lblSettingsTitle', t.settings);
    safeSetText('lblLang', t.lang);
    safeSetText('lblNick', t.nick);
    safeSetText('lblBirth', t.birth);
    safeSetText('lblEmailStatus', t.emailSt);
    
    // Текст внутри "Нет заявок" обновляем только если он виден
    const emptyMsg = document.querySelector('.empty-msg');
    if(emptyMsg) emptyMsg.innerText = t.noReq;

    if(verifyEmailBtn) verifyEmailBtn.innerText = t.verify;
    
    if (currentUser && emailStatusText) {
        emailStatusText.innerText = currentUser.emailVerified ? t.emailOk : t.emailNo;
    }
    
    if(langSelect) langSelect.value = lang;
}

if(langSelect) {
    langSelect.addEventListener('change', (e) => applyLanguage(e.target.value));
}


// --- ГЛАВНАЯ ЗАГРУЗКА ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        
        // Применяем язык сразу
        applyLanguage(currentLang);

        try {
            let snap = await getDoc(userRef);
            
            // Если профиля нет — создаем (автоматическое исправление)
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
            console.error(e);
            alert("Критическая ошибка загрузки: " + e.message);
        }
    } else {
        window.location.href = "index.html";
    }
});

function updateProfileUI() {
    if(!myUserData) return;
    
    myUsername.innerText = myUserData.username;
    myUserId.innerText = "@" + currentUser.uid.slice(0, 8);
    myAvatar.src = myUserData.avatar;
    
    const t = translations[currentLang];

    if (currentUser.emailVerified) {
        verifiedBadge.style.display = "inline";
        emailStatusText.innerText = t.emailOk;
        emailStatusText.style.color = "lime";
        verifyEmailBtn.style.display = "none";
    } else {
        emailStatusText.innerText = t.emailNo;
    }

    editNickInput.value = myUserData.username;
    readOnlyId.value = "@" + currentUser.uid.slice(0, 8);
    if(myUserData.birthDate) birthDateInput.value = myUserData.birthDate;
}

// --- ФУНКЦИИ ---

async function loadFriends(uid) {
    friendsContainer.innerHTML = "";
    try {
        const snap = await getDocs(collection(db, `users/${uid}/friends`));
        snap.forEach(doc => {
            const f = doc.data();
            const div = document.createElement('div');
            div.className = 'friend-card';
            div.innerHTML = `<img src="${f.avatar}"><span>${f.username}</span>`;
            friendsContainer.appendChild(div);
        });
    } catch(e) { console.error("Ошибка друзей", e); }
}

// Управление меню
moreBtn.addEventListener('click', () => moreMenuPopup.classList.toggle('active'));
openSettingsBtn.addEventListener('click', () => {
    moreMenuPopup.classList.remove('active');
    settingsModal.classList.remove('hidden');
});
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

// Настройки
saveNickBtn.addEventListener('click', async () => {
    const newName = editNickInput.value.trim();
    if(newName.length < 3) return alert("Min 3 chars");
    await updateDoc(doc(db, "users", currentUser.uid), { username: newName });
    myUserData.username = newName;
    updateProfileUI();
    alert("Saved!");
});

saveDateBtn.addEventListener('click', async () => {
    const date = birthDateInput.value;
    if(!date) return;
    await updateDoc(doc(db, "users", currentUser.uid), { birthDate: date });
    alert("Saved!");
});

verifyEmailBtn.addEventListener('click', () => {
    sendEmailVerification(currentUser)
        .then(() => alert(`Email sent to ${currentUser.email}`))
        .catch(e => alert(e.message));
});

closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

// Уведомления
function listenForNotifications(uid) {
    const q = query(collection(db, "friend_requests"), where("to", "==", uid), where("status", "==", "pending"));
    onSnapshot(q, (snap) => {
        const reqs = [];
        snap.forEach(d => reqs.push({id: d.id, ...d.data()}));
        
        if (reqs.length > 0) {
            notifBadge.style.display = "block";
            notifBadge.innerText = reqs.length;
            notifDropdown.innerHTML = "";
            const t = translations[currentLang];
            
            reqs.forEach(r => {
                const el = document.createElement('div');
                el.className = 'request-item';
                el.innerHTML = `
                    <img src="${r.fromAvatar}">
                    <div style="flex:1; font-size:12px;"><b>${r.fromName}</b><br>${t.req}</div>
                    <div class="req-actions">
                        <button class="btn-accept" id="acc-${r.id}">✔</button>
                        <button class="btn-decline" id="dec-${r.id}">✖</button>
                    </div>`;
                notifDropdown.appendChild(el);
                
                document.getElementById(`acc-${r.id}`).onclick = () => acceptReq(r);
                document.getElementById(`dec-${r.id}`).onclick = () => declineReq(r.id);
            });
        } else {
            notifBadge.style.display = "none";
            notifDropdown.innerHTML = `<p class="empty-msg">${translations[currentLang].noReq}</p>`;
        }
    });
}

// Принятие/Отклонение
async function acceptReq(r) {
    try {
        await setDoc(doc(db, `users/${currentUser.uid}/friends/${r.from}`), { uid: r.from, username: r.fromName, avatar: r.fromAvatar });
        await setDoc(doc(db, `users/${r.from}/friends/${currentUser.uid}`), { uid: currentUser.uid, username: myUserData.username, avatar: myUserData.avatar });
        await deleteDoc(doc(db, "friend_requests", r.id));
        alert("Success!");
        loadFriends(currentUser.uid);
    } catch (e) { alert(e.message); }
}
async function declineReq(reqId) {
    await deleteDoc(doc(db, "friend_requests", reqId));
}

notifBtn.addEventListener('click', () => notifDropdown.classList.toggle('active'));

// Поиск
openSearchBtn.addEventListener('click', () => searchModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => searchModal.classList.add('hidden'));

searchActionBtn.addEventListener('click', async () => {
    const txt = searchInput.value.toLowerCase();
    searchResults.innerHTML = "...";
    try {
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
    } catch(e) { searchResults.innerText = "Error"; }
});