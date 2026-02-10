const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w, h, groundY, active = false, tick = 0;
let score = 0, speed = 8, obstacles = [], player;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    groundY = h * 0.85;
}
window.onresize = resize;
resize();

function startGame(job) {
    active = true;
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    player = {
        x: 150, y: groundY - 120, dy: 0, w: 60, h: 110,
        job: job, jumps: 2, duck: false
    };
    loop();
}

function drawPlayer(p) {
    const dH = p.duck ? p.h * 0.6 : p.h;
    const dY = p.duck ? groundY - dH : p.y;

    // 1. Pants
    ctx.fillStyle = p.job === 'hvac' ? '#064e3b' : '#1e3a8a'; // Dark green or Blue jeans
    ctx.fillRect(p.x + 10, dY + dH - 40, 18, 40); // Leg L
    ctx.fillRect(p.x + 32, dY + dH - 40, 18, 40); // Leg R

    // 2. Shirt (Button up long sleeve)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(p.x + 5, dY + 30, 50, dH - 70);
    // Collar detail
    ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(p.x + 5, dY + 30, 50, 10);

    // 3. Sleeves
    ctx.fillRect(p.x - 5, dY + 35, 10, 40);
    ctx.fillRect(p.x + 55, dY + 35, 10, 40);

    // 4. Face/Skin
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(p.x + 15, dY + 5, 30, 30);

    // 5. Hat
    if(p.job === 'hvac') {
        ctx.fillStyle = '#064e3b'; // Dark Green Baseball Cap
        ctx.fillRect(p.x + 10, dY, 40, 12);
        ctx.fillRect(p.x + 35, dY + 5, 25, 5); // Bill
    } else {
        ctx.fillStyle = '#f1c40f'; // Red Roofer Hard Hat
        ctx.beginPath(); ctx.arc(p.x + 30, dY + 15, 20, Math.PI, 0); ctx.fill();
        ctx.fillRect(p.x + 5, dY + 12, 50, 6); // Brim
    }

    // 6. Tool (Silver wrench or hammer)
    ctx.font = '30px Arial';
    ctx.fillText(p.job === 'hvac' ? '🔧' : '🔨', p.x + 45, dY + 60);
}

function drawDetailedVan(x) {
    // Road Perspective Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillEllipse = function(x,y,rx,ry) { ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,7); ctx.fill(); };
    ctx.fillEllipse(x + 75, groundY, 70, 10);

    // Main Body
    let grad = ctx.createLinearGradient(x, 0, x + 150, 0);
    grad.addColorStop(0, '#334155'); grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.roundRect ? ctx.fillRoundRect(x, groundY - 80, 150, 70, 10) : ctx.fillRect(x, groundY - 80, 150, 70);

    // Windshield & Grill (Facing Player)
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(x + 5, groundY - 75, 40, 30); // Window
    ctx.fillStyle = '#0f172a'; ctx.fillRect(x + 5, groundY - 35, 40, 15); // Grill
    
    // Headlights (Glow)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(x + 10, groundY - 28, 6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 40, groundY - 28, 6, 0, 7); ctx.fill();

    // Ladder Rack
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
    ctx.strokeRect(x + 50, groundY - 95, 80, 15);
}

function drawWavingBanner(x) {
    tick += 0.05;
    ctx.fillStyle = '#795548'; ctx.fillRect(x + 60, groundY - 200, 8, 200); // Post

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x, groundY - 220);
    for(let i=0; i<=120; i+=10) {
        let yOffset = Math.sin(tick + (i * 0.05)) * 15;
        ctx.lineTo(x + i, groundY - 220 + yOffset);
    }
    ctx.lineTo(x + 120, groundY - 170);
    ctx.lineTo(x, groundY - 170);
    ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 14px Arial'; ctx.fillText("SCAM AD", x+20, groundY - 190);
}

function loop() {
    if (!active) return;
    ctx.clearRect(0,0,w,h);

    // Sky & Road
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(0,0,w,h); // Blue Sky
    ctx.fillStyle = '#475569'; ctx.fillRect(0, groundY, w, h-groundY); // Asphalt
    ctx.strokeStyle = 'white'; ctx.setLineDash([20, 20]);
    ctx.beginPath(); ctx.moveTo(0, groundY + 40); ctx.lineTo(w, groundY + 40); ctx.stroke(); ctx.setLineDash([]);

    // Player Physics
    player.dy += 0.8; player.y += player.dy;
    if (player.y > groundY - player.h) { player.y = groundY - player.h; player.dy = 0; player.jumps = 2; }
    drawPlayer(player);

    // Obstacles
    if (Math.random() < 0.01) {
        obstacles.push({ x: w + 100, type: Math.random() > 0.5 ? 'van' : 'banner', passed: false });
    }

    obstacles.forEach((o, i) => {
        o.x -= speed;
        if (o.type === 'van') {
            drawDetailedVan(o.x);
            if (player.x < o.x + 150 && player.x + player.w > o.x && (player.y + player.h) > groundY - 80) die();
        } else {
            drawWavingBanner(o.x);
            if (player.x < o.x + 120 && player.x + player.w > o.x && !player.duck) die();
        }
        if (o.x < player.x && !o.passed) { o.passed = true; score++; speed += 0.05; }
    });

    document.getElementById('score-ui').innerText = score;
    requestAnimationFrame(loop);
}

function die() {
    active = false;
    document.getElementById('game-over').style.display = 'flex';
}

window.onkeydown = (e) => {
    if (e.code === 'Space' && player.jumps > 0) { player.dy = -16; player.jumps--; }
    if (e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => { if (e.code === 'ArrowDown') player.duck = false; };
