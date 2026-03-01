import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, 
    collection, getDocs, onSnapshot, query, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// Импорт функции запуска игры
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
let currentCallId = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let isInCall = false;

// UI
const incomingCallScreen = document.getElementById('incomingCallScreen');
const activeCallScreen = document.getElementById('activeCallScreen');
const incCallerName = document.getElementById('incCallerName');
const incCallerAvatar = document.getElementById('incCallerAvatar');
const myCallAvatar = document.getElementById('myCallAvatar');
const otherCallAvatar = document.getElementById('otherCallAvatar');
const otherCallName = document.getElementById('otherCallName');
const playTogetherBtn = document.getElementById('playTogetherBtn');
const remoteAudio = document.getElementById('remoteAudio');

// WEBRTC SERVERS
const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
};

// --- INIT ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        // Загрузка профиля
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data();
        document.getElementById('myUsername').innerText = data.username;
        document.getElementById('myAvatar').src = data.avatar;
        document.getElementById('myUserId').innerText = "@" + user.uid.slice(0,6);
        myCallAvatar.src = data.avatar;

        loadFriends();
        listenForIncomingCalls();
    } else {
        window.location.href = "index.html";
    }
});

async function loadFriends() {
    const c = document.getElementById('friendsContainer');
    c.innerHTML = "";
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/friends`));
    snap.forEach(d => {
        const f = d.data();
        const div = document.createElement('div');
        div.className = 'friend-card';
        div.innerHTML = `<img src="${f.avatar}"><span>${f.username}</span>`;
        // При клике открываем выбор игры/звонка
        div.onclick = () => openGameSelector(f); 
        c.appendChild(div);
    });
}

// --- ВЫБОР ИГРЫ ---
let selectedFriend = null;
const gameSelectorModal = document.getElementById('gameSelectorModal');

function openGameSelector(friend) {
    selectedFriend = friend;
    gameSelectorModal.classList.remove('hidden');
    
    // Если мы в звонке, кнопка "Играть вместе" активна
    if (isInCall) {
        playTogetherBtn.disabled = false;
        playTogetherBtn.innerText = `🎮 Играть с ${friend.username}`;
        playTogetherBtn.style.background = "#00b06f";
    } else {
        playTogetherBtn.disabled = false; // Теперь это кнопка ЗВОНКА
        playTogetherBtn.innerText = `📞 Позвонить ${friend.username}`;
        playTogetherBtn.style.background = "#007bff";
    }
}

// КЛИК ПО "ИГРАТЬ С ДРУГОМ / ПОЗВОНИТЬ"
playTogetherBtn.addEventListener('click', async () => {
    if (isInCall) {
        // ЗАПУСК ИГРЫ ДЛЯ ВСЕХ
        // Отправляем сигнал в документ звонка
        await updateDoc(doc(db, "calls", currentCallId), {
            gameToLaunch: "pizza",
            launchTime: Date.now()
        });
        startGame("pizza"); // Запускаем у себя
        gameSelectorModal.classList.add('hidden');
    } else {
        // НАЧАТЬ ЗВОНОК
        gameSelectorModal.classList.add('hidden');
        startCall(selectedFriend);
    }
});

document.getElementById('playSoloBtn').addEventListener('click', () => {
    startGame("pizza");
    gameSelectorModal.classList.add('hidden');
});

document.getElementById('closeGameSel').addEventListener('click', () => gameSelectorModal.classList.add('hidden'));


// --- СИСТЕМА ЗВОНКОВ (WebRTC) ---

// 1. НАЧАТЬ ЗВОНОК
async function startCall(friend) {
    currentCallId = await addDoc(collection(db, "calls"), {
        callerId: currentUser.uid,
        receiverId: friend.uid,
        callerName: document.getElementById('myUsername').innerText,
        callerAvatar: document.getElementById('myAvatar').src,
        status: "offering" // Звоним
    });

    // Показываем интерфейс звонка
    activeCallScreen.classList.remove('hidden');
    otherCallName.innerText = friend.username;
    otherCallAvatar.src = friend.avatar;
    isInCall = true;

    // Включаем микрофон
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Создаем PeerConnection
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
        if(event.candidate) {
            // Сохраняем кандидаты в подколлекцию
            addDoc(collection(db, `calls/${currentCallId}/callerCandidates`), event.candidate.toJSON());
        }
    };

    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        remoteAudio.srcObject = remoteStream;
    };

    // Создаем Offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    await updateDoc(doc(db, "calls", currentCallId), { offer: { type: offer.type, sdp: offer.sdp } });

    // Слушаем ответ
    onSnapshot(doc(db, "calls", currentCallId), (snapshot) => {
        const data = snapshot.data();
        if(!peerConnection.currentRemoteDescription && data?.answer) {
            const answer = new RTCSessionDescription(data.answer);
            peerConnection.setRemoteDescription(answer);
        }
        // ЕСЛИ ЗАПУСТИЛИ ИГРУ
        if (data?.gameToLaunch) {
            activeCallScreen.classList.add('minimized'); // Свернуть звонок
            startGame(data.gameToLaunch);
        }
        if (data?.status === "ended") hangup();
    });

    // Слушаем кандидаты собеседника
    onSnapshot(collection(db, `calls/${currentCallId}/receiverCandidates`), (snap) => {
        snap.docChanges().forEach(change => {
            if(change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                peerConnection.addIceCandidate(candidate);
            }
        });
    });
}

// 2. СЛУШАТЬ ВХОДЯЩИЕ
function listenForIncomingCalls() {
    const q = query(collection(db, "calls"), where("receiverId", "==", currentUser.uid), where("status", "==", "offering"));
    onSnapshot(q, (snap) => {
        snap.docChanges().forEach(change => {
            if(change.type === "added") {
                const data = change.doc.data();
                currentCallId = change.doc.id;
                // Показываем экран входящего
                incomingCallScreen.classList.remove('hidden');
                incCallerName.innerText = data.callerName;
                incCallerAvatar.src = data.callerAvatar;
            }
        });
    });
}

// 3. ПРИНЯТЬ ЗВОНОК
document.getElementById('btnAnswer').addEventListener('click', async () => {
    incomingCallScreen.classList.add('hidden');
    activeCallScreen.classList.remove('hidden');
    isInCall = true;

    // Включаем микрофон
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
        if(event.candidate) {
            addDoc(collection(db, `calls/${currentCallId}/receiverCandidates`), event.candidate.toJSON());
        }
    };

    peerConnection.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0];
    };

    // Получаем Offer звонящего
    const callSnap = await getDoc(doc(db, "calls", currentCallId));
    const callData = callSnap.data();
    
    otherCallName.innerText = callData.callerName;
    otherCallAvatar.src = callData.callerAvatar;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));

    // Создаем Answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    await updateDoc(doc(db, "calls", currentCallId), { answer: { type: answer.type, sdp: answer.sdp }, status: "connected" });

    // Слушаем кандидаты звонящего
    onSnapshot(collection(db, `calls/${currentCallId}/callerCandidates`), (snap) => {
        snap.docChanges().forEach(change => {
            if(change.type === "added") {
                peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
        });
    });
    
    // Слушаем, не запустили ли игру
    onSnapshot(doc(db, "calls", currentCallId), (s) => {
        if(s.data()?.gameToLaunch) {
            activeCallScreen.classList.add('minimized');
            startGame(s.data().gameToLaunch);
        }
        if(s.data()?.status === "ended") hangup();
    });
});

// 4. ОТКЛОНИТЬ / ЗАВЕРШИТЬ
document.getElementById('btnDecline').addEventListener('click', () => {
    incomingCallScreen.classList.add('hidden');
    // Можно обновить статус в БД
});

document.getElementById('btnHangup').addEventListener('click', () => {
    updateDoc(doc(db, "calls", currentCallId), { status: "ended" });
    hangup();
});

function hangup() {
    if(peerConnection) peerConnection.close();
    if(localStream) localStream.getTracks().forEach(t => t.stop());
    activeCallScreen.classList.add('hidden');
    activeCallScreen.classList.remove('minimized');
    isInCall = false;
    currentCallId = null;
}

// СВЕРНУТЬ / РАЗВЕРНУТЬ
const minBtn = document.getElementById('minimizeCallBtn');
const expBtn = document.getElementById('expandCallBtn');
const activeScreen = document.getElementById('activeCallScreen');

minBtn.addEventListener('click', () => {
    activeScreen.classList.add('minimized');
    document.querySelector('.mini-info').style.display = 'flex';
});

expBtn.addEventListener('click', () => {
    activeScreen.classList.remove('minimized');
    document.querySelector('.mini-info').style.display = 'none';
});

// Микрофон
document.getElementById('toggleMicBtn').addEventListener('click', (e) => {
    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    e.target.style.background = track.enabled ? "#555" : "red";
});