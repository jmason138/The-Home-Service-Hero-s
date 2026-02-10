const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w, h, groundY, active = false;
let score = 0, speed = 7;
let highScore = localStorage.getItem('hhero_best') || 0;
let player, obstacles = [], clouds = [];

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    groundY = h * 0.82;
}
window.onresize = resize;
resize();

document.getElementById('best-ui').innerText = highScore;

function startGame(job) {
    active = true;
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    player = {
        x: w * 0.1, y: groundY - 90, dy: 0, w: 50, h: 90,
        jumps: 2, duck: false,
        color: job === 'hvac' ? '#2ecc71' : '#e74c3c',
        tool: job === 'hvac' ? '🔧' : '🔨'
    };

    clouds = Array.from({length: 5}, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.3, s: 0.5 + Math.random(), r: 30 + Math.random() * 20
    }));

    obstacles = [];
    spawnObstacle();
    loop();
}

function spawnObstacle() {
    if (!active) return;
    const isStar = Math.random() > 0.6;
    const lastX = obstacles.length > 0 ? obstacles[obstacles.length-1].x : w;
    const type = isStar ? 'star' : (Math.random() > 0.5 ? 'van' : 'banner');
    
    obstacles.push({ x: Math.max(w + 400, lastX + 500), type: type, passed: false });
    setTimeout(spawnObstacle, 1500 + Math.random() * 1000);
}

function drawEnvironment() {
    // Sky Gradient
    let skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#e0f7fa');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h);

    // Sun
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath(); ctx.arc(w - 100, 100, 40, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.2)'; ctx.lineWidth = 10;
    for(let i=0; i<8; i++){
        ctx.beginPath(); ctx.moveTo(w-100,100);
        ctx.lineTo(w-100+Math.cos(i)*70, 100+Math.sin(i)*70); ctx.stroke();
    }

    // Grass
    ctx.fillStyle = '#27ae60'; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(0, groundY, w, 10);
}

function drawVan(x) {
    ctx.fillStyle = '#34495e'; ctx.fillRect(x, groundY - 70, 130, 60); // Body
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + 90, groundY - 60, 30, 25); // Window
    // Ladder
    ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 4;
    ctx.strokeRect(x+10, groundY-80, 100, 10);
    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x+25, groundY-5, 15, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x+105, groundY-5, 15, 0, 7); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 10px sans-serif'; ctx.fillText("FAKE PRO", x+15, groundY-35);
}

function drawPlayer(p) {
    const curH = p.duck ? p.h * 0.5 : p.h;
    const curY = p.duck ? groundY - curH : p.y;
    
    // Body / Vest
    ctx.fillStyle = p.color; ctx.fillRect(p.x, curY + 25, p.w, curH - 25);
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(p.x, curY + 45, p.w, 5); // Reflective stripe
    
    // Head & Hard Hat
    ctx.fillStyle = '#ffdbac'; ctx.fillRect(p.x + 10, curY, 30, 30);
    ctx.fillStyle = '#f39c12'; // Hat
    ctx.beginPath(); ctx.arc(p.x + 25, curY + 5, 20, Math.PI, 0); ctx.fill();
    ctx.fillRect(p.x - 2, curY + 2, p.w + 4, 4); // Hat Brim
    
    // Tool icon
    ctx.font = '24px Arial'; ctx.fillText(p.tool, p.x + p.w + 5, curY + 50);
}

function loop() {
    if (!active) return;
    drawEnvironment();

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    clouds.forEach(c => {
        c.x -= c.s; if (c.x < -150) c.x = w + 150;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.arc(c.x+30, c.y-5, c.r*0.8, 0, 7); ctx.fill();
    });

    // Player Physics
    player.dy += 0.8; player.y += player.dy;
    if (player.y > groundY - player.h) { player.y = groundY - player.h; player.dy = 0; player.jumps = 2; }
    drawPlayer(player);

    // Obstacles & Stars
    obstacles.forEach((o, i) => {
        o.x -= speed;
        if (o.type === 'star') {
            ctx.fillStyle = '#f1c40f'; ctx.font = '30px Arial'; ctx.fillText("⭐", o.x, groundY - 110);
            if (player.x < o.x + 30 && player.x + player.w > o.x && player.y < groundY - 70) {
                obstacles.splice(i, 1); score++; speed += 0.1;
            }
        } else if (o.type === 'van') {
            drawVan(o.x);
            if (player.x < o.x + 130 && player.x + player.w > o.x && (player.y + player.h) > groundY - 70 && !player.duck) die();
        } else { // Banner
            ctx.fillStyle = '#c0392b'; ctx.fillRect(o.x, groundY - 160, 140, 40);
            ctx.fillStyle = 'white'; ctx.font = 'bold 12px sans-serif'; ctx.fillText("SCAM AD", o.x+35, groundY - 135);
            if (player.x < o.x + 140 && player.x + player.w > o.x && !player.duck) die();
        }
        if (o.x < -200) obstacles.splice(i, 1);
    });

    document.getElementById('score-ui').innerText = score;
    document.getElementById('speed-ui').innerText = (speed/7).toFixed(1);
    requestAnimationFrame(loop);
}

function die() {
    active = false;
    if (score > highScore) localStorage.setItem('hhero_best', score);
    document.getElementById('game-over').style.display = 'flex';
}

window.onkeydown = (e) => {
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -15; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => { if (e.code === 'ArrowDown') player.duck = false; };
