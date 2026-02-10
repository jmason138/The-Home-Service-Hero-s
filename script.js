const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d");

let active = false, score = 0, level = 1, jobType = 'hvac';
let gameSpeed = 6;
let player = { x: 80, y: 330, dy: 0, grounded: false, duck: false, jumpsLeft: 2 };
let obstacles = [], clouds = [], stars = [];
let houseX = -500; // House starts off-screen

function startGame(type) {
    jobType = type; active = true; score = 0; level = 1; gameSpeed = 6;
    document.getElementById("menu").style.display = "none";
    document.getElementById("game-wrap").style.display = "block";
    resetLevel();
    loop();
}

function resetLevel() {
    obstacles = [{x: 900, type: 'van'}, {x: 1500, type: 'banner'}];
    stars = [{x: 1200, y: 250, active: true}];
    clouds = Array.from({length: 5}, (_, i) => ({x: i * 200, y: 50, s: 0.5}));
    houseX = -500; 
}

function die() {
    active = false;
    document.getElementById("fail-msg").innerHTML = "A low quality competitor took the job.<br>Quality was sacrificed and the customer is the real loser.";
    document.getElementById("gameOver").style.display = "flex";
}

function drawVanishVan(x) {
    // Rusty Brown Body
    ctx.fillStyle = "#5d4037"; ctx.fillRect(x, 345, 100, 55); 
    ctx.fillStyle = "#3e2723"; ctx.fillRect(x + 70, 355, 30, 25); // Window
    // Ladder on top
    ctx.strokeStyle = "#9e9e9e"; ctx.lineWidth = 3;
    ctx.strokeRect(x + 10, 335, 80, 10);
    ctx.fillStyle = "white"; ctx.font = "bold 10px Arial";
    ctx.fillText("CHEAP PROS", x + 10, 375);
}

function drawScamBanner(x) {
    // Flashing Red/Yellow Banner
    ctx.fillStyle = (Date.now() % 400 < 200) ? "red" : "yellow";
    ctx.fillRect(x, 275, 120, 45);
    ctx.strokeStyle = "black"; ctx.lineWidth = 3; ctx.strokeRect(x, 275, 120, 45);
    ctx.fillStyle = "black"; ctx.font = "bold 11px Arial";
    ctx.fillText("⚠️ SCAM AD ⚠️", x + 15, 303);
}

function drawHouse(x) {
    ctx.fillStyle = "#fff"; ctx.fillRect(x, 250, 150, 150); // Body
    ctx.fillStyle = "#e74c3c"; ctx.beginPath(); // Roof
    ctx.moveTo(x - 20, 250); ctx.lineTo(x + 75, 180); ctx.lineTo(x + 170, 250); ctx.fill();
    ctx.fillStyle = "#795548"; ctx.fillRect(x + 60, 340, 30, 60); // Door
    ctx.fillStyle = "gold"; ctx.font = "20px Arial"; ctx.fillText("CUSTOMER", x + 25, 170);
}

function loop() {
    if (!active) return;
    ctx.fillStyle = "#87ceeb"; ctx.fillRect(0, 0, 800, 450); // Sky
    ctx.fillStyle = "#7cfc00"; ctx.fillRect(0, 400, 800, 50); // Grass

    // Level Logic: After 10 stars, the house appears
    if (score >= 10 && houseX < -100) { houseX = 900; }

    // Physics
    player.dy += 0.8; player.y += player.dy;
    if (player.y > 330) { player.y = 330; player.dy = 0; player.grounded = true; player.jumpsLeft = 2; }
    
    // Draw Character
    let drawY = player.duck ? player.y + 40 : player.y;
    ctx.fillStyle = (jobType === 'hvac') ? "#27ae60" : "#e74c3c";
    ctx.fillRect(player.x, drawY + 20, 40, player.duck ? 30 : 50);

    // Obstacles (Only if house hasn't arrived)
    if (houseX < 0 || houseX > 800) {
        obstacles.forEach(o => {
            o.x -= gameSpeed;
            if(o.type === 'van') {
                drawVanishVan(o.x);
                if(player.x < o.x + 90 && player.x + 40 > o.x && player.y + 70 > 345 && !player.duck) die();
            } else {
                drawScamBanner(o.x);
                if(player.x < o.x + 110 && player.x + 40 > o.x && !player.duck) die();
            }
            if(o.x < -150) o.x = 1000 + Math.random()*500;
        });
    }

    // Stars
    stars.forEach(s => {
        s.x -= gameSpeed;
        if(s.active) {
            ctx.fillStyle = "gold"; ctx.font = "30px Arial"; ctx.fillText("⭐", s.x, s.y);
            if(Math.abs(player.x - s.x) < 40 && Math.abs(player.y - s.y) < 50) {
                s.active = false; score++; 
                document.getElementById("ref-ui").innerText = score;
                if(score % 5 === 0) gameSpeed += 1.5; // Level up speed
            }
        }
        if(s.x < -50) { s.x = 900; s.y = 250; s.active = true; }
    });

    // House Reward
    if (houseX > -200) {
        houseX -= gameSpeed;
        drawHouse(houseX);
        if (player.x > houseX + 50) {
            alert("LEVEL COMPLETE! You reached the customer.");
            score += 10;
            startGame(jobType); // Restart with next level
        }
    }

    requestAnimationFrame(loop);
}

// Controls remain the same as previous script...
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
