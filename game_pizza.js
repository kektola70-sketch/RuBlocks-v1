import * as THREE from 'three';

let camera, scene, renderer;
let player, pizzas = [];

export function startGame(gameType) {
    const container = document.getElementById('gameContainer');
    container.style.display = 'block';
    
    // 1. Настройка сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Небо

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 2. Пол (Пиццерия)
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // 3. Игрок (Кубик)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(geometry, material);
    player.position.y = 0.5;
    scene.add(player);

    // 4. Столы (Препятствия)
    const tableGeo = new THREE.CylinderGeometry(1, 1, 1, 32);
    const tableMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(3, 0.5, 3);
    scene.add(table);

    // Анимация
    animate();

    // Управление
    document.addEventListener('keydown', (e) => {
        if(e.key === 'w') player.position.z -= 0.5;
        if(e.key === 's') player.position.z += 0.5;
        if(e.key === 'a') player.position.x -= 0.5;
        if(e.key === 'd') player.position.x += 0.5;
    });

    // Кнопка выхода
    document.getElementById('exitGameBtn').addEventListener('click', () => {
        container.style.display = 'none';
        container.removeChild(renderer.domElement);
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}