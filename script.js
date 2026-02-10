const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w, h, groundY, active = false;
let score = 0, speed = 7;
let highScore = localStorage.getItem('hhero_best') || 0;
let player, obstacles = [], clouds = [], stars = [];

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
        x: w * 0.12, y: groundY - 100, dy: 0, w: 50, h: 90,
        jumps: 2, duck: false,
        color: job === 'hvac' ? '#2ecc71' : '#e74c3c',
        tool: job === 'hvac' ? '🔧' : '🔨'
    };

    clouds = Array.from({length: 5}, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.3, s: 0.5 + Math.random(), r: 30 + Math.random() * 20
    }));

    obstacles = [];
    stars = [];
    spawnObstacle();
    loop();
}

function spawnObstacle() {
    if (!active) return;
    const isStar = Math.random() > 0.6;
    const lastX = obstacles.length > 0 ? obstacles[obstacles.length-1].x : w;
    const type = isStar ? 'star' : (Math.random() > 0.5 ? 'van' : 'banner');
    
    obstacles.push({ x: Math.max(w + 300, lastX + 450 + (Math.random()*200)), type: type, passed: false });
    
    setTimeout(spawnObstacle, 1400 + Math.random() * 800);
}

function drawSun() {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(w - 100, 100, 45, 0, Math.PI * 2);
    ctx.fill();
    // Sun Rays
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
    ctx.lineWidth = 4;
    for(let i=0; i<12; i++) {
        ctx.beginPath();
        ctx.moveTo(w-100, 100);
        ctx.lineTo(w-100 + Math.cos(i)*80, 100 + Math.sin(i)*80);
        ctx.stroke();
    }
}

function drawDetailedVan(x) {
    // Body
    ctx.fillStyle = '#5d4037'; ctx.fillRect(x, groundY - 70, 140, 60); // Main body
    ctx.fillStyle = '#3e2723'; ctx.fillRect(x + 90, groundY - 60, 40, 30); // Cab window
    // Ladder on top
    ctx.strokeStyle = '#bdc3c7'; ctx.lineWidth = 3;
    ctx.strokeRect(x + 10, groundY - 80, 110, 10);
    for(let i=0; i<6; i++) {
        ctx.beginPath(); ctx.moveTo(x+10+(i*20), groundY-80); ctx.lineTo(x+10+(i*20), groundY-70); ctx.stroke();
    }
    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x+30, groundY-5, 15, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x+110, groundY-5, 15, 0, 7); ctx.fill();
    // Text
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText("FAKE PRO", x+15, groundY-35);
}

function drawPlayer(p) {
    const curH = p.duck ? p.h * 0.5 : p.h;
    const curY = p.duck ? groundY - curH : p.y;
    
    // Body / Work Vest
    ctx.fillStyle = p.color; ctx.fillRect(p.x, curY + 25, p.w, curH - 25);
    // Reflective Stripes
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(p.x, curY + 40, p.w, 8);
    // Head & Hard Hat
    ctx.fillStyle = '#ffdbac'; ctx.fillRect(p.x + 10, curY, 30, 30);
    ctx.fillStyle = '#f39c12'; // Bright Yellow Hat
    ctx.beginPath(); ctx.arc(p.x + 25, curY + 5, 20, Math.PI, 0); ctx.fill();
    ctx.fillRect(p.x, curY + 2, p.w, 5); // Brim
    // Tool
    ctx.font = '30px Arial'; ctx.fillText(p.tool, p.x + p.w, curY + 50);
}

function loop() {
    if (!active) return;
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, w, h); // Sky
    drawSun();

    // Grass
    ctx.fillStyle = '#27ae60'; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(0, groundY, w, 8);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c => {
        c.x -= c.s; if (c.x < -150) c.x = w + 150;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.arc(c.x+30, c.y-10, c.r*1.2, 0, 7); ctx.fill();
    });

    // Player Physics
    player.dy += 0.85; player.y += player.dy;
    if (player.y > groundY - player.h) { player.y = groundY - player.h; player.dy = 0; player.jumps = 2; }
    drawPlayer(player);

    // Obstacles
    obstacles.forEach((o, i) => {
        o.x -= speed;
        if (o.type === 'star') {
            ctx.fillStyle = '#f1c40f'; ctx.font = '35px Arial'; ctx.fillText("⭐", o.x, groundY - 120);
            if (player.x < o.x + 30 && player.x + player.w > o.x && player.y < groundY - 80) {
                obstacles.splice(i, 1); score++; speed += 0.15;
            }
        } 
        else if (o.type === 'van') {
            drawDetailedVan(o.x);
            if (player.x < o.x + 140 && player.x + player.w > o.x && (player.y + player.h) > groundY - 70 && !player.duck) die();
        } 
        else { // Banner
            ctx.fillStyle = '#c0392b'; ctx.fillRect(o.x, groundY - 180, 160, 50);
            ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.strokeRect(o.x, groundY - 180, 160, 50);
            ctx.fillStyle = 'white'; ctx.font = 'bold 16px Arial'; ctx.fillText("⚠️ SCAM AD", o.x + 35, groundY - 150);
            if (player.x < o.x + 160 && player.x + player.w > o.x && !player.duck) die();
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
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -16; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => { if (e.code === 'ArrowDown') player.duck = false; };
