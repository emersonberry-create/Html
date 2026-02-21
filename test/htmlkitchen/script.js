alert("still in testing")
const svgNS = "http://www.w3.org/2000/svg";
let selectedElement = null;
let offset = { x: 0, y: 0 };
const svg = document.getElementById('kitchen-svg');

// Mobile Support: Map touch events to your existing drag functions
svg.addEventListener('touchstart', handleTouchStart, { passive: false });
svg.addEventListener('touchmove', handleTouchMove, { passive: false });
svg.addEventListener('touchend', endDrag, { passive: false });

function handleTouchStart(e) {
    // Mobile touches have a list; we only care about the first finger
    const touch = e.touches[0];
    // Create a fake mouse event to reuse your existing startDrag logic
    startDrag({
        target: touch.target,
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault()
    });
}

function handleTouchMove(e) {
    if (!selectedElement) return;
    e.preventDefault(); // CRITICAL: Stops the page from scrolling while dragging
    const touch = e.touches[0];
    drag({
        clientX: touch.clientX,
        clientY: touch.clientY
    });
}

// 1. COORDINATE MAPPING (Essential for Pi 500 / Mouse accuracy)
function getMousePosition(evt) {
    const CTM = svg.getScreenCTM();
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
    };
}

// 2. DRAGGING ENGINE
function startDrag(evt) {
    // Find the closest group with the blook-item class
    const target = evt.target.closest('.blook-item');
    if (target) {
        selectedElement = target;
        const mousePos = getMousePosition(evt);
        
        // Ensure the item has a translation transform to work with
        if (selectedElement.transform.baseVal.numberOfItems === 0) {
            selectedElement.setAttribute("transform", "translate(0,0)");
        }
        
        const transform = selectedElement.transform.baseVal.getItem(0);
        offset.x = mousePos.x - transform.matrix.e;
        offset.y = mousePos.y - transform.matrix.f;
    }
}

function drag(evt) {
    if (selectedElement) {
        evt.preventDefault();
        const mousePos = getMousePosition(evt);
        const x = mousePos.x - offset.x;
        const y = mousePos.y - offset.y;
        selectedElement.transform.baseVal.getItem(0).setTranslate(x, y);
    }
}

function endDrag() {
    selectedElement = null;
}

// 3. SPAWNER (Creates the ingredients)
function addBlook(containerId, blookName, x, y, color = "#fff") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const group = document.createElementNS(svgNS, "g");
    group.setAttribute("class", "blook-item");
    group.setAttribute("transform", "translate(0,0)");
    
    // SAFE DATASET USAGE: Use this to track state (e.g., "raw", "cooked")
    group.dataset.foodState = "raw"; 
    group.dataset.name = blookName;

    const body = document.createElementNS(svgNS, "rect");
    body.setAttribute("x", x); 
    body.setAttribute("y", y);
    body.setAttribute("width", 50); 
    body.setAttribute("height", 50);
    body.setAttribute("rx", "10"); 
    body.setAttribute("fill", color);
    
    group.appendChild(body);

    const fo = document.createElementNS(svgNS, "foreignObject");
    fo.setAttribute("x", x + 5); 
    fo.setAttribute("y", y + 5);
    fo.setAttribute("width", 40); 
    fo.setAttribute("height", 40);
    fo.style.pointerEvents = "none";

    const img = document.createElement("img");
    // Ensure the URL is valid for 2025 Blooket assets
    img.src = "https://ac.blooket.com/marketassets/blooks/"blookName.toLowerCase();".svg"
    img.style.width = "40px";
    img.style.height = "40px";
    
    fo.appendChild(img);
    group.appendChild(fo);
    container.appendChild(group);
}


// 4. GAME INITIALIZATION
function initGame() {
    // INTERACTIVE OBJECTS (Doors and Drawers)
    ['fridge-door', 'freezer-door', 'island-cabinet', 'oven-door'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.onclick = () => {
            const anim = id === 'oven-door' ? 'open-oven' : 'open-door';
            const isOpen = el.classList.toggle(anim);
            
            // 2025 Layering: Move the whole fridge-area to front when any door opens
            const area = document.getElementById('fridge-area');
            if (isOpen) {
                svg.appendChild(area);
            }
        };
    }
    });

    // MOUSE LISTENERS
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);

    // SPAWN INGREDIENTS (Add as many as you want here)
    addBlook('fridge-contents', 'https://ac.blooket.com/marketassets/blooks/milk.svg', 35, 120, "#5DADE2");
    addBlook('fridge-contents', 'https://ac.blooket.com/marketassets/blooks/yogurt.svg', 80, 120, "#E67E22");
    addBlook('cabinet-contents', 'https://ac.blooket.com/marketassets/blooks/toast.svg', 30, 220, "#A04000");
    addBlook('cabinet-contents', 'https://ac.blooket.com/marketassets/blooks/cereal.svg', 90, 220, "#F1C40F");
    // Inside initGame() function
    const devBtn = document.getElementById('dev-add-blook');
    if (devBtn) {
        devBtn.onclick = () => {
            // 2025 standard prompt for user input
            const name = prompt("Enter Blook name (no spaces):");
            if (name) {
                // Spawns the new blook at coordinates (200, 130) on the island plate
                addBlook('plate-contents', name, 0, 0, "#FFD700"); 
                alert(`${name} added to the kitchen!`);
            }
        };
    }
    const lid = document.getElementById('trash-lid');
    if (lid) {
        lid.onclick = (e) => {
            e.stopPropagation(); // Prevents the trash can from "shaking" when just clicking the lid
            lid.classList.toggle('open-lid');
        };
    }


}
function endDrag() {
    if (selectedElement) {
        // Get the Blook's physical position on the screen
        const blookRect = selectedElement.getBoundingClientRect();
        const blookX = blookRect.left + (blookRect.width / 2);
        const blookY = blookRect.top + (blookRect.height / 2);

        // Get the Target's physical positions
        const trashRect = document.getElementById('trash-can').getBoundingClientRect();
        const ovenRect = document.getElementById('oven-area').getBoundingClientRect();

        // 1. TRASH CAN CHECK (Collision Detection)
        if (blookX > trashRect.left && blookX < trashRect.right && 
            blookY > trashRect.top && blookY < trashRect.bottom) {
            
            const trash = document.getElementById('trash-can');
            const trashLid = document.getElementById('trash-lid');
            trash.classList.add('shake-now');
            trashLid.classList.add('open-lid');
            selectedElement.remove(); // DELETE, don't cook
            setTimeout(() => trash.classList.remove('shake-now'), 300);
            setTimeout(() => trashLid.classList.remove('open-lid'), 300);
            selectedElement = null;
            return;
        }

        // 2. OVEN CHECK (Collision Detection)
        if (blookX > ovenRect.left && blookX < ovenRect.right && 
            blookY > ovenRect.top && blookY < ovenRect.bottom) {
            cookItem(selectedElement);
        }
    }
    selectedElement = null;
}

function cookItem(el) {
    if (el.dataset.foodState !== "cooked") {
        const rect = el.querySelector('rect');
        rect.setAttribute('fill', '#8B4513'); // Turns brown
        el.dataset.foodState = "cooked";
        el.style.filter = "drop-shadow(0 0 100px orange)"; // Sizzle effect
        console.log("Food cooked!");
    }
}
const solidElements = ['island-parent', 'oven-area', 'fridge-area', 'trash-can'];
const blookHeight = 45; // All blooks are 45 pixels tall
const islandY = 310;
let gravityActive = true;
const gravityForce = 0.5; // How fast they accelerate
const floorY = 550; // The Y coordinate of the "ground"
const islandTopY = 310; // The Y coordinate of the island surface
function applyPhysics() {
    const blooks = document.querySelectorAll('.blook-item');
    // Select every element in the SVG except blooks and background
    const potentialObstacles = document.querySelectorAll('#kitchen-svg *:not(.blook-item):not(.bg-ignore)');

    blooks.forEach(blook => {
        if (blook === selectedElement) return;

        let transform = blook.transform.baseVal.getItem(0).matrix;
        let vY = parseFloat(blook.dataset.velocityY || 0);
        let curX = transform.e;
        let curY = transform.f;

        // Apply Gravity
        vY += 0.8; 
        let nextY = curY + vY;

        // Check against every element in the kitchen
        let isBlocked = false;
        
        // Move to projected position to test for a hit
        blook.transform.baseVal.getItem(0).setTranslate(curX, nextY);
        const blookRect = blook.getBoundingClientRect();

        // 1. Check against all obstacles (Island, Oven, Trash, etc.)
        for (const obj of potentialObstacles) {
            const objRect = obj.getBoundingClientRect();
            if (isOverlapping(blookRect, objRect)) {
                isBlocked = true;
                break;
            }
        }

        // 2. Check against other Blooks (Stacking)
        if (!isBlocked) {
            blooks.forEach(other => {
                if (other === blook) return;
                const otherRect = other.getBoundingClientRect();
                if (isOverlapping(blookRect, otherRect)) {
                    isBlocked = true;
                }
            });
        }

        // 3. Resolve Movement
        if (isBlocked) {
            vY = 0; // Stop falling
            blook.transform.baseVal.getItem(0).setTranslate(curX, curY); // Stay at current Y
        } else {
            blook.transform.baseVal.getItem(0).setTranslate(curX, nextY); // Fall
        }

        blook.dataset.velocityY = vY;
    });

    requestAnimationFrame(applyPhysics);
}

// AABB Collision Helper
function isOverlapping(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
}

// Start the physics loop
applyPhysics();

// Start when the Pi 500 finishes loading the page
window.onload = initGame;
