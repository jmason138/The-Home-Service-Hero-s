const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w, h, active = false;
let score = 0, speed = 7, highScore = localStorage.getItem('hhero_best') || 0;
let player, obstacles = [], clouds = [], particles = [];

// Resize to fill screen
function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();

document.getElementById('best-ui').innerText = highScore;

function startGame(type) {
    active = true;
    score = 0;
    speed = 7;
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('game-wrap').style.display = 'block';
    
    player = {
        x: 100, y: h - 150, dy: 0, jumps: 2, duck: false,
        color: type === 'hvac' ? '#2ecc71' : '#e74c3c',
        tool: type === 'hvac' ? '🔧' : '🔨'
    };
    
    obstacles = [];
    clouds = Array.from({length: 6}, () => ({ x: Math.random()*w, y: Math.random()*h/2, s: Math.random() + 0.5 }));
    spawnObstacle();
    requestAnimationFrame(loop);
}

function spawnObstacle() {
    if (!active) return;
    let type = Math.random() > 0.4 ? 'van' : 'banner';
    obstacles.push({ x: w + 200, type: type });
    // Random gap ensures it's never impossible
    setTimeout(spawnObstacle, 1500 + Math.random() * 2000 / (speed/7));
}

function createParticle(x, y) {
    for(let i=0; i<5; i++) particles.push({ x, y, dx: Math.random()-0.5, dy: Math.random()-0.5, a: 1 });
}

function die() {
    active = false;
    if(score > highScore) {
        highScore = score;
        localStorage.setItem('hhero_best', highScore);
    }
    document.getElementById('fail-msg').innerText = "A low-quality competitor cut corners and outbid you. Quality matters!";
    document.getElementById('gameOver').style.display = 'flex';
}

function loop() {
    if (!active) return;
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Environment
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, w, h);
    
    // Sun Glow
    let grad = ctx.createRadialGradient(w-100, 100, 10, w-100, 100, 200);
    grad.addColorStop(0, '#fff176'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);

    // Ground
    ctx.fillStyle = '#4ade80'; ctx.fillRect(0, h-100, w, 100);

    // 2. Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    clouds.forEach(c => {
        c.x -= c.s; if(c.x < -100) c.x = w + 100;
        ctx.beginPath(); ctx.arc(c.x, c.y, 30, 0, 7); ctx.arc(c.x+30, c.y-10, 40, 0, 7); ctx.fill();
    });

    // 3. Player Physics
    player.dy += 0.8; player.y += player.dy;
    if (player.y > h - 170) { 
        player.y = h - 170; player.dy = 0; player.jumps = 2; 
    }

    // Draw Player
    let pY = player.duck ? player.y + 35 : player.y;
    ctx.fillStyle = player.color;
    ctx.roundRect(player.x, pY, 50, player.duck ? 35 : 70, 10).fill();
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(player.x-5, pY, 60, 10); // Hard hat brim
    ctx.beginPath(); ctx.arc(player.x+25, pY, 20, Math.PI, 0); ctx.fill(); // Hat top
    ctx.fillStyle = 'white'; ctx.font = "24px Arial"; ctx.fillText(player.tool, player.x+12, pY+45);

    // 4. Obstacles
    obstacles.forEach((o, i) => {
        o.x -= speed;
        if(o.type === 'van') {
            ctx.fillStyle = '#4b5563'; ctx.roundRect(o.x, h-160, 120, 60, 5).fill();
            ctx.fillStyle = 'white'; ctx.font = "bold 12px Arial"; ctx.fillText("FAKE PRO", o.x+30, h-125);
            // Wheels
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(o.x+25, h-100, 12, 0, 7); ctx.arc(o.x+95, h-100, 12, 0, 7); ctx.fill();
            if(player.x < o.x + 120 && player.x + 50 > o.x && player.y + 70 > h-160 && !player.duck) die();
        } else {
            ctx.fillStyle = '#ef4444'; ctx.fillRect(o.x, h-230, 140, 50);
            ctx.fillStyle = '#fff'; ctx.font = "bold 14px Arial"; ctx.fillText("⚠️ SCAM PRICE", o.x+15, h-200);
            if(player.x < o.x + 140 && player.x + 50 > o.x && !player.duck) die();
        }
        if(o.x < -200) { obstacles.splice(i, 1); score++; speed += 0.1; }
    });

    // 5. Particles
    particles.forEach((p, i) => {
        p.x += p.dx; p.y += p.dy; p.a -= 0.02;
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
        if(p.a <= 0) particles.splice(i, 1);
    });

    document.getElementById('ref-ui').innerText = score;
    document.getElementById('lvl-display').innerText = Math.floor(speed/7);

    requestAnimationFrame(loop);
}

// Helpers
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath(); this.moveTo(x+r, y); this.arcTo(x+w, y, x+w, y+h, r);
    this.arcTo(x+w, y+h, x, y+h, r); this.arcTo(x, y+h, x, y, r);
    this.arcTo(x, y, x+w, y, r); this.closePath(); return this;
};

// Controls
window.onkeydown = (e) => {
    if(e.code === 'Space' && player.jumps > 0) { player.dy = -15; player.jumps--; createParticle(player.x, player.y+70); }
    if(e.code === 'ArrowDown') player.duck = true;
};
window.onkeyup = (e) => { if(e.code === 'ArrowDown') player.duck = false; };

canvas.addEventListener('touchstart', (e) => {
    if(e.touches[0].clientY < h/2) {
        if(player.jumps > 0) { player.dy = -15; player.jumps--; createParticle(player.x, player.y+70); }
    } else { player.duck = true; }
});
canvas.addEventListener('touchend', () => player.duck = false);
