const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- GAME SETTINGS ---
let score = 0;
let gameActive = false;
let isGold = false;
let selectedJob = 'hvac'; // Default
let gameSpeed = 5;

// --- IMAGE LOADER ---
const images = {};
const imageSources = {
    hvac_normal: 'hvac_normal.png',
    hvac_gold: 'hvac_gold.png',
    roofer_normal: 'roofer_normal.png',
    roofer_gold: 'roofer_gold.png',
    van: 'van.png',
    cone: 'obstacle_cone.png',
    crack: 'obstacle_crack.png',
    barricade: 'obstacle_barricade.png',
    lowbid: 'obstacle_lowbid.png',
    energy: 'energy_drink.png',
    coffee: 'coffee.png',
    bg: 'game_bg.jpg'
};

// Load all images
Object.keys(imageSources).forEach(key => {
    images[key] = new Image();
    images[key].src = imageSources[key];
});

// --- PLAYER OBJECT ---
const player = {
    x: 50,
    y: 300,
    w: 80,
    h: 80,
    dy: 0,
    jumpForce: 15,
    gravity: 0.8,
    grounded: false
};

// --- ARRAYS FOR ITEMS ---
let obstacles = [];
let collectibles = [];

// --- SPAWN LOGIC ---
function spawnObstacle() {
    const types = ['van', 'cone', 'crack', 'barricade', 'lowbid'];
    const type = types[Math.floor(Math.random() * types.length)];
    let w = 60, h = 60;
    
    if(type === 'van') { w = 120; h = 90; } // Vans are bigger
    if(type === 'crack') { w = 80; h = 20; } // Cracks are flat

    obstacles.push({ x: canvas.width, y: 380 - h, w, h, type });
}

// --- CORE GAME LOOP ---
function update() {
    if (!gameActive) return;

    // Player Gravity
    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y > 300) {
        player.y = 300;
        player.dy = 0;
        player.grounded = true;
    }

    // Move Obstacles
    obstacles.forEach((obs, index) => {
        obs.x -= gameSpeed;
        // Collision Detection
        if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&
            player.y < obs.y + obs.h && player.y + player.h > obs.y) {
            if (!isGold) {
                gameOver();
            }
        }
        if (obs.x + obs.w < 0) obstacles.splice(index, 1);
    });

    draw();
    requestAnimationFrame(update);
}

// --- DRAWING ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background
    ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

    // 2. Draw Player (Logic for Normal vs Gold)
    let charKey = `${selectedJob}_${isGold ? 'gold' : 'normal'}`;
    ctx.drawImage(images[charKey], player.x, player.y, player.w, player.h);

    // 3. Draw Obstacles
    obstacles.forEach(obs => {
        ctx.drawImage(images[obs.type], obs.x, obs.y, obs.w, obs.h);
    });

    // Score
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${Math.floor(score++)}`, 20, 30);
}

// --- INPUTS ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.grounded) {
        player.dy = -player.jumpForce;
        player.grounded = false;
    }
});

function gameOver() {
    gameActive = false;
    alert("The Low Bidder caught you! Game Over.");
    location.reload(); 
}

// Start Game
setInterval(spawnObstacle, 2000);
gameActive = true;
update();
