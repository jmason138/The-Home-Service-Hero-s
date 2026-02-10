const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let w, h, groundY, active = false, tick = 0;
let score = 0, level = 1, speed = 8, obstacles = [], player;
let targetNeeded = 20, passedCount = 0, homeX = null;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    groundY = h * 0.85;
}
window.onresize = resize;
resize();

function startGame(job) {
    active = true; score = 0; level = 1; speed = 8;
    passedCount = 0; targetNeeded = 20; obstacles = []; homeX = null;
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    player = { x: 100, y: groundY - 100, dy: 0, w: 50, h: 100, job: job, jumps: 2, duck: false };
    loop();
}

function nextLevel() {
    level++;
    passedCount = 0;
    targetNeeded = 20 + (level * 10);
    speed += 1.5;
    obstacles = []; homeX = null;
    active = true;
    document.getElementById('victory-screen').style.display = 'none';
    requestAnimationFrame(loop);
}

function drawBackground() {
    // Sky
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, w, h);
    // Sun
    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(w - 100, 100, 40, 0, Math.PI * 2); ctx.fill();
    // Clouds
    ctx.fillStyle = 'white';
    [ [200, 150], [w/2, 100], [w-300, 200] ].forEach(p => {
        ctx.beginPath(); ctx.arc(p[0], p[1], 30, 0, 7); ctx.arc(p[0]+30, p[1]-10, 35, 0, 7); ctx.fill();
    });
    // Road
    ctx.fillStyle = '#334155'; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.strokeStyle = 'white'; ctx.setLineDash([20, 20]);
    ctx.beginPath(); ctx.moveTo(0, groundY + 40); ctx.lineTo(w, groundY + 40); ctx.stroke();
    ctx.setLineDash([]);
}

function drawPlayer(p) {
    const dH = p.duck ? p.h * 0.6 : p.h;
    const dY = p.duck ? groundY - dH : p.y;
    
    // Character Layers
    ctx.fillStyle = p.job === 'hvac' ? '#064e3b' : '#1e3a8a'; // Pants
    ctx.fillRect(p.x + 5, dY + dH - 40, 40, 40);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(p.x, dY + 10, 50, 50); // Shirt
    ctx.fillStyle = '#ffdbac'; ctx.fillRect(p.x + 10, dY - 20, 30, 30); // Head
    
    // Hat
    ctx.fillStyle = p.job === 'hvac' ? '#064e3b' : '#f1c40f';
    ctx.fillRect(p.x + 5, dY - 25, 40, 10);
}

function loop() {
    if (!active) return;
    tick++;
    drawBackground();

    // Physics
    player.dy += 0.8; player.y += player.dy;
    if (player.y > groundY - player.h) { player.y = groundY - player.h; player.dy = 0; player.jumps = 2; }
    drawPlayer(player);

    // Spawn Logic
    if (passedCount + obstacles.length < targetNeeded && Math.random() < 0.02 && homeX === null) {
        obstacles.push({ x: w + 100, type: Math.random() > 0.5 ? 'van' : 'ad', passed: false });
    }

    // Win condition home
    if (passedCount >= targetNeeded && homeX === null) homeX = w + 100;

    obstacles.forEach((o, i) => {
        o.x -= speed;
        if (o.type === 'van') {
            ctx.fillStyle = '#1e293b'; ctx.fillRect(o.x, groundY - 70, 120, 70);
            ctx.fillStyle = 'white'; ctx.fillText("FAKE PRO", o.x + 10, groundY - 30);
            if (player.x < o.x + 120 && player.x + player.w > o.x && (player.y + player.h) > groundY - 70) die();
        } else {
            // Lowered Ad - No Stick
            ctx.fillStyle = '#ef4444'; ctx.fillRect(o.x, groundY - 140, 100, 40);
            ctx.fillStyle = 'white'; ctx.fillText("SCAM AD", o.x + 10, groundY - 115);
            // Must duck under this
            if (player.x < o.x + 100 && player.x + player.w > o.x && !player.duck) die();
        }
        if (o.x < player.x && !o.passed) { o.passed = true; score++; passedCount++; }
        if (o.x < -200) obstacles.splice(i, 1);
    });

    if (homeX !== null) {
        homeX -= speed;
        ctx.fillStyle = '#f1f5f9'; ctx.fillRect(homeX, groundY - 250, 300, 250); // Big House
        if (player.x > homeX + 150) win();
    }

    document.getElementById('score-ui').innerText = score;
    document.getElementById('goal-ui').innerText = Math.max(0, targetNeeded - passedCount);
    requestAnimationFrame(loop);
}

function die() { active = false; document.getElementById('game-over').style.display = 'flex'; }
function win() { 
    active = false; document.getElementById('victory-screen').style.display = 'flex'; 
    document.getElementById('level-text').innerText = `Level ${level} Finished!`;
}

window.onkeydown = (e) => {
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -15; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => { if (e.code === 'ArrowDown') player.duck = false; };
