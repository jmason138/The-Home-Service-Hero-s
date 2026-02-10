const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let w, h, groundY, active = false, tick = 0;
let score = 0, level = 1, speed = 10, obstacles = [], player;
let targetNeeded = 20, passedCount = 0, homeX = null;

// Parallax Layers
let buildings = [];
let stars = [];

function initParallax() {
    buildings = [];
    for(let i=0; i<15; i++) {
        buildings.push({ 
            x: i * 250, 
            w: 120 + Math.random()*150, 
            h: 200 + Math.random()*500, 
            s: 0.4 + (Math.random()*0.2) 
        });
    }
}

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    groundY = h * 0.85;
    initParallax();
}
window.onresize = resize; resize();

function drawBackground() {
    // Cinematic Sky Gradient
    let skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#0f172a'); 
    skyGrad.addColorStop(1, '#334155');
    ctx.fillStyle = skyGrad; ctx.fillRect(0,0,w,h);

    // Parallax Buildings
    buildings.forEach(b => {
        b.x -= speed * b.s;
        let bGrad = ctx.createLinearGradient(b.x, groundY-b.h, b.x, groundY);
        bGrad.addColorStop(0, '#1e293b'); bGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bGrad;
        ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
        
        // Window details for realism
        ctx.fillStyle = "rgba(241, 196, 15, 0.1)";
        for(let row=20; row<b.h-20; row+=40) {
            ctx.fillRect(b.x + 15, groundY - b.h + row, 15, 15);
            ctx.fillRect(b.x + b.w - 30, groundY - b.h + row, 15, 15);
        }
        if(b.x < -b.w) b.x = w + 100;
    });

    // Road with perspective
    ctx.fillStyle = '#020617'; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 4;
    ctx.setLineDash([30, 40]);
    ctx.beginPath(); ctx.moveTo(0, groundY + 40); ctx.lineTo(w, groundY + 40); ctx.stroke();
    ctx.setLineDash([]);
}

function drawPlayer(p) {
    const dH = p.duck ? p.h * 0.6 : p.h;
    const dY = p.duck ? groundY - dH : p.y;
    
    // Anatomy & Gear
    ctx.fillStyle = '#ffdbac'; 
    ctx.fillRect(p.x + 15, dY, 30, 30); // Head
    
    ctx.fillStyle = '#ffffff'; // Shirt
    ctx.fillRect(p.x + 5, dY + 35, 50, dH - 75);

    // High-Vis Safety Vest
    ctx.fillStyle = p.job === 'hvac' ? '#22c55e' : '#ef4444';
    ctx.fillRect(p.x + 5, dY + 40, 50, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; // Reflective strips
    ctx.fillRect(p.x+5, dY + 50, 50, 4);
    ctx.fillRect(p.x+5, dY + 65, 50, 4);

    // Hard Hat / Cap
    ctx.fillStyle = p.job === 'hvac' ? '#064e3b' : '#f1c40f';
    ctx.fillRect(p.x + 5, dY - 10, 50, 15); // Hat base
    ctx.fillRect(p.x + 40, dY - 5, 20, 5); // Brim

    // Wrench/Hammer icon
    ctx.font = '35px Arial';
    ctx.fillText(p.job === 'hvac' ? '🔧' : '🔨', p.x + 55, dY + 60);
}

function drawVan(x) {
    // 3D Block Van
    ctx.fillStyle = '#1e293b'; ctx.fillRect(x + 50, groundY - 110, 180, 100);
    ctx.fillStyle = '#334155'; ctx.beginPath();
    ctx.moveTo(x + 50, groundY - 110); ctx.lineTo(x, groundY - 70); 
    ctx.lineTo(x, groundY - 10); ctx.lineTo(x + 50, groundY - 10); ctx.fill();
    
    ctx.fillStyle = 'white'; ctx.font = 'bold 20px Bebas Neue';
    ctx.fillText("FAKE PRO", x + 70, groundY - 55);
}

function loop() {
    if (!active) return;
    tick++;
    drawBackground();

    // Physics
    player.dy += 0.9; player.y += player.dy;
    if (player.y > groundY - player.h) { player.y = groundY - player.h; player.dy = 0; player.jumps = 2; }
    drawPlayer(player);

    // Spawn Logic
    if (passedCount + obstacles.length < targetNeeded && Math.random() < 0.02) {
        obstacles.push({ x: w + 200, type: Math.random() > 0.5 ? 'van' : 'ad', passed: false });
    }

    obstacles.forEach((o, i) => {
        o.x -= speed;
        if (o.type === 'van') {
            drawVan(o.x);
            if (player.x < o.x + 200 && player.x + player.w > o.x && (player.y + player.h) > groundY - 100) die();
        } else {
            // Low scam banner
            ctx.fillStyle = '#e11d48'; ctx.fillRect(o.x, groundY - 170, 150, 60);
            ctx.fillStyle = 'white'; ctx.font = '20px Bebas Neue'; ctx.fillText("SCAM AD", o.x + 40, groundY - 135);
            if (player.x < o.x + 150 && player.x + player.w > o.x && !player.duck) die();
        }
        if (o.x < player.x && !o.passed) { o.passed = true; score++; passedCount++; }
        if (o.x < -400) obstacles.splice(i, 1);
    });

    // Home Win Condition
    if (passedCount >= targetNeeded && homeX === null) homeX = w + 100;
    if (homeX) {
        homeX -= speed;
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(homeX, groundY - 450, 600, 450); // Mansion
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); 
        ctx.moveTo(homeX-50, groundY-450); ctx.lineTo(homeX+300, groundY-580); ctx.lineTo(homeX+650, groundY-450); ctx.fill();
        if (player.x > homeX + 150) win();
    }

    document.getElementById('score-ui').innerText = score;
    document.getElementById('goal-ui').innerText = Math.max(0, targetNeeded - passedCount);
    requestAnimationFrame(loop);
}

function startGame(job) {
    active = true; score = 0; level = 1; passedCount = 0; targetNeeded = 20; homeX = null;
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    player = { x: 150, y: groundY - 130, dy: 0, w: 60, h: 130, job: job, jumps: 2, duck: false };
    loop();
}

function nextLevel() {
    level++; passedCount = 0; targetNeeded = 20 + (level * 10); speed += 1.5;
    homeX = null; active = true; obstacles = [];
    document.getElementById('victory-screen').style.display = 'none';
    requestAnimationFrame(loop);
}

function die() { active = false; document.getElementById('game-over').style.display = 'flex'; }
function win() { active = false; document.getElementById('victory-screen').style.display = 'flex'; }

window.onkeydown = (e) => {
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -18; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => { if (e.code === 'ArrowDown') player.duck = false; };
