const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w, h, groundY, active = false;
let score = 0, speed = 6;
let highScore = localStorage.getItem('hhero_best') || 0;
let player, obstacles = [], clouds = [];

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    groundY = h * 0.85; // Ground is 85% down the screen
}
window.onresize = resize;
resize();

document.getElementById('best-ui').innerText = highScore;

function startGame(job) {
    active = true;
    score = 0;
    speed = 6;
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    player = {
        x: 80, y: groundY - 50, dy: 0, w: 40, h: 50,
        jumps: 2, duck: false,
        color: job === 'hvac' ? '#2ecc71' : '#e74c3c',
        tool: job === 'hvac' ? '🔧' : '🔨'
    };

    clouds = Array.from({length: 4}, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.3,
        s: 0.3 + Math.random() * 0.5
    }));

    obstacles = [];
    spawnObstacle();
    loop();
}

function spawnObstacle() {
    if (!active) return;
    const type = Math.random() > 0.5 ? 'van' : 'banner';
    const lastX = obstacles.length > 0 ? obstacles[obstacles.length - 1].x : w;
    obstacles.push({ x: Math.max(w + 200, lastX + 400), type: type });
    
    if (obstacles.length > 5) obstacles.shift();
    setTimeout(spawnObstacle, 1800 + Math.random() * 1000);
}

function die() {
    active = false;
    if (score > highScore) localStorage.setItem('hhero_best', score);
    document.getElementById('game-over').style.display = 'flex';
}

function loop() {
    if (!active) return;
    ctx.clearRect(0, 0, w, h);

    // Sky
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, w, h);
    
    // Parallax Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
        c.x -= c.s;
        if (c.x < -100) c.x = w + 100;
        ctx.beginPath(); ctx.arc(c.x, c.y, 20, 0, 7); ctx.arc(c.x+20, c.y-5, 25, 0, 7); ctx.fill();
    });

    // Ground
    ctx.fillStyle = '#4ade80'; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#3d9970'; ctx.fillRect(0, groundY, w, 5);

    // Physics
    player.dy += 0.8;
    player.y += player.dy;
    if (player.y > groundY - player.h) {
        player.y = groundY - player.h;
        player.dy = 0;
        player.jumps = 2;
    }

    // Draw Player
    const dH = player.duck ? player.h * 0.6 : player.h;
    const dY = player.duck ? groundY - dH : player.y;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, dY, player.w, dH);
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(player.x - 2, dY, player.w + 4, 5); // Hat
    ctx.fillStyle = 'white'; ctx.font = '16px Arial'; ctx.fillText(player.tool, player.x + 10, dY + 20);

    // Obstacles
    obstacles.forEach(o => {
        o.x -= speed;
        if (o.type === 'van') {
            ctx.fillStyle = '#475569'; ctx.fillRect(o.x, groundY - 40, 80, 40);
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(o.x+15, groundY, 8, 0, 7); ctx.arc(o.x+65, groundY, 8, 0, 7); ctx.fill();
            if (player.x < o.x + 80 && player.x + player.w > o.x && (dY + dH) > groundY - 40) die();
        } else {
            ctx.fillStyle = '#ef4444'; ctx.fillRect(o.x, groundY - 100, 100, 30);
            ctx.fillStyle = 'white'; ctx.font = 'bold 10px Arial'; ctx.fillText("SCAM PRICE", o.x+10, groundY - 80);
            if (player.x < o.x + 100 && player.x + player.w > o.x && !player.duck) die();
        }
        if (o.x < player.x && !o.passed) { o.passed = true; score++; speed += 0.05; }
    });

    document.getElementById('score-ui').innerText = score;
    document.getElementById('lvl-ui').innerText = Math.floor(speed - 5);
    requestAnimationFrame(loop);
}

// Controls
window.onkeydown = (e) => {
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -14; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => {
    if (e.code === 'ArrowDown') player.duck = false;
};
