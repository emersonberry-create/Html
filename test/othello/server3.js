const WebSocket = require('ws');
// You can change 8080 to 8081, 8082, etc., to run "Multiple Servers"
const port = 8003; 
const wss = new WebSocket.Server({ port: port, host: '0.0.0.0' });

let gameState = { board: null, currentPlayer: 'black' };
let playerCount = 0;

wss.on('connection', (ws) => {
    if (playerCount >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Game Full' }));
        ws.close();
        return;
    }

    playerCount++;
    console.log(`Player joined. Total: ${playerCount}`);

    if (gameState.board) {
        ws.send(JSON.stringify({ type: 'update', ...gameState }));
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'move') {
            gameState.board = data.board;
            gameState.currentPlayer = data.currentPlayer;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update', ...gameState }));
                }
            });
        }
    });

    ws.on('close', () => {
        playerCount--;
        console.log(`Player left. Total: ${playerCount}`);
    });
});

console.log(`Server running on port ${port}`);
