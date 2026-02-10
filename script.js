const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- GAME STATE ---
let score = 0;
let highScore = localStorage.getItem('heroHighScore') || 0;
let gameActive = false;
let isGold = false;
let goldTimer = 0;
let selectedJob = 'hvac'; 
let gameSpeed = 7;
let obstacles = [];
let items = [];
let spawnInterval;
let itemInterval;

// Display high score on load
document.getElementById('high-score-display').innerText = `Best: ${Math.floor(highScore)}`;

// --- ASSETS ---
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

const player = {
    x: 600, y: 430, w: 100, h: 100,
    dy: 0, jumpForce: 16, gravity: 0.8, grounded: false
};

// --- GAME LOGIC ---
function startGame(job) {
    selectedJob = job;
    gameActive = true;
    score = 0;
    gameSpeed = 7;
    isGold = false;
    obstacles = [];
    items = [];
    document.getElementById('menu-overlay').style.display = 'none';
    
    if(spawnInterval) clearInterval(spawnInterval);
    if(itemInterval) clearInterval(itemInterval);
    
    spawnInterval = setInterval(spawnObstacle, 1600);
    itemInterval = setInterval(spawnItem, 5000); // Items every 5 seconds
    
    update();
}

function spawnObstacle() {
    if (!gameActive) return;
    const types = ['van', 'cone', 'crack', 'barricade', 'lowbid'];
    const type = types[Math.floor(Math.random() * types.length)];
    let w = 60, h = 60;
    if(type === 'van') { w = 150; h = 100; }
    if(type === 'crack') { w = 80; h = 20; }
    obstacles.push({ x: -200, y: 530 - h, w, h, type });
}

function spawnItem() {
    if (!gameActive) return;
    const type = Math.random() > 0.5 ? 'energy' : 'coffee';
    items.push({ x: -100, y: 300, w: 50, h: 50, type });
}

function update() {
    if (!gameActive) return;

    // Physics & Speed Increase
    player.dy += player.gravity;
    player.y += player.dy;
    gameSpeed += 0.001; // Gradually gets harder

    if (player.y > 430) {
        player.y = 430; player.dy = 0; player.grounded = true;
    }

    // Power-up Timer
    if (isGold) {
        goldTimer--;
        if (goldTimer <= 0) isGold = false;
    }

    // Obstacle Logic
    obstacles.forEach((obs, index) => {
        obs.x += gameSpeed;
        if (checkCollision(player, obs)) {
            if (!isGold) gameOver();
            else obstacles.splice(index, 1); // Smash through if Gold!
        }
        if (obs.x > canvas.width) obstacles.splice(index, 1);
    });

    // Item Logic
    items.forEach((item, index) => {
        item.x += gameSpeed;
        if (checkCollision(player, item)) {
            if (item.type === 'energy') {
                isGold = true;
                goldTimer = 300; // ~5 seconds at 60fps
            } else {
                score += 50; // Coffee bonus
            }
            items.splice(index, 1);
        }
        if (item.x > canvas.width) items.splice(index, 1);
    });

    score += 0.1;
    draw();
    requestAnimationFrame(update);
}

function checkCollision(p, o) {
    return p.x < o.x + o.w && p.x + p.w > o.x && p.y < o.y + o.h && p.y + p.h > o.y;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

    // Items & Obstacles
    items.forEach(item => ctx.drawImage(images[item.type], item.x, item.y, item.w, item.h));
    obstacles.forEach(obs => ctx.drawImage(images[obs.type], obs.x, obs.y, obs.w, obs.h));

    // Player (Flashes if Gold)
    let charKey = `${selectedJob}_${isGold ? 'gold' : 'normal'}`;
    if (isGold && goldTimer < 60 && goldTimer % 10 < 5) {
        // Flash effect when powerup is ending
    } else {
        ctx.drawImage(images[charKey], player.x, player.y, player.w, player.h);
    }

    // UI
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 40);
    if (isGold) {
        ctx.fillStyle = "#ffcc00";
        ctx.fillText(`GOLD MODE: ${Math.ceil(goldTimer/60)}s`, 20, 70);
    }
}

function gameOver() {
    gameActive = false;
    if (score > highScore) {
        localStorage.setItem('heroHighScore', score);
        alert(`NEW HIGH SCORE: ${Math.floor(score)}!`);
    } else {
        alert(`GAME OVER! Score: ${Math.floor(score)}`);
    }
    location.reload(); 
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.grounded) {
        player.dy = -player.jumpForce;
        player.grounded = false;
    }
});
