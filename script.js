const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w, h, groundY, active = false;
let score = 0, speed = 6;
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
    score = 0; speed = 6; obstacles = [];
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    player = {
        x: w * 0.15, y: groundY - 100, dy: 0, w: 45, h: 95,
        jumps: 2, duck: false,
        color: job === 'hvac' ? '#2ecc71' : '#e74c3c',
        tool: job === 'hvac' ? '🔧' : '🔨'
    };

    clouds = Array.from({length: 5}, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.3, s: 0.5 + Math.random()
    }));

    spawnObstacle();
    loop();
}

function spawnObstacle() {
    if (!active) return;
    const type = Math.random() > 0.4 ? 'van' : 'banner';
    obstacles.push({ x: w + 200, type: type, passed: false });
    setTimeout(spawnObstacle, 1500 + Math.random() * 1500);
}

function drawPro(p) {
    const dH = p.duck ? p.h * 0.6 : p.h;
    const dY = p.duck ? groundY - dH : p.y;
    
    // Legs (Pants)
    ctx.fillStyle = '#2c3e50'; 
    ctx.fillRect(p.x + 5, dY + dH - 30, 15, 30); // Left Leg
    ctx.fillRect(p.x + 25, dY + dH - 30, 15, 30); // Right Leg
    
    // Torso (Shirt)
    ctx.fillStyle = '#ecf0f1'; // White Long Sleeve
    ctx.fillRect(p.x, dY + 25, p.w, dH - 50);
    
    // Suspenders
    ctx.fillStyle = '#34495e';
    ctx.fillRect(p.x + 8, dY + 25, 6, dH - 55);
    ctx.fillRect(p.x + 31, dY + 25, 6, dH - 55);

    // Safety Vest (Over Shirt)
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, dY + 35, p.w, 25);
    ctx.globalAlpha = 1.0;

    // Head & Hard Hat
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(p.x + 12, dY + 5, 22, 22); // Face
    ctx.fillStyle = '#f1c40f'; // Hard Hat
    ctx.beginPath();
    ctx.arc(p.x + 23, dY + 10, 15, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(p.x + 5, dY + 8, p.w - 10, 4); // Brim

    // Tool
    ctx.font = '20px Arial';
    ctx.fillText(p.tool, p.x + p.w - 5, dY + 45);
}

function drawVan(x) {
    // Body (Facing Left)
    ctx.fillStyle = '#34495e';
    ctx.fillRect(x, groundY - 65, 120, 55); // Main box
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x, groundY - 60, 35, 30); // Cab (Front)
    
    // Front Windshield
    ctx.fillStyle = '#81ecec';
    ctx.fillRect(x + 5, groundY - 55, 25, 20);

    // Headlight
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(x + 2, groundY - 25, 5, 0, 7);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x + 25, groundY - 5, 12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 95, groundY - 5, 12, 0, 7); ctx.fill();
}

function drawBanner(x) {
    ctx.fillStyle = '#795548'; // Post
    ctx.fillRect(x + 50, groundY - 140, 6, 80);
    ctx.fillStyle = '#c0392b'; // Red Ad
    ctx.fillRect(x, groundY - 170, 110, 45);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, groundY - 170, 110, 45);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText("SCAM AD", x + 25, groundY - 143);
}

function loop() {
    if (!active) return;
    ctx.clearRect(0,0,w,h);

    // Sky & Environment
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(0,0,w,h);
    
    // Sun
    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(w-80, 80, 40, 0, 7); ctx.fill();

    // Ground
    ctx.fillStyle = '#27ae60'; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(0, groundY, w, 5);

    // Player
    player.dy += 0.8; player.y += player.dy;
    if (player.y > groundY - player.h) { player.y = groundY - player.h; player.dy = 0; player.jumps = 2; }
    drawPro(player);

    // Obstacles
    obstacles.forEach((o, i) => {
        o.x -= speed;
        if (o.type === 'van') {
            drawVan(o.x);
            if (player.x < o.x + 110 && player.x + player.w > o.x && (player.y + player.h) > groundY - 60 && !player.duck) die();
        } else {
            drawBanner(o.x);
            if (player.x < o.x + 110 && player.x + player.w > o.x && !player.duck) die();
        }
        if (o.x < player.x && !o.passed) { o.passed = true; score++; speed += 0.1; }
        if (o.x < -200) obstacles.splice(i, 1);
    });

    document.getElementById('score-ui').innerText = score;
    requestAnimationFrame(loop);
}

function die() {
    active = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('hhero_best', highScore);
    }
    document.getElementById('game-over').style.display = 'flex';
}

window.onkeydown = (e) => {
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -15; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => { if (e.code === 'ArrowDown') player.duck = false; };
