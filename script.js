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
        x: w * 0.1, y: groundY - 100, dy: 0, w: 50, h: 100,
        jumps: 2, duck: false,
        color: job === 'hvac' ? '#2ecc71' : '#e74c3c',
        tool: job === 'hvac' ? '🔧' : '🔨'
    };

    clouds = Array.from({length: 5}, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.3, s: 0.4 + Math.random()
    }));

    spawnObstacle();
    requestAnimationFrame(loop);
}

function spawnObstacle() {
    if (!active) return;
    const type = Math.random() > 0.4 ? 'van' : 'banner';
    obstacles.push({ x: w + 200, type: type, passed: false });
    setTimeout(spawnObstacle, 1600 + Math.random() * 1200);
}

function drawPlayer(p) {
    const dH = p.duck ? p.h * 0.6 : p.h;
    const dY = p.duck ? groundY - dH : p.y;
    
    // Pants (Blue Work Pants)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(p.x + 5, dY + dH - 35, 15, 35); // Left leg
    ctx.fillRect(p.x + 30, dY + dH - 35, 15, 35); // Right leg

    // Shirt (Collared Long Sleeve)
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(p.x, dY + 30, p.w, dH - 65);
    
    // Safety Vest + Suspenders
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, dY + 40, p.w, 30);
    ctx.fillStyle = '#34495e'; // Suspenders
    ctx.fillRect(p.x + 8, dY + 30, 6, dH - 65);
    ctx.fillRect(p.x + 36, dY + 30, 6, dH - 65);

    // Head & Hard Hat
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(p.x + 12, dY + 5, 26, 26); // Face
    ctx.fillStyle = '#f1c40f'; // Hat Top
    ctx.beginPath();
    ctx.arc(p.x + 25, dY + 12, 18, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(p.x + 2, dY + 10, p.w - 4, 5); // Brim

    // Floating Tool
    ctx.font = '24px Arial';
    ctx.fillText(p.tool, p.x + p.w + 5, dY + 50);
}

function drawVan(x) {
    // Body (Facing Left)
    ctx.fillStyle = '#34495e'; 
    ctx.fillRect(x + 35, groundY - 70, 100, 60); // Cargo Area
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x, groundY - 60, 40, 50); // Cab (Front)
    
    // Windshield (Light Blue)
    ctx.fillStyle = '#81ecec';
    ctx.fillRect(x + 5, groundY - 55, 30, 20);

    // Grill & Headlight
    ctx.fillStyle = '#bdc3c7'; ctx.fillRect(x, groundY - 30, 5, 15);
    ctx.fillStyle = '#fff9c4'; ctx.beginPath(); ctx.arc(x + 4, groundY - 22, 6, 0, 7); ctx.fill();

    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x + 25, groundY - 5, 14, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 105, groundY - 5, 14, 0, 7); ctx.fill();

    // Text
    ctx.fillStyle = 'white'; ctx.font = 'bold 10px sans-serif'; ctx.fillText("FAKE PRO", x + 45, groundY - 35);
}

function drawAd(x) {
    // Wooden Post
    ctx.fillStyle = '#795548';
    ctx.fillRect(x + 50, groundY - 140, 8, 80);
    
    // Sign Board
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x, groundY - 180, 110, 50);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, groundY - 180, 110, 50);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText("LOW BID SCAM", x + 10, groundY - 150);
}

function loop() {
    if (!active) return;
    ctx.clearRect(0,0,w,h);

    // Environment
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(0,0,w,h); // Sky
    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(w-100, 100, 40, 0, 7); ctx.fill(); // Sun
    ctx.fillStyle = '#27ae60'; ctx.fillRect(0, groundY, w, h-groundY); // Grass
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(0, groundY, w, 8); // Top line

    // Player
    player.dy += 0.8; player.y += player.dy;
    if (player.y > groundY - player.h) { player.y = groundY - player.h; player.dy = 0; player.jumps = 2; }
    drawPlayer(player);

    // Obstacles
    obstacles.forEach((o, i) => {
        o.x -= speed;
        if (o.type === 'van') {
            drawVan(o.x);
            // Hitbox check
            if (player.x < o.x + 130 && player.x + player.w > o.x && (player.y + player.h) > groundY - 60 && !player.duck) die();
        } else {
            drawAd(o.x);
            // Hitbox check
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
