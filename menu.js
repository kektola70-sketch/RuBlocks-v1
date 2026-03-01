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

// Основные переменные
let currentUser = null;
let myUserData = null;
let currentLang = localStorage.getItem('rublocks_lang') || 'ru';
let activeChatId = null;
let activeChatUnsub = null;
let currentChatIsGroup = false;
let currentCallId = null; // ID активного звонка

// UI Elements
const myUsername = document.getElementById('myUsername');
const myUserId = document.getElementById('myUserId');
const myAvatar = document.getElementById('myAvatar');
const friendsContainer = document.getElementById('friendsContainer');

// Call & Game UI
const incomingCallOverlay = document.getElementById('incomingCallOverlay');
const callerAvatar = document.getElementById('callerAvatar');
const callerName = document.getElementById('callerName');
const callStatusText = document.getElementById('callStatusText');
const answerCallBtn = document.getElementById('answerCallBtn');
const rejectCallBtn = document.getElementById('rejectCallBtn');

const gameSelectorOverlay = document.getElementById('gameSelectorOverlay');
const closeGameSelector = document.getElementById('closeGameSelector');
const playTogetherBtn = document.getElementById('playTogetherBtn');
const playSoloBtn = document.getElementById('playSoloBtn');
const selectedGameText = document.getElementById('selectedGameText');
const gameCards = document.querySelectorAll('.game-card');

// Chat UI
const chatListModal = document.getElementById('chatListModal');
const chatListContainer = document.getElementById('chatListContainer');
const chatRoomModal = document.getElementById('chatRoomModal');
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

// --- INIT ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);
        try {
            let snap = await getDoc(userRef);
            if (!snap.exists()) {
                const newData = { username: user.email.split('@')[0], email: user.email, uid: user.uid, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, isVerified: false };
                await setDoc(userRef, newData); snap = await getDoc(userRef);
            }
            myUserData = snap.data();
            updateProfileUI();
            loadFriends(user.uid);
            listenForChats(user.uid);
            listenForIncomingCalls(user.uid); // СЛУШАЕМ ЗВОНКИ
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

// --- CALLING SYSTEM ---

// 1. Совершить звонок
callActionBtn.addEventListener('click', async () => {
    if (!activeChatId) return;
    
    // Получаем участников чата (исключая себя)
    const chatRef = doc(db, "chats", activeChatId);
    const chatSnap = await getDoc(chatRef);
    const participants = chatSnap.data().participants.filter(id => id !== currentUser.uid);

    if (participants.length === 0) return alert("No one to call!");

    alert("Calling...");
    
    // Создаем документ звонка
    const callDoc = await addDoc(collection(db, "calls"), {
        fromUid: currentUser.uid,
        fromName: myUserData.username,
        fromAvatar: myUserData.avatar,
        toUids: participants, // Кому звоним
        chatId: activeChatId,
        status: "ringing",
        timestamp: Date.now()
    });
    
    currentCallId = callDoc.id;
    // Сразу открываем выбор игры (как хост)
    showGameSelector();
});

// 2. Слушать входящие звонки
function listenForIncomingCalls(uid) {
    const q = query(collection(db, "calls"), where("toUids", "array-contains", uid), where("status", "==", "ringing"));
    
    onSnapshot(q, (snap) => {
        if (!snap.empty) {
            // Берем первый звонок
            const callData = snap.docs[0].data();
            currentCallId = snap.docs[0].id;
            
            // Показываем экран звонка
            incomingCallOverlay.style.display = "flex";
            callerName.innerText = callData.fromName;
            callerAvatar.src = callData.fromAvatar;
            callStatusText.innerText = "Incoming Call...";
        } else {
            incomingCallOverlay.style.display = "none";
        }
    });
}

// 3. Ответить на звонок
answerCallBtn.addEventListener('click', async () => {
    incomingCallOverlay.style.display = "none";
    // Обновляем статус звонка
    await updateDoc(doc(db, "calls", currentCallId), { status: "accepted" });
    // Открываем выбор игры
    showGameSelector();
});

// 4. Сбросить звонок
rejectCallBtn.addEventListener('click', async () => {
    incomingCallOverlay.style.display = "none";
    await updateDoc(doc(db, "calls", currentCallId), { status: "rejected" });
});


// --- GAME SELECTION ---

function showGameSelector() {
    gameSelectorOverlay.style.display = "flex";
    playTogetherBtn.disabled = true;
    selectedGameText.innerText = "Select a game...";
    
    // Сброс выделения
    gameCards.forEach(c => c.classList.remove('selected'));
    
    // Слушаем изменения в документе звонка (чтобы видеть выбор друга)
    if(currentCallId) {
        onSnapshot(doc(db, "calls", currentCallId), (snap) => {
            const data = snap.data();
            if(data && data.selectedGame) {
                selectedGameText.innerText = `Selected: ${data.selectedGame}`;
                playTogetherBtn.disabled = false;
                
                // Подсветка
                gameCards.forEach(c => {
                    if(c.dataset.game === data.selectedGame) c.classList.add('selected');
                    else c.classList.remove('selected');
                });
            }
        });
    }
}

// Выбор игры кликом
gameCards.forEach(card => {
    card.addEventListener('click', async () => {
        const game = card.dataset.game;
        
        // Если есть активный звонок, обновляем выбор для всех
        if(currentCallId) {
            await updateDoc(doc(db, "calls", currentCallId), { selectedGame: game });
        } else {
            // Если мы просто открыли меню без звонка (для теста)
            card.classList.add('selected');
            playSoloBtn.disabled = false;
        }
    });
});

closeGameSelector.addEventListener('click', () => {
    gameSelectorOverlay.style.display = "none";
});

// Запуск (Логика-заглушка)
playSoloBtn.addEventListener('click', () => {
    alert("Launching Game in Solo Mode...");
    gameSelectorOverlay.style.display = "none";
});

playTogetherBtn.addEventListener('click', () => {
    alert("Launching Game for EVERYONE in the party!");
    gameSelectorOverlay.style.display = "none";
});


// --- CHAT LOGIC (Стандартная) ---

// 1. Start Private Chat
async function startPrivateChat(friend) {
    const uids = [currentUser.uid, friend.uid].sort();
    const chatId = `${uids[0]}_${uids[1]}`;
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, { type: "private", participants: [currentUser.uid, friend.uid], names: { [currentUser.uid]: myUserData.username, [friend.uid]: friend.username }, avatars: { [currentUser.uid]: myUserData.avatar, [friend.uid]: friend.avatar }, lastMessage: "", timestamp: Date.now() });
    }
    openChatRoom(chatId, friend.username, false);
}

// 2. Open Room
function openChatRoom(chatId, title, isGroup) {
    activeChatId = chatId;
    currentChatIsGroup = isGroup;
    chatRoomTitle.innerText = title;
    
    // Кнопка Party/Call
    callActionBtn.innerText = isGroup ? "🎉 Party" : "📞 Call";
    if(isGroup) callActionBtn.classList.add("party"); else callActionBtn.classList.remove("party");

    chatListModal.style.display = "none";
    newChatModal.classList.add("hidden");
    chatRoomModal.style.display = "flex";
    messagesContainer.innerHTML = "";

    if (activeChatUnsub) activeChatUnsub();
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp", "asc"));
    
    activeChatUnsub = onSnapshot(q, (snap) => {
        messagesContainer.innerHTML = "";
        snap.forEach(doc => {
            const m = doc.data();
            const div = document.createElement('div');
            div.className = `message ${m.senderId === currentUser.uid ? 'sent' : 'received'}`;
            div.innerHTML = (isGroup && m.senderId !== currentUser.uid ? `<span class="msg-author">${m.senderName}</span>` : "") + m.text;
            messagesContainer.appendChild(div);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// 3. Send
sendMessageBtn.addEventListener('click', async () => {
    const text = messageInput.value.trim();
    if (!text || !activeChatId) return;
    messageInput.value = "";
    await addDoc(collection(db, `chats/${activeChatId}/messages`), { text: text, senderId: currentUser.uid, senderName: myUserData.username, timestamp: Date.now() });
    await updateDoc(doc(db, "chats", activeChatId), { lastMessage: text, timestamp: Date.now() });
});

// 4. List Chats
function listenForChats(uid) {
    const q = query(collection(db, "chats"), where("participants", "array-contains", uid), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        chatListContainer.innerHTML = "";
        if(snap.empty) { chatListContainer.innerHTML = "<p style='text-align:center; color:#888; margin-top:20px;'>No active chats</p>"; return; }
        snap.forEach(doc => {
            const c = doc.data();
            const isGroup = c.type === "group";
            let name = "Chat", avatar = "";
            if (isGroup) { name = c.groupName; avatar = "https://cdn-icons-png.flaticon.com/512/166/166258.png"; } 
            else { const otherUid = c.participants.find(id => id !== uid); if(c.names && c.names[otherUid]) { name = c.names[otherUid]; avatar = c.avatars[otherUid]; } else { name = "Unknown"; avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=u"; } }

            const div = document.createElement('div'); div.className = 'chat-item';
            div.innerHTML = `<img src="${avatar}"><div class="chat-details"><h4>${name}</h4><p>${c.lastMessage || "New chat"}</p></div>`;
            div.onclick = () => openChatRoom(doc.id, name, isGroup);
            chatListContainer.appendChild(div);
        });
    });
}

// --- NEW CHAT ---
newChatBtn.addEventListener('click', async () => {
    newChatModal.classList.remove('hidden');
    newChatFriendsList.innerHTML = "Loading...";
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/friends`));
    newChatFriendsList.innerHTML = "";
    if(snap.empty) { newChatFriendsList.innerHTML = "<p>No friends yet</p>"; return; }
    snap.forEach(doc => {
        const f = doc.data();
        const div = document.createElement('div'); div.className = 'friend-select-item';
        div.innerHTML = `<img src="${f.avatar}" width="30" style="border-radius:50%"> ${f.username}`;
        div.onclick = () => startPrivateChat(f);
        newChatFriendsList.appendChild(div);
    });
});
closeNewChatModal.addEventListener('click', () => newChatModal.classList.add('hidden'));

// --- FRIENDS LOAD ---
async function loadFriends(uid) {
    friendsContainer.innerHTML = "";
    const snap = await getDocs(collection(db, `users/${uid}/friends`));
    snap.forEach(doc => {
        const f = doc.data();
        const div = document.createElement('div'); div.className = 'friend-card';
        div.innerHTML = `<img src="${f.avatar}"><span>${f.username}</span>`;
        div.onclick = () => startPrivateChat(f);
        friendsContainer.appendChild(div);
    });
}

// --- NAV ---
const chatFab = document.getElementById('chatFabBtn');
if(chatFab) chatFab.addEventListener('click', () => chatListModal.style.display = "flex");
closeChatListBtn.addEventListener('click', () => chatListModal.style.display = "none");
backToChatList.addEventListener('click', () => { chatRoomModal.style.display = "none"; chatListModal.style.display = "flex"; if (activeChatUnsub) activeChatUnsub(); activeChatId = null; });
// Menu
document.getElementById('moreBtn').addEventListener('click', () => document.getElementById('moreMenuPopup').classList.toggle('active'));
document.getElementById('openSettingsBtn').addEventListener('click', () => document.getElementById('settingsModal').classList.remove('hidden'));
document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(() => window.location.href = "index.html"));
document.getElementById('closeSettings').addEventListener('click', () => document.getElementById('settingsModal').classList.add('hidden'));
document.getElementById('notifBtn').addEventListener('click', () => document.getElementById('notifDropdown').classList.toggle('active'));