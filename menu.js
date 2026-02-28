import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const myUsername = document.getElementById('myUsername');
const myAvatar = document.getElementById('myAvatar');
const openSearchBtn = document.getElementById('openSearchBtn');
const searchModal = document.getElementById('searchModal');
const closeModal = document.getElementById('closeModal');
const allPlayersList = document.getElementById('allPlayersList');
const logoutBtn = document.getElementById('logoutBtn');

// --- ГЛАВНАЯ ПРОВЕРКА МЕНЮ ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Если пользователя нет — ВЫКИДЫВАЕМ НА ВХОД
        window.location.href = "index.html";
        return;
    }

    // Если мы здесь, значит вход выполнен
    console.log("Загрузка профиля для: " + user.uid);
    
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            myUsername.innerText = data.username;
            myAvatar.src = data.avatar;
        } else {
            // Если профиля в базе нет — создаем его
            const newData = {
                username: user.email.split('@')[0],
                email: user.email,
                uid: user.uid,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                isOnline: true
            };
            await setDoc(userRef, newData);
            myUsername.innerText = newData.username;
            myAvatar.src = newData.avatar;
        }
    } catch (e) {
        console.error(e);
        myUsername.innerText = "Ошибка сети/БД";
        myUsername.style.color = "red";
    }
});

// Кнопка ВЫХОДА
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        // После выхода скрипт onAuthStateChanged сам перекинет нас на index.html
        console.log("Вышли");
    });
});

// Открытие списка (упрощено для стабильности)
openSearchBtn.addEventListener('click', async () => {
    searchModal.classList.remove('hidden');
    allPlayersList.innerHTML = "Загрузка...";
    
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        allPlayersList.innerHTML = "";
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(auth.currentUser && data.uid === auth.currentUser.uid) return;
            
            const div = document.createElement('div');
            div.className = 'player-search-card';
            div.innerHTML = `
                <img src="${data.avatar}" width="40">
                <h4>${data.username}</h4>
                <button>Add</button>
            `;
            allPlayersList.appendChild(div);
        });
    } catch(e) {
        allPlayersList.innerText = "Ошибка: " + e.message;
    }
});

closeModal.addEventListener('click', () => searchModal.classList.add('hidden'));