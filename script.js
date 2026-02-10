const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d");

let active = false, score = 0, jobType = 'hvac';
let player = { x: 80, y: 330, dy: 0, grounded: false, duck: false, jumpsLeft: 2 };
let obstacles = [], clouds = [], stars = [];

function startGame(type) {
    jobType = type;
    active = true;
    document.getElementById("menu").style.display = "none";
    document.getElementById("game-wrap").style.display = "block";
    
    obstacles = [{x: 900, type: 'van'}, {x: 1400, type: 'banner'}];
    stars = [{x: 1100, y: 250, active: true}];
    clouds = Array.from({length: 5}, (_, i) => ({x: i * 200, y: 30 + Math.random()*80, s: 0.2 + Math.random()*0.5}));
    loop();
}

function die() {
    active = false;
    document.getElementById("fail-msg").innerHTML = "A low quality competitor took the job.<br>Quality was sacrificed and the customer is the real loser in this deal.";
    document.getElementById("gameOver").style.display = "flex";
}

function drawCharacter(p) {
    let drawY = p.duck ? p.y + 40 : p.y;
    let bodyH = p.duck ? 30 : 70;
    
    ctx.fillStyle = (jobType === 'hvac') ? "#27ae60" : "#e74c3c";
    ctx.fillRect(p.x, drawY + 20, 40, bodyH - 20); // Vest
    ctx.fillStyle = "#ccff00"; // Stripes
    ctx.fillRect(p.x + 8, drawY + 20, 6, bodyH - 20);
    ctx.fillRect(p.x + 26, drawY + 20, 6, bodyH - 20);
    ctx.fillStyle = "#ffdbac"; // Head
    ctx.fillRect(p.x + 10, drawY, 20, 20);
    ctx.fillStyle = "#ffcc00"; // Hat
    ctx.beginPath(); ctx.arc(p.x + 20, drawY + 2, 14, Math.PI, 0); ctx.fill();
    ctx.fillRect(p.x, drawY - 2, 40, 5);
    ctx.font = "24px Arial";
    ctx.fillText(jobType === 'hvac' ? "🔧" : "🔨", p.x + 35, drawY + 35);
}

function loop() {
    if (!active) return;
    ctx.fillStyle = "#87ceeb"; ctx.fillRect(0, 0, 800, 450);
    
    clouds.forEach(c => {
        c.x -= c.s; if(c.x < -150) c.x = 900;
        ctx.fillStyle = "white"; ctx.beginPath(); 
        ctx.arc(c.x, c.y, 20, 0, 7); ctx.arc(c.x+20, c.y-10, 25, 0, 7); ctx.arc(c.x+45, c.y, 20, 0, 7); 
        ctx.fill();
    });

    ctx.fillStyle = "#7cfc00"; ctx.fillRect(0, 400, 800, 50); 

    player.dy += 0.8; player.y += player.dy;
    if (player.y > 330) { player.y = 330; player.dy = 0; player.grounded = true; player.jumpsLeft = 2; }

    drawCharacter(player);

    obstacles.forEach(o => {
        o.x -= 9;
        if(o.type === 'van') {
            ctx.fillStyle = "#A0522D"; ctx.fillRect(o.x, 345, 100, 60);
            if(player.x < o.x + 100 && player.x + 40 > o.x && (player.y + 70) > 345 && !player.duck) die();
        } else {
            ctx.fillStyle = "#ffff00"; ctx.fillRect(o.x, 275, 120, 45);
            ctx.strokeStyle = "red"; ctx.lineWidth = 4; ctx.strokeRect(o.x, 275, 120, 45);
            if(player.x < o.x + 120 && player.x + 40 > o.x && !player.duck) die();
        }
        if(o.x < -150) o.x = 1000 + Math.random()*500;
    });

    stars.forEach(s => {
        s.x -= 8;
        if(s.active) {
            ctx.fillStyle = "gold"; ctx.font = "32px Arial"; ctx.fillText("⭐", s.x, s.y);
            if(Math.abs(player.x - s.x) < 45 && Math.abs(player.y - s.y) < 50) { 
                s.active = false; score++; document.getElementById("ref-ui").innerText = score; 
            }
        }
        if(s.x < -50) { s.x = 900; s.y = 200 + Math.random()*120; s.active = true; }
    });
    requestAnimationFrame(loop);
}

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
});
cvs.addEventListener('touchend', () => player.duck = false);

