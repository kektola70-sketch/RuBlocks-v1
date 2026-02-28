import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const myAvatar = document.getElementById('myAvatar');
const openSearchBtn = document.getElementById('openSearchBtn');
const searchModal = document.getElementById('searchModal');
const closeModal = document.getElementById('closeModal');
const allPlayersList = document.getElementById('allPlayersList');
const logoutBtn = document.getElementById('logoutBtn');

let currentUserData = null;

// 1. Проверка входа
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                currentUserData = userSnap.data();
                // Обновляем статус на Online
                await updateDoc(userRef, { isOnline: true });
            } else {
                // Создаем профиль
                currentUserData = {
                    username: user.email.split('@')[0],
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                    email: user.email,
                    uid: user.uid,
                    isOnline: true
                };
                await setDoc(userRef, currentUserData);
            }
            
            // Заполняем меню
            myUsername.innerText = currentUserData.username;
            myAvatar.src = currentUserData.avatar;
            
        } catch (error) {
            console.error("Ошибка загрузки профиля:", error);
            alert("Ошибка базы данных: " + error.message);
        }
    } else {
        window.location.href = "index.html";
    }
});

// 2. Открытие окна поиска (С ЗАЩИТОЙ ОТ ПЕРЕЗАГРУЗКИ)
openSearchBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // Запрещаем стандартные действия браузера
    
    // Показываем окно сразу
    searchModal.classList.remove('hidden');
    allPlayersList.innerHTML = '<p style="text-align:center; color:#888;">Загрузка списка...</p>';

    try {
        // Запрос к базе данных
        const querySnapshot = await getDocs(collection(db, "users"));
        
        // Очищаем список перед заполнением
        allPlayersList.innerHTML = ''; 

        if (querySnapshot.empty) {
            allPlayersList.innerHTML = '<p style="text-align:center">Игроков не найдено</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Пропускаем себя
            if(auth.currentUser && data.uid === auth.currentUser.uid) return;

            const statusClass = data.isOnline ? 'online' : 'offline';
            const statusText = data.isOnline ? 'Online' : 'Offline';

            const div = document.createElement('div');
            div.className = 'player-search-card';
            div.innerHTML = `
                <img src="${data.avatar}" alt="ava">
                <div class="player-info">
                    <h4>${data.username}</h4>
                    <div>
                        <span class="status-dot ${statusClass}"></span>
                        <span style="font-size:12px; color:#888;">${statusText}</span>
                    </div>
                </div>
                <button class="add-conn-btn" data-uid="${data.uid}">Add</button>
            `;
            allPlayersList.appendChild(div);
        });

        // Добавляем обработчики на кнопки "Add"
        document.querySelectorAll('.add-conn-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const uid = event.target.getAttribute('data-uid');
                sendRequest(uid);
            });
        });

    } catch (error) {
        console.error(error);
        allPlayersList.innerHTML = `<p style="color:red; text-align:center">Ошибка: ${error.message}</p>`;
        // Если ошибка в правах доступа, мы это увидим здесь, а не перезагрузимся
    }
});

// Закрытие окна
closeModal.addEventListener('click', () => {
    searchModal.classList.add('hidden');
});

// Выход
logoutBtn.addEventListener('click', async () => {
    if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { isOnline: false }); // Ставим Offline
        await signOut(auth);
        window.location.href = "index.html";
    }
});

// Функция отправки запроса
function sendRequest(targetUid) {
    alert("Запрос отправлен игроку: " + targetUid);
}