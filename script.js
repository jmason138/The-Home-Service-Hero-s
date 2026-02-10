const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w, h, groundY, active = false;
let score = 0, speed = 7;
let highScore = localStorage.getItem('hhero_best') || 0;
let player, obstacles = [], clouds = [];

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    groundY = h * 0.85;
}
window.onresize = resize;
resize();

document.getElementById('best-ui').innerText = highScore;

function startGame(job) {
    active = true;
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    player = {
        x: 100, y: groundY - 80, dy: 0, w: 50, h: 80,
        jumps: 2, duck: false,
        color: job === 'hvac' ? '#2ecc71' : '#e74c3c',
        tool: job === 'hvac' ? '🔧' : '🔨'
    };

    clouds = Array.from({length: 6}, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.4,
        s: 0.5 + Math.random()
    }));

    spawnObstacle();
    loop();
}

function spawnObstacle() {
    if (!active) return;
    const type = Math.random() > 0.5 ? 'van' : 'banner';
    const lastX = obstacles.length > 0 ? obstacles[obstacles.length - 1].x : w;
    obstacles.push({ x: Math.max(w + 300, lastX + 500), type: type });
    
    if (obstacles.length > 5) obstacles.shift();
    setTimeout(spawnObstacle, 1500 + Math.random() * 1000);
}

function die() {
    active = false;
    if (score > highScore) localStorage.setItem('hhero_best', score);
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('final-stats').innerText = `You collected ${score} referrals!`;
}

function loop() {
    if (!active) return;

    // Background
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, w, h);
    
    // Parallax Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
        c.x -= c.s;
        if (c.x < -150) c.x = w + 150;
        ctx.beginPath(); ctx.arc(c.x, c.y, 30, 0, 7); ctx.arc(c.x+35, c.y-10, 40, 0, 7); ctx.fill();
    });

    // Ground
    ctx.fillStyle = '#4ade80'; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#3d9970'; ctx.fillRect(0, groundY, w, 10);

    // Physics
    player.dy += 0.8;
    player.y += player.dy;
    if (player.y > groundY - player.h) {
        player.y = groundY - player.h;
        player.dy = 0;
        player.jumps = 2;
    }

    // Draw Player
    const dH = player.duck ? player.h / 2 : player.h;
    const dY = player.duck ? groundY - dH : player.y;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, dY, player.w, dH);
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(player.x - 5, dY, player.w + 10, 10); // Hat
    ctx.fillStyle = 'white'; ctx.font = '24px Arial'; ctx.fillText(player.tool, player.x + 12, dY + 40);

    // Obstacles
    obstacles.forEach(o => {
        o.x -= speed;
        if (o.type === 'van') {
            ctx.fillStyle = '#475569'; ctx.fillRect(o.x, groundY - 60, 120, 60);
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(o.x+25, groundY, 15, 0, 7); ctx.arc(o.x+95, groundY, 15, 0, 7); ctx.fill();
            if (player.x < o.x + 120 && player.x + player.w > o.x && (dY + dH) > groundY - 60) die();
        } else {
            ctx.fillStyle = '#ef4444'; ctx.fillRect(o.x, groundY - 150, 140, 40);
            ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.fillText("⚠️ SCAM PRICE", o.x+15, groundY - 125);
            if (player.x < o.x + 140 && player.x + player.w > o.x && !player.duck) die();
        }
        if (o.x < player.x && !o.passed) { o.passed = true; score++; speed += 0.1; }
    });

    document.getElementById('score-ui').innerText = score;
    document.getElementById('speed-ui').innerText = (speed/7).toFixed(1);
    requestAnimationFrame(loop);
}

// Laptop Controls
window.onkeydown = (e) => {
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -15; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => {
    if (e.code === 'ArrowDown') player.duck = false;
};
