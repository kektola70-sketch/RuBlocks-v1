import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, 
    collection, getDocs, onSnapshot, query, where, orderBy 
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

let currentUser = null;
let myUserData = null;
let currentLang = localStorage.getItem('rublocks_lang') || 'ru';
let activeChatId = null;
let activeChatUnsub = null;
let currentChatIsGroup = false;

// UI Elements
const myUsername = document.getElementById('myUsername');
const myUserId = document.getElementById('myUserId');
const myAvatar = document.getElementById('myAvatar');
const friendsContainer = document.getElementById('friendsContainer');

// Chat UI
const chatFabBtn = document.getElementById('chatFabBtn');
const chatListModal = document.getElementById('chatListModal');
const closeChatListBtn = document.getElementById('closeChatListBtn');
const chatListContainer = document.getElementById('chatListContainer');
const chatRoomModal = document.getElementById('chatRoomModal');
const backToChatList = document.getElementById('backToChatList');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatRoomTitle = document.getElementById('chatRoomTitle');
const callActionBtn = document.getElementById('callActionBtn');

// New Chat & Group
const newChatBtn = document.getElementById('newChatBtn');
const newChatModal = document.getElementById('newChatModal');
const closeNewChatModal = document.getElementById('closeNewChatModal');
const newChatFriendsList = document.getElementById('newChatFriendsList');
const createGroupBtn = document.getElementById('createGroupBtn');
const createGroupModal = document.getElementById('createGroupModal');
const closeGroupModal = document.getElementById('closeGroupModal');
const groupFriendsList = document.getElementById('groupFriendsList');
const finishCreateGroupBtn = document.getElementById('finishCreateGroupBtn');
const groupNameInput = document.getElementById('groupNameInput');

const translations = {
    ru: { settings: "Настройки", logout: "Выйти", connections: "Connections", search: "Поиск", searchTitle: "Поиск игроков", noReq: "Нет новых заявок", lang: "Язык", nick: "Ник", birth: "ДР", emailSt: "Email", verify: "Подтвердить", emailOk: "OK ✅", emailNo: "Нет ❌", call: "📞 Позвонить", party: "🎉 Party", calling: "Звонок...", joined: "Вы в Party!" },
    en: { settings: "Settings", logout: "Log Out", connections: "Connections", search: "Search", searchTitle: "Search Players", noReq: "No new requests", lang: "Language", nick: "Nick", birth: "Birth Date", emailSt: "Email", verify: "Verify", emailOk: "OK ✅", emailNo: "No ❌", call: "📞 Call", party: "🎉 Party", calling: "Calling...", joined: "Joined Party!" }
};

function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }
function applyLanguage(lang) {
    currentLang = lang; localStorage.setItem('rublocks_lang', lang);
    const t = translations[lang];
    safeSetText('lblSettings', t.settings); safeSetText('lblConnections', t.connections);
}

// --- MAIN INIT ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        applyLanguage(currentLang);
        try {
            let snap = await getDoc(userRef);
            if (!snap.exists()) {
                const newData = { username: user.email.split('@')[0], email: user.email, uid: user.uid, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, isVerified: false };
                await setDoc(userRef, newData); snap = await getDoc(userRef);
            }
            myUserData = snap.data();
            updateProfileUI();
            loadFriends(user.uid);
            listenForNotifications(user.uid);
            listenForChats(user.uid); // Запуск прослушки чатов
        } catch (e) { console.error(e); }
    } else {
        document.body.innerHTML = `<button onclick="window.location.href='index.html'" style="margin:50px; padding:20px;">Login Again</button>`;
    }
});

function updateProfileUI() {
    myUsername.innerText = myUserData.username;
    myUserId.innerText = "@" + currentUser.uid.slice(0, 8);
    myAvatar.src = myUserData.avatar;
}

// --- FRIENDS & CHAT ---
async function loadFriends(uid) {
    friendsContainer.innerHTML = "";
    const snap = await getDocs(collection(db, `users/${uid}/friends`));
    snap.forEach(doc => {
        const f = doc.data();
        const div = document.createElement('div');
        div.className = 'friend-card';
        div.innerHTML = `<img src="${f.avatar}"><span>${f.username}</span>`;
        div.onclick = () => startPrivateChat(f);
        friendsContainer.appendChild(div);
    });
}

// --- 1. START PRIVATE CHAT ---
async function startPrivateChat(friend) {
    const uids = [currentUser.uid, friend.uid].sort();
    const chatId = `${uids[0]}_${uids[1]}`;

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    // Если чата нет - создаем и сохраняем имена/аватарки
    if (!chatSnap.exists()) {
        await setDoc(chatRef, {
            type: "private",
            participants: [currentUser.uid, friend.uid],
            names: { [currentUser.uid]: myUserData.username, [friend.uid]: friend.username },
            avatars: { [currentUser.uid]: myUserData.avatar, [friend.uid]: friend.avatar },
            lastMessage: "",
            timestamp: Date.now()
        });
    }
    openChatRoom(chatId, friend.username, false);
}

// --- 2. OPEN ROOM ---
function openChatRoom(chatId, title, isGroup) {
    activeChatId = chatId;
    currentChatIsGroup = isGroup;
    chatRoomTitle.innerText = title;
    
    // Закрываем списки
    chatListModal.style.display = "none";
    newChatModal.classList.add("hidden");
    chatRoomModal.style.display = "flex";
    
    // Настройка кнопки звонка
    const t = translations[currentLang];
    callActionBtn.innerText = isGroup ? t.party : t.call;
    if(isGroup) callActionBtn.classList.add("party"); else callActionBtn.classList.remove("party");

    if (activeChatUnsub) activeChatUnsub();
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp", "asc"));
    
    activeChatUnsub = onSnapshot(q, (snap) => {
        messagesContainer.innerHTML = "";
        snap.forEach(doc => {
            const m = doc.data();
            const div = document.createElement('div');
            div.className = `message ${m.senderId === currentUser.uid ? 'sent' : 'received'}`;
            const author = isGroup && m.senderId !== currentUser.uid ? `<span class="msg-author">${m.senderName}</span>` : "";
            div.innerHTML = `${author}${m.text}`;
            messagesContainer.appendChild(div);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// --- 3. SEND MESSAGE ---
sendMessageBtn.addEventListener('click', async () => {
    const text = messageInput.value.trim();
    if (!text || !activeChatId) return;
    messageInput.value = "";
    
    // Отправляем сообщение
    await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        text: text, senderId: currentUser.uid, senderName: myUserData.username, timestamp: Date.now()
    });
    
    // Обновляем список чатов (последнее сообщение)
    await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: text, timestamp: Date.now()
    });
});

// --- 4. DISPLAY CHAT LIST ---
function listenForChats(uid) {
    // Слушаем только чаты, где мы есть
    const q = query(collection(db, "chats"), where("participants", "array-contains", uid), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snap) => {
        chatListContainer.innerHTML = "";
        
        if(snap.empty) {
            chatListContainer.innerHTML = "<p style='text-align:center; color:#888; margin-top:20px;'>No active chats</p>";
            return;
        }

        snap.forEach(doc => {
            const c = doc.data();
            const isGroup = c.type === "group";
            let name = "Chat", avatar = "";

            if (isGroup) {
                name = c.groupName;
                avatar = "https://cdn-icons-png.flaticon.com/512/166/166258.png";
            } else {
                // Ищем собеседника
                const otherUid = c.participants.find(id => id !== uid);
                // Берем имя из сохраненного объекта names
                if(c.names && c.names[otherUid]) {
                    name = c.names[otherUid];
                    avatar = c.avatars[otherUid];
                } else {
                    name = "Unknown";
                    avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=u";
                }
            }

            const div = document.createElement('div');
            div.className = 'chat-item';
            div.innerHTML = `
                <img src="${avatar}">
                <div class="chat-details">
                    <h4>${name}</h4>
                    <p>${c.lastMessage || "New chat"}</p>
                </div>
            `;
            div.onclick = () => openChatRoom(doc.id, name, isGroup);
            chatListContainer.appendChild(div);
        });
    });
}

// --- 5. NEW CHAT BUTTON ---
newChatBtn.addEventListener('click', async () => {
    newChatModal.classList.remove('hidden');
    newChatFriendsList.innerHTML = "Loading...";
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/friends`));
    newChatFriendsList.innerHTML = "";
    
    if(snap.empty) { newChatFriendsList.innerHTML = "<p>No friends yet</p>"; return; }

    snap.forEach(doc => {
        const f = doc.data();
        const div = document.createElement('div');
        div.className = 'friend-select-item';
        div.innerHTML = `<img src="${f.avatar}" width="30" style="border-radius:50%"> ${f.username}`;
        div.onclick = () => startPrivateChat(f);
        newChatFriendsList.appendChild(div);
    });
});
closeNewChatModal.addEventListener('click', () => newChatModal.classList.add('hidden'));

// --- GROUP LOGIC ---
createGroupBtn.addEventListener('click', async () => {
    createGroupModal.classList.remove('hidden');
    groupFriendsList.innerHTML = "Loading...";
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/friends`));
    groupFriendsList.innerHTML = "";
    
    snap.forEach(doc => {
        const f = doc.data();
        const div = document.createElement('div');
        div.className = 'friend-select-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;"><img src="${f.avatar}" width="30" style="border-radius:50%"> ${f.username}</div>
            <input type="checkbox" class="friend-cb" value="${f.uid}">
        `;
        groupFriendsList.appendChild(div);
    });
});

finishCreateGroupBtn.addEventListener('click', async () => {
    const name = groupNameInput.value.trim();
    if (!name) return alert("Enter Name");
    const cbs = document.querySelectorAll('.friend-cb:checked');
    if (cbs.length === 0) return alert("Select friend");
    const parts = [currentUser.uid];
    cbs.forEach(cb => parts.push(cb.value));

    await addDoc(collection(db, "chats"), {
        type: "group", groupName: name, participants: parts, lastMessage: "Group created", timestamp: Date.now()
    });
    createGroupModal.classList.add('hidden');
});
closeGroupModal.addEventListener('click', () => createGroupModal.classList.add('hidden'));


// --- COMMON & NAVIGATION ---
chatFabBtn.addEventListener('click', () => chatListModal.style.display = "flex");
closeChatListBtn.addEventListener('click', () => chatListModal.style.display = "none");
backToChatList.addEventListener('click', () => {
    chatRoomModal.style.display = "none"; chatListModal.style.display = "flex";
    if (activeChatUnsub) activeChatUnsub(); activeChatId = null;
});

// Notifications (Shortened for brevity but functional)
function listenForNotifications(uid) {
    const q = query(collection(db, "friend_requests"), where("to", "==", uid), where("status", "==", "pending"));
    onSnapshot(q, (snap) => {
        const reqs = []; snap.forEach(d => reqs.push({id: d.id, ...d.data()}));
        const badge = document.getElementById('notifBadge');
        if (reqs.length > 0) {
            badge.style.display = "block"; badge.innerText = reqs.length;
            const drop = document.getElementById('notifDropdown'); drop.innerHTML = "";
            reqs.forEach(r => {
                const el = document.createElement('div'); el.className = 'request-item';
                el.innerHTML = `<img src="${r.fromAvatar}"><div>${r.fromName}</div><div class="req-actions"><button id="a${r.id}" class="btn-accept">✔</button></div>`;
                drop.appendChild(el);
                document.getElementById(`a${r.id}`).onclick = async () => {
                    await setDoc(doc(db, `users/${currentUser.uid}/friends/${r.from}`), { uid: r.from, username: r.fromName, avatar: r.fromAvatar });
                    await setDoc(doc(db, `users/${r.from}/friends/${currentUser.uid}`), { uid: currentUser.uid, username: myUserData.username, avatar: myUserData.avatar });
                    await deleteDoc(doc(db, "friend_requests", r.id)); loadFriends(currentUser.uid);
                };
            });
        } else { badge.style.display = "none"; }
    });
}

// Menu Fab
document.getElementById('moreBtn').addEventListener('click', () => document.getElementById('moreMenuPopup').classList.toggle('active'));
document.getElementById('openSettingsBtn').addEventListener('click', () => document.getElementById('settingsModal').classList.remove('hidden'));
document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(() => window.location.href = "index.html"));
document.getElementById('closeSettings').addEventListener('click', () => document.getElementById('settingsModal').classList.add('hidden'));
document.getElementById('notifBtn').addEventListener('click', () => document.getElementById('notifDropdown').classList.toggle('active'));
// Search
document.getElementById('openSearchBtn').addEventListener('click', () => document.getElementById('searchModal').classList.remove('hidden'));
document.getElementById('closeModal').addEventListener('click', () => document.getElementById('searchModal').classList.add('hidden'));
document.getElementById('searchActionBtn').addEventListener('click', async () => {
    const t = document.getElementById('searchInput').value.toLowerCase();
    const res = document.getElementById('searchResults'); res.innerHTML = "...";
    const s = await getDocs(collection(db, "users")); res.innerHTML = "";
    s.forEach(d => {
        const u = d.data(); if(u.uid === currentUser.uid) return;
        if(t && !u.username.toLowerCase().includes(t)) return;
        const d2 = document.createElement('div'); d2.className = 'player-search-card';
        d2.innerHTML = `<img src="${u.avatar}" width="40" style="border-radius:50%"><h4>${u.username}</h4><button class="add-conn-btn">Add</button>`;
        res.appendChild(d2);
        d2.querySelector('button').onclick = async (e) => {
            e.target.innerText = "."; await addDoc(collection(db, "friend_requests"), { from: currentUser.uid, fromName: myUserData.username, fromAvatar: myUserData.avatar, to: u.uid, status: "pending" }); e.target.innerText = "Ok";
        };
    });
});