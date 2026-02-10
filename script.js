const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let w, h, groundY, active = false, tick = 0;
let score = 0, level = 1, speed = 8, obstacles = [], player;
let targetCompetitors = 20; 
let passedCompetitors = 0;
let homeX = null;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    groundY = h * 0.85;
}
window.onresize = resize;
resize();

function startGame(job) {
    active = true; score = 0; level = 1; speed = 8;
    passedCompetitors = 0; targetCompetitors = 20;
    obstacles = []; homeX = null;
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    player = { x: 150, y: groundY - 110, dy: 0, w: 60, h: 110, job: job, jumps: 2, duck: false };
    loop();
}

function nextLevel() {
    level++;
    passedCompetitors = 0;
    targetCompetitors = 20 + (level - 1) * 10;
    speed += 1.5;
    obstacles = [];
    homeX = null;
    active = true;
    document.getElementById('victory-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    requestAnimationFrame(loop);
}

function drawHome(x) {
    // Large Beautiful Home
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(x, groundY - 300, 400, 300); // Main body
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); // Roof
    ctx.moveTo(x - 50, groundY - 300); ctx.lineTo(x + 200, groundY - 450); ctx.lineTo(x + 450, groundY - 300); ctx.fill();
    ctx.fillStyle = '#64748b'; ctx.fillRect(x + 50, groundY - 150, 80, 150); // Door
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(x + 200, groundY - 250, 100, 80); // Window
}

function drawCompetitor(o) {
    if(o.type === 'van') {
        ctx.fillStyle = '#334155'; ctx.fillRect(o.x, groundY - 80, 140, 70);
        ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(o.x + 10, groundY - 30, 8, 0, 7); ctx.fill(); // Headlights
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.fillText("LOW-BID PRO", o.x + 20, groundY - 40);
    } else {
        // Waving Scam Banner
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        for(let i=0; i<=120; i+=10) {
            let y = Math.sin(tick*0.2 + (i*0.05)) * 15;
            ctx.lineTo(o.x + i, groundY - 200 + y);
        }
        ctx.lineTo(o.x + 120, groundY - 150); ctx.lineTo(o.x, groundY - 150); ctx.fill();
    }
}

function loop() {
    if (!active) return;
    tick++;
    ctx.clearRect(0,0,w,h);
    
    // Environment
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,w,h); // Deep Pro Background
    ctx.fillStyle = '#334155'; ctx.fillRect(0, groundY, w, h-groundY); // Asphalt Road

    // Spawning Logic
    if (passedCompetitors + obstacles.length < targetCompetitors && Math.random() < 0.015 && homeX === null) {
        obstacles.push({ x: w + 100, type: Math.random() > 0.5 ? 'van' : 'banner', passed: false });
    }

    // Home spawning logic
    if (passedCompetitors >= targetCompetitors && homeX === null) {
        homeX = w + 200;
    }

    // Player Physics
    player.dy += 0.8; player.y += player.dy;
    if (player.y > groundY - player.h) { player.y = groundY - player.h; player.dy = 0; player.jumps = 2; }
    
    // Character Drawing (Improved)
    ctx.fillStyle = player.job === 'hvac' ? '#064e3b' : '#1e3a8a'; // Pants
    ctx.fillRect(player.x + 10, player.y + 60, 40, 50);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(player.x + 5, player.y + 10, 50, 50); // Shirt
    ctx.fillStyle = '#ffdbac'; ctx.fillRect(player.x + 15, player.y - 20, 30, 30); // Head

    // Update obstacles
    obstacles.forEach((o, i) => {
        o.x -= speed;
        drawCompetitor(o);
        if (player.x < o.x + 120 && player.x + player.w > o.x && (player.y + player.h) > groundY - 70) die();
        if (o.x < player.x && !o.passed) { o.passed = true; score++; passedCompetitors++; }
        if (o.x < -200) obstacles.splice(i, 1);
    });

    if (homeX !== null) {
        homeX -= speed;
        drawHome(homeX);
        if (player.x > homeX + 100) win();
    }

    document.getElementById('score-ui').innerText = score;
    document.getElementById('goal-ui').innerText = Math.max(0, targetCompetitors - passedCompetitors);
    requestAnimationFrame(loop);
}

function die() { active = false; document.getElementById('game-over').style.display = 'flex'; }
function win() { 
    active = false; 
    document.getElementById('victory-screen').style.display = 'flex';
    document.getElementById('level-up-text').innerText = `NEXT STOP: LEVEL ${level + 1}`;
}

window.onkeydown = (e) => {
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -16; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => { if (e.code === 'ArrowDown') player.duck = false; };
