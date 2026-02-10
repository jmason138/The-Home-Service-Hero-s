const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d");

// Game State
let active = false, score = 0, level = 1, jobType = 'hvac';
let gameSpeed = 5;
let highScore = localStorage.getItem("hhero_highscore") || 0;

// Player Properties
let player = { 
    x: 80, y: 330, dy: 0, 
    w: 40, h: 70, 
    grounded: false, duck: false, jumpsLeft: 2 
};

let obstacles = [];
let stars = [];
let clouds = [];
let houseX = -1000;

// Update High Score UI on load
document.getElementById("best-ui").innerText = highScore;

function startGame(type) {
    jobType = type; active = true; score = 0; gameSpeed = 5;
    document.getElementById("menu").style.display = "none";
    document.getElementById("game-wrap").style.display = "block";
    
    // Initial Setup
    obstacles = [];
    spawnObstacle(); // Start the fair spawn chain
    stars = [{x: 800, y: 250, active: true}];
    clouds = Array.from({length: 4}, (_, i) => ({x: i * 250, y: 40 + Math.random()*60, s: 1}));
    houseX = -1000;
    loop();
}

// FAIR SPAWN LOGIC: Ensures obstacles don't overlap
function spawnObstacle() {
    if (!active) return;
    let type = Math.random() > 0.5 ? 'van' : 'banner';
    let lastX = obstacles.length > 0 ? obstacles[obstacles.length-1].x : 800;
    
    // Space things out by at least 400 pixels so there is always a way through
    let newX = Math.max(800, lastX + 400 + Math.random() * 300);
    
    obstacles.push({x: newX, type: type});
    
    // Clean up old obstacles
    if (obstacles.length > 5) obstacles.shift();
    
    // Schedule next spawn
    setTimeout(spawnObstacle, 2000 / (gameSpeed/5));
}

function die() {
    active = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("hhero_highscore", highScore);
    }
    document.getElementById("fail-msg").innerHTML = `You collected ${score} referrals, but a low quality competitor took the final job.`;
    document.getElementById("gameOver").style.display = "flex";
}

function drawPro(p) {
    let dY = p.duck ? p.y + 35 : p.y;
    let dH = p.duck ? 35 : 70;

    // Body/Vest
    ctx.fillStyle = (jobType === 'hvac') ? "#27ae60" : "#e74c3c";
    ctx.fillRect(p.x, dY + 20, 40, dH - 20);
    
    // Safety detail
    ctx.fillStyle = "#ccff00";
    ctx.fillRect(p.x + 5, dY + 25, 30, 5);
    ctx.fillRect(p.x + 5, dY + 45, 30, 5);

    // Head & Hard Hat
    ctx.fillStyle = "#ffdbac";
    ctx.fillRect(p.x + 10, dY, 20, 20);
    ctx.fillStyle = "#ffcc00"; // Shiny Yellow Hat
    ctx.beginPath(); ctx.arc(p.x + 20, dY + 5, 15, Math.PI, 0); ctx.fill();
    ctx.fillRect(p.x + 2, dY + 2, 36, 4);

    // Tool Icon
    ctx.font = "20px Arial";
    ctx.fillText(jobType === 'hvac' ? "🔧" : "🔨", p.x + 10, dY + 45);
}

function loop() {
    if (!active) return;

    // Parallax Background
    ctx.fillStyle = "#87ceeb"; ctx.fillRect(0, 0, 800, 450);
    
    // Sun & Clouds
    ctx.fillStyle = "#fff176"; ctx.beginPath(); ctx.arc(700, 60, 40, 0, Math.PI*2); ctx.fill();
    clouds.forEach(c => {
        c.x -= 1; // Clouds move slower
        if (c.x < -100) c.x = 900;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath(); ctx.arc(c.x, c.y, 25, 0, 7); ctx.arc(c.x+30, c.y-10, 30, 0, 7); ctx.fill();
    });

    // Ground
    ctx.fillStyle = "#4caf50"; ctx.fillRect(0, 400, 800, 50);

    // House Logic
    if (score >= 10 && houseX < -100) houseX = 900;
    if (houseX > -200) {
        houseX -= gameSpeed;
        ctx.fillStyle = "#fff"; ctx.fillRect(houseX, 250, 120, 150);
        ctx.fillStyle = "#3e2723"; ctx.fillRect(houseX+40, 330, 40, 70); // Door
        if (player.x > houseX + 60) {
            alert("JOB COMPLETE! You earned a 5-star review!");
            location.reload(); 
        }
    }

    // Player Physics
    player.dy += 0.8; player.y += player.dy;
    if (player.y > 330) { player.y = 330; player.dy = 0; player.grounded = true; player.jumpsLeft = 2; }
    drawPro(player);

    // Obstacle Management
    obstacles.forEach(o => {
        o.x -= gameSpeed;
        if (o.type === 'van') {
            ctx.fillStyle = "#795548"; ctx.fillRect(o.x, 340, 110, 60);
            ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(o.x+20, 400, 10, 0, 7); ctx.arc(o.x+90, 400, 10, 0, 7); ctx.fill(); // Wheels
            ctx.fillStyle = "white"; ctx.font = "bold 12px Arial"; ctx.fillText("FAKE PRO", o.x+10, 375);
            // Collision
            if (player.x < o.x + 110 && player.x + 40 > o.x && player.y + 70 > 340 && !player.duck) die();
        } else {
            // Banner Trap
            ctx.fillStyle = "#f44336"; ctx.fillRect(o.x, 280, 130, 40);
            ctx.fillStyle = "#000"; ctx.font = "bold 12px Arial"; ctx.fillText("⚠️ SCAM PRICE", o.x+10, 305);
            // Collision (Only if not ducking)
            if (player.x < o.x + 130 && player.x + 40 > o.x && !player.duck) die();
        }
    });

    // Referral Stars
    stars.forEach(s => {
        s.x -= gameSpeed;
        if (s.active) {
            ctx.fillStyle = "gold"; ctx.font = "30px Arial"; ctx.fillText("⭐", s.x, s.y);
            if (Math.abs(player.x - s.x) < 40 && Math.abs(player.y - s.y) < 50) {
                s.active = false; score++; 
                document.getElementById("ref-ui").innerText = score;
                if (score % 5 === 0) gameSpeed += 1;
            }
        }
        if (s.x < -100) { s.x = 900; s.y = 220 + Math.random()*80; s.active = true; }
    });

    requestAnimationFrame(loop);
}

// Re-attach your previous handleJump and Touch Event Listeners here
const handleJump = () => { if (player.jumpsLeft > 0) { player.dy = -14; player.grounded = false; player.jumpsLeft--; }};
window.onkeydown = (e) => {
    if (e.code === "Space") handleJump();
    if (e.code === "ArrowDown") player.duck = true;
};
window.onkeyup = (e) => { if (e.code === "ArrowDown") player.duck = false; };
cvs.addEventListener('touchstart', (e) => {
    const rect = cvs.getBoundingClientRect();
    if ((e.touches[0].clientY - rect.top) < rect.height / 2) handleJump();
    else player.duck = true;
}, {passive: false});
cvs.addEventListener('touchend', () => player.duck = false);
