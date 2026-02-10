const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');

// GAME ENGINE STATE
let state = {
    active: false,
    score: 0,
    highScore: localStorage.getItem('heroHS') || 0,
    speed: 8,
    isGold: false,
    goldTimer: 0,
    job: 'hvac'
};

document.getElementById('best-score').innerText = `RECORD: ${Math.floor(state.highScore)}`;

// PRO ASSET LOADER
const assets = {};
const sources = {
    bg: 'game_bg.jpg',
    hvac_normal: 'hvac_normal.png', hvac_gold: 'hvac_gold.png',
    roofer_normal: 'roofer_normal.png', roofer_gold: 'roofer_gold.png',
    van: 'van.png', cone: 'obstacle_cone.png', crack: 'obstacle_crack.png',
    barricade: 'obstacle_barricade.png', lowbid: 'obstacle_lowbid.png',
    energy: 'energy_drink.png'
};

Object.keys(sources).forEach(key => {
    assets[key] = new Image();
    assets[key].src = sources[key];
});

const player = { x: 620, y: 435, w: 100, h: 100, dy: 0, jump: 18, grav: 0.85, grounded: false };
let obstacles = [];
let items = [];

function initGame(selectedJob) {
    state.job = selectedJob;
    state.active = true;
    state.score = 0;
    state.speed = 8.5;
    obstacles = [];
    items = [];
    menu.style.display = 'none';
    
    requestAnimationFrame(gameLoop);
    spawnLoop();
}

function spawnLoop() {
    if (!state.active) return;
    
    // Spawn Obstacles from the LEFT (since player faces left)
    const types = ['van', 'cone', 'crack', 'barricade', 'lowbid'];
    const type = types[Math.floor(Math.random() * types.length)];
    let w = 80, h = 80;
    if(type === 'van') { w = 180; h = 110; }
    if(type === 'crack') { w = 100; h = 25; }
    
    obstacles.push({ x: -200, y: 535 - h, w, h, type });

    if(Math.random() > 0.8) {
        items.push({ x: -100, y: 320, w: 50, h: 50, type: 'energy' });
    }

    setTimeout(spawnLoop, Math.max(700, 2200 - (state.speed * 60)));
}

function gameLoop() {
    if (!state.active) return;
    
    // Physics & Difficulty
    player.dy += player.grav;
    player.y += player.dy;
    state.speed += 0.002;

    if (player.y > 435) {
        player.y = 435; player.dy = 0; player.grounded = true;
    }

    if (state.isGold) {
        state.goldTimer--;
        if (state.goldTimer <= 0) state.isGold = false;
    }

    // Collision & Movement
    obstacles.forEach((obs, i) => {
        obs.x += state.speed;
        if (checkCollision(player, obs)) {
            state.isGold ? obstacles.splice(i, 1) : endGame();
        }
        if (obs.x > 850) obstacles.splice(i, 1);
    });

    items.forEach((item, i) => {
        item.x += state.speed;
        if (checkCollision(player, item)) {
            state.isGold = true; state.goldTimer = 350; items.splice(i, 1);
        }
    });

    state.score += 0.1;
    draw();
    requestAnimationFrame(gameLoop);
}

function checkCollision(p, o) {
    const buffer = 20; // Pro padding for fair gameplay
    return p.x + buffer < o.x + o.w && p.x + p.w - buffer > o.x &&
           p.y + buffer < o.y + o.h && p.y + p.h - buffer > o.y;
}

function draw() {
    ctx.clearRect(0, 0, 800, 600);
    if(assets.bg.complete) ctx.drawImage(assets.bg, 0, 0, 800, 600);
    
    obstacles.forEach(o => {
        if(assets[o.type].complete) ctx.drawImage(assets[o.type], o.x, o.y, o.w, o.h);
    });
    
    items.forEach(it => {
        if(assets.energy.complete) ctx.drawImage(assets.energy, it.x, it.y, it.w, it.h);
    });

    const charKey = `${state.job}_${state.isGold ? 'gold' : 'normal'}`;
    if(assets[charKey].complete) ctx.drawImage(assets[charKey], player.x, player.y, player.w, player.h);

    ctx.fillStyle = "white";
    ctx.font = "900 24px Arial";
    ctx.fillText(`DISTANCE: ${Math.floor(state.score)}m`, 30, 50);
}

function endGame() {
    state.active = false;
    if (state.score > state.highScore) localStorage.setItem('heroHS', state.score);
    alert(`GAME OVER\nSCORE: ${Math.floor(state.score)}`);
    location.reload();
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.grounded) {
        player.dy = -player.jump; player.grounded = false;
    }
});
