// --- CONFIGURATION ---
const RES = 250;                 // 250x250 per side
const WIDTH = RES * 2;           // 500 total width
const HEIGHT = RES;              // 250 total height
const G = 9.8;
const L1 = 1.0, L2 = 1.0;
const M1 = 1.0, M2 = 1.0;
const DT = 0.012;
const MAX_TIME = 30.0;

// Get the canvas context
const canvas = document.getElementById('pendulumCanvas');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH;
canvas.height = HEIGHT;

let theta1, theta2, w1, w2, flipTimes, hasFlipped;
let simTime = 0.0;
const totalPixels = RES * RES;

function initSimulation() {
    theta1 = new Float32Array(totalPixels);
    theta2 = new Float32Array(totalPixels);
    w1 = new Float32Array(totalPixels);
    w2 = new Float32Array(totalPixels);
    flipTimes = new Float32Array(totalPixels);
    hasFlipped = new Uint8Array(totalPixels); // Boolean array (0 or 1)

    // Initialize the grid of starting angles
    for (let i = 0; i < RES; i++) {
        for (let j = 0; j < RES; j++) {
            const index = i * RES + j;
            // Map the coordinates (i, j) to angles (-pi to pi)
            theta1[index] = (i / RES) * (2 * Math.PI) - Math.PI;
            theta2[index] = (j / RES) * (2 * Math.PI) - Math.PI;
        }
    }
}

function updatePhysics() {
    // Standard Runge-Kutta approximation (Euler method used here for simplicity)
    for (let i = 0; i < totalPixels; i++) {
        const t1 = theta1[i];
        const t2 = theta2[i];
        const sw1 = w1[i];
        const sw2 = w2[i];

        const s1 = Math.sin(t1), c1 = Math.cos(t1);
        const s2 = Math.sin(t2), c2 = Math.cos(t2);
        const s12 = Math.sin(t1 - t2), c12 = Math.cos(t1 - t2);

        const denom = (M1 + M2) * L1 - M2 * L1 * c12 * c12;
        
        const a1 = (M2*L1*sw1*sw1*s12*c12 + M2*G*s2*c12 + M2*L2*sw2*sw2*s12 - (M1+M2)*G*s1) / denom;
        const a2 = (-M2*L2*sw2*sw2*s12*c12 + (M1+M2)*(G*s1*c12 - L1*sw1*sw1*s12 - G*s2)) / (L2/L1 * denom);

        w1[i] += a1 * DT;
        w2[i] += a2 * DT;
        theta1[i] += w1[i] * DT;
        theta2[i] += w2[i] * DT;
        
        // Keep angles normalized to prevent math overflow/NAN errors
        theta1[i] = (theta1[i] + Math.PI) % (2 * Math.PI) - Math.PI;
        theta2[i] = (theta2[i] + Math.PI) % (2 * Math.PI) - Math.PI;
        
        // Flip Detection (Right Side Graph)
        if (!hasFlipped[i] && Math.abs(theta2[i]) > Math.PI) {
            flipTimes[i] = simTime;
            hasFlipped[i] = 1;
        }
    }
    simTime += DT;
}

function render() {
    // Get image data object to draw pixels directly
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const data = imageData.data; // This is a Uint8ClampedArray [R, G, B, A, R, G, B, A...]

    for (let i = 0; i < totalPixels; i++) {
        const t1 = theta1[i];
        const t2 = theta2[i];
        
        // Calculate colors for the LEFT side (Position Map)
        const hueLeft = (((t2 + Math.PI) / (2 * Math.PI)) * 255);
        const valLeft = (((Math.cos(t1) + 1) / 2) * 255);
        
        // Pixel index for the left side (maps 0-totalPixels to 0-RES on X)
        const leftX = i % RES;
        const leftY = Math.floor(i / RES);
        const leftIndex = (leftY * WIDTH + leftX) * 4; 

        data[leftIndex]     = hueLeft;       // Red
        data[leftIndex + 1] = 255 - hueLeft; // Green
        data[leftIndex + 2] = valLeft;       // Blue
        data[leftIndex + 3] = 255;           // Alpha

        // Calculate colors for the RIGHT side (Flip Fractal)
        let brightRight = (Math.max(0, Math.min(1, 1.0 - (flipTimes[i] / MAX_TIME))) * 255);
        if (!hasFlipped[i]) brightRight = 0;
        
        // Pixel index for the right side (maps RES-WIDTH on X)
        const rightX = leftX + RES;
        const rightY = leftY;
        const rightIndex = (rightY * WIDTH + rightX) * 4;

        data[rightIndex]     = brightRight;          // Red (for purple/magenta look)
        data[rightIndex + 1] = brightRight * 0.5;    // Some Green
        data[rightIndex + 2] = brightRight;          // Blue
        data[rightIndex + 3] = 255;                  // Alpha
    }

    ctx.putImageData(imageData, 0, 0);
}

// --- MAIN LOOP ---
function gameLoop() {
    updatePhysics();
    render();
    requestAnimationFrame(gameLoop); // Browser's built-in 60fps ticker
}

initSimulation();
gameLoop();
