document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const ROWS = 8, COLS = 8;
    let board = Array(ROWS).fill().map(() => Array(COLS).fill(null));
    let currentPlayer = 'black';

    // CHANGE PORT HERE: 8080 for Server 1, 8081 for Server 2
    const socket = new WebSocket('ws://192.168.86.40:8080');

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'error') {
            alert(data.message);
        } else if (data.type === 'update') {
            board = data.board;
            currentPlayer = data.currentPlayer;
            renderFullBoard();
        }
    };

    function initGame() {
        boardElement.innerHTML = '';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.onclick = () => handleMove(r, c);
                boardElement.appendChild(cell);
            }
        }
        // Standard start
        board[3][3] = 'white'; board[3][4] = 'black';
        board[4][3] = 'black'; board[4][4] = 'white';
        renderFullBoard();
    }

    function renderFullBoard() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = boardElement.children[r * 8 + c];
                const color = board[r][c];
                if (!color) { cell.innerHTML = ''; continue; }
                let piece = cell.querySelector('.piece');
                if (!piece) {
                    piece = document.createElement('div');
                    cell.appendChild(piece);
                }
                piece.className = 'piece ' + color;
            }
        }
    }

    function handleMove(r, c) {
        if (board[r][c]) return;
        const flips = getFlips(r, c, currentPlayer);
        if (flips.length === 0) return;

        board[r][c] = currentPlayer;
        flips.forEach(pos => board[pos.r][pos.c] = currentPlayer);
        const nextPlayer = (currentPlayer === 'black') ? 'white' : 'black';

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'move',
                board: board,
                currentPlayer: nextPlayer
            }));
        }
    }

    function getFlips(row, col, color) {
        const opponent = (color === 'black') ? 'white' : 'black';
        const directions = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
        let piecesToFlip = [];
        directions.forEach(([dr, dc]) => {
            let r = row + dr, c = col + dc;
            let temp = [];
            while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
                temp.push({r, c});
                r += dr; c += dc;
            }
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === color) {
                piecesToFlip = piecesToFlip.concat(temp);
            }
        });
        return piecesToFlip;
    }

    initGame();
});
