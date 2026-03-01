import * as THREE from 'three';

let camera, scene, renderer, player;
let joystickVector = { x: 0, y: 0 };
let isJumping = false;
let verticalVelocity = 0;

export function startGame() {
    const container = document.getElementById('gameContainer');
    container.style.display = 'block';

    // 1. Инициализация сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Голубое небо
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50); // Туман для реалистичности

    // 2. Камера
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 5, 10);

    // 3. Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Тени включены
    container.appendChild(renderer.domElement);

    // 4. Свет
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemiLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // --- ПОСТРОЕНИЕ МИРА ---
    createWorld();

    // --- ИГРОК ---
    player = new THREE.Group();
    
    // Тело
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.5), new THREE.MeshPhongMaterial({color: 0x0000ff}));
    bodyMesh.position.y = 0.75;
    bodyMesh.castShadow = true;
    player.add(bodyMesh);
    
    // Голова
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshPhongMaterial({color: 0xffccaa}));
    headMesh.position.y = 1.8;
    player.add(headMesh);
    
    scene.add(player);

    // --- УПРАВЛЕНИЕ ---
    setupJoystick();
    
    // Прыжок
    document.getElementById('jumpBtn').addEventListener('touchstart', () => {
        if (player.position.y <= 0.1) {
            verticalVelocity = 0.4;
            isJumping = true;
        }
    });

    // Выход
    document.getElementById('exitGameBtn').addEventListener('click', () => {
        container.style.display = 'none';
        // Остановка рендеринга (очистка памяти)
        renderer.dispose();
        container.innerHTML = ""; // Удаляем canvas
        location.reload(); // Перезагружаем страницу для сброса
    });

    animate();
}

function createWorld() {
    // 1. Трава
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0x228b22 }));
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    scene.add(grass);

    // 2. Пол Пиццерии (Кафель - процедурная текстура)
    const floorSize = 30;
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,64,64);
    ctx.fillStyle = '#aaa'; ctx.fillRect(0,0,32,32); ctx.fillRect(32,32,32,32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(floorSize, 0.2, floorSize), new THREE.MeshPhongMaterial({ map: tex }));
    floor.position.y = 0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // 3. Стены (Коробка с дверью)
    const wallMat = new THREE.MeshPhongMaterial({ color: 0xffeebb });
    
    // Задняя
    createWall(0, 4, -15, 30, 8, 1, wallMat);
    // Левая
    createWall(-15, 4, 0, 1, 8, 30, wallMat);
    // Правая
    createWall(15, 4, 0, 1, 8, 30, wallMat);
    // Передняя (с дыркой для двери)
    createWall(-8, 4, 15, 14, 8, 1, wallMat);
    createWall(8, 4, 15, 14, 8, 1, wallMat);
    createWall(0, 7, 15, 6, 2, 1, wallMat); // Над дверью

    // 4. Крыша
    const roof = new THREE.Mesh(new THREE.ConeGeometry(22, 6, 4), new THREE.MeshPhongMaterial({color: 0x8b0000}));
    roof.position.set(0, 11, 0);
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);

    // 5. Мебель
    // Печи
    createWall(-10, 2, -12, 4, 4, 4, new THREE.MeshPhongMaterial({color: 0x333333}));
    const fire = new THREE.PointLight(0xff4500, 5, 8); fire.position.set(-10, 2, -10); scene.add(fire);

    // Столы
    const tableMat = new THREE.MeshPhongMaterial({color: 0x8B4513});
    for(let x of [-8, 8]) {
        for(let z of [0, 8]) {
            const table = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.5), tableMat);
            table.position.set(x, 0.8, z);
            table.castShadow = true;
            scene.add(table);
        }
    }
}

function createWall(x, y, z, w, h, d, material) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
}

// УПРАВЛЕНИЕ ДЖОЙСТИКОМ
function setupJoystick() {
    const zone = document.getElementById('joystickZone');
    const knob = document.getElementById('joystickKnob');
    let startX, startY;

    zone.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });

    zone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        let deltaX = touchX - startX;
        let deltaY = touchY - startY;
        
        const dist = Math.sqrt(deltaX**2 + deltaY**2);
        const max = 35;
        if(dist > max) {
            deltaX = (deltaX / dist) * max;
            deltaY = (deltaY / dist) * max;
        }

        knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        joystickVector.x = deltaX / max;
        joystickVector.y = deltaY / max;
    });

    zone.addEventListener('touchend', () => {
        knob.style.transform = `translate(-50%, -50%)`;
        joystickVector.x = 0; joystickVector.y = 0;
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Движение
    const speed = 0.2;
    if (joystickVector.x !== 0 || joystickVector.y !== 0) {
        player.position.x += joystickVector.x * speed;
        player.position.z += joystickVector.y * speed;
        // Поворот игрока
        player.rotation.y = Math.atan2(-joystickVector.x, -joystickVector.y);
    }

    // Гравитация
    if (player.position.y > 0) {
        verticalVelocity -= 0.02;
    } 
    player.position.y += verticalVelocity;
    
    // Пол
    if (player.position.y < 0) {
        player.position.y = 0;
        isJumping = false;
        verticalVelocity = 0;
    }

    // Камера (Слежение)
    const targetX = player.position.x;
    const targetZ = player.position.z + 15;
    const targetY = player.position.y + 10;
    
    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.z += (targetZ - camera.position.z) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}