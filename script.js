const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- GAME SETTINGS ---
let score = 0;
let gameActive = false;
let isGold = false;
let selectedJob = 'hvac'; // Set to 'roofer' to change character
let gameSpeed = 6;

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

Object.keys(imageSources).forEach(key => {
    images[key] = new Image();
    images[key].src = imageSources[key];
});

// --- PLAYER OBJECT (Positioned for Left-Facing Hero) ---
const player = {
    x: 650,        // Placed on the right side
    y: 380,        // Adjusted to sit on the asphalt road
    w: 110,        // Size of your PNG
    h: 110,
    dy: 0,
    jumpForce: 16,
    gravity: 0.8,
    grounded: false
};

let obstacles = [];
let collectibles = [];

// --- SPAWN LOGIC (Coming from the LEFT) ---
function spawnObstacle() {
    const types = ['van', 'cone', 'crack', 'barricade', 'lowbid'];
    const type = types[Math.floor(Math.random() * types.length)];
    let w = 70, h = 70;
    
    if(type === 'van') { w = 150; h = 100; }
    if(type === 'crack') { w = 100; h = 30; }

    // Start at x: -200 so they slide in from the left side
    obstacles.push({ x: -200, y: 480 - h, w, h, type });
}

// --- CORE GAME LOOP ---
function update() {
    if (!gameActive) return;

    // Gravity
    player.dy += player.gravity;
    player.y += player.dy;

    // Ground Collision (Road level)
    if (player.y > 380) {
        player.y = 380;
        player.dy = 0;
        player.grounded = true;
    }

    // Move Obstacles (They move RIGHT now)
    obstacles.forEach((obs, index) => {
        obs.x += gameSpeed; // Positive speed moves them toward the hero

        // Collision Detection
        if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&
            player.y < obs.y + obs.h && player.y + player.h > obs.y) {
            if (!isGold) gameOver();
        }

        // Remove if they go off the right side
        if (obs.x > canvas.width) obstacles.splice(index, 1);
    });

    draw();
    requestAnimationFrame(update);
}

// --- DRAWING ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background
    if (images.bg.complete) {
        ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
    }

    // 2. Draw Player
    let charKey = `${selectedJob}_${isGold ? 'gold' : 'normal'}`;
    if (images[charKey].complete) {
        ctx.drawImage(images[charKey], player.x, player.y, player.w, player.h);
    }

    // 3. Draw Obstacles
    obstacles.forEach(obs => {
        if (images[obs.type].complete) {
            ctx.drawImage(images[obs.type], obs.x, obs.y, obs.w, obs.h);
        }
    });

    // Score UI
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.font = "bold 30px Arial";
    let scoreText = `Distance: ${Math.floor(score++)}m`;
    ctx.strokeText(scoreText, 20, 50);
    ctx.fillText(scoreText, 20, 50);
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
setInterval(spawnObstacle, 1800);
gameActive = true;
update();
