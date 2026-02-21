const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

canvas.style.touchAction = 'none'; // Prevent scrolling on mobile

class Ball {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = 5;
        this.vy = 5;
        this.gravity = 0.8;
        this.bounce = 0.7;
        this.isDragging = false;
    }

    update() {
        if (this.isDragging) return;

        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy *= -this.bounce;
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -this.bounce;
        }
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.vx *= -1;
            this.x = this.x < this.radius ? this.radius : canvas.width - this.radius;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isDragging ? "red" : "blue";
        ctx.fill();
        ctx.closePath();
    }
}

const myBall = new Ball(100, 100, 20);

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// Handles both clicking to teleport and clicking to drag
function handleStart(e) {
    const pos = getPointerPos(e);
    const dist = Math.sqrt((pos.x - myBall.x) ** 2 + (pos.y - myBall.y) ** 2);

    // Teleport logic: If not clicking on the ball, move it to the click location first
    if (dist >= myBall.radius) {
        myBall.x = pos.x;
        myBall.y = pos.y;
    }

    // Drag logic: Always start dragging after a click/teleport
    myBall.isDragging = true;
    myBall.vx = 0;
    myBall.vy = 0;
}

function handleMove(e) {
    if (myBall.isDragging) {
        const pos = getPointerPos(e);
        myBall.x = pos.x;
        myBall.y = pos.y;
        if (e.cancelable) e.preventDefault();
    }
}

function handleEnd() {
    myBall.isDragging = false;
}

// Mouse listeners
canvas.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

// Touch listeners
canvas.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    myBall.update();
    myBall.draw();
    requestAnimationFrame(animate);
}

animate();
