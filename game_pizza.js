import * as THREE from 'three';

let camera, scene, renderer, player;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let joystickVector = { x: 0, y: 0 };
let isJumping = false;
let verticalVelocity = 0;

export function startGame(gameType) {
    const container = document.getElementById('gameContainer');
    container.style.display = 'block';

    // --- 1. СЦЕНА ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Небо

    // --- 2. КАМЕРА ---
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);

    // --- 3. РЕНДЕРЕР ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // --- 4. СВЕТ ---
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    light.castShadow = true;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // --- 5. МИР (ПИЦЦЕРИЯ) ---
    createPizzaPlace();

    // --- 6. ИГРОК ---
    const playerGeo = new THREE.BoxGeometry(1, 2, 1); // Высокий кубик
    const playerMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1;
    player.castShadow = true;
    scene.add(player);

    // --- 7. УПРАВЛЕНИЕ (ДЖОЙСТИК) ---
    setupJoystick();
    
    // --- 8. КНОПКА ПРЫЖКА ---
    document.getElementById('jumpBtn').addEventListener('touchstart', () => {
        if (player.position.y <= 1.1) {
            verticalVelocity = 0.3;
            isJumping = true;
        }
    });

    // --- 9. ВЫХОД ---
    document.getElementById('exitGameBtn').addEventListener('click', () => {
        container.style.display = 'none';
        // Очистка (можно добавить позже)
    });

    animate();
}

function createPizzaPlace() {
    // Трава
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshPhongMaterial({ color: 0x228b22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Пол пиццерии
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.2, 20),
        new THREE.MeshPhongMaterial({ color: 0xaaaaaa }) // Серый кафель
    );
    floor.position.y = 0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Стены (Группа)
    const walls = new THREE.Group();
    
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 1), new THREE.MeshPhongMaterial({color: 0xffaa00}));
    backWall.position.set(0, 3, -10);
    walls.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 20), new THREE.MeshPhongMaterial({color: 0xffaa00}));
    leftWall.position.set(-10, 3, 0);
    walls.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 20), new THREE.MeshPhongMaterial({color: 0xffaa00}));
    rightWall.position.set(10, 3, 0);
    walls.add(rightWall);

    scene.add(walls);

    // Печи (Черные ящики)
    const oven = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), new THREE.MeshPhongMaterial({color: 0x333333}));
    oven.position.set(0, 1.5, -8);
    scene.add(oven);
    
    // Огонь в печи
    const fire = new THREE.PointLight(0xff4500, 5, 10);
    fire.position.set(0, 1.5, -7);
    scene.add(fire);

    // Столы
    for(let i=-5; i<=5; i+=5) {
        const table = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.5), new THREE.MeshPhongMaterial({color: 0x8B4513}));
        table.position.set(i, 0.75, 0);
        scene.add(table);
    }
}

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

        // Ограничиваем круг
        const distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
        const maxDist = 35;
        if(distance > maxDist) {
            deltaX = (deltaX / distance) * maxDist;
            deltaY = (deltaY / distance) * maxDist;
        }

        knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        // Нормализуем вектор (от -1 до 1)
        joystickVector.x = deltaX / maxDist;
        joystickVector.y = deltaY / maxDist;
    });

    zone.addEventListener('touchend', () => {
        knob.style.transform = `translate(-50%, -50%)`;
        joystickVector.x = 0;
        joystickVector.y = 0;
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Движение
    const speed = 0.15;
    player.position.x += joystickVector.x * speed;
    player.position.z += joystickVector.y * speed;

    // Гравитация и Прыжок
    if (player.position.y > 1) {
        verticalVelocity -= 0.015; // Гравитация
    } else if (!isJumping) {
        verticalVelocity = 0;
        player.position.y = 1;
    }
    
    player.position.y += verticalVelocity;
    if (player.position.y <= 1) {
        player.position.y = 1;
        isJumping = false;
    }

    // Камера следит за игроком
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10;
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}