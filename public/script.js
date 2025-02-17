const socket = io();

const roomInput = document.getElementById('room');
const nameInput = document.getElementById('name');
const joinBtn = document.getElementById('joinBtn');
const boardDiv = document.getElementById('board');
const turnDisplay = document.getElementById('turn');
const playersDiv = document.getElementById('players');
const resetBtn = document.getElementById('resetBtn');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatMessages = document.getElementById('chatMessages');

let board = Array(9).fill(null);
let turn = 'X';
let room = '';
let playerName = '';
let myTurn = false;

joinBtn.addEventListener('click', () => {
    room = roomInput.value.trim();
    playerName = nameInput.value.trim();
    if (room && playerName) {
        socket.emit('joinRoom', { room, playerName });
    }
});

socket.on('gameState', (gameState) => {
    board = gameState.board;
    turn = gameState.turn;
    myTurn = gameState.players[turn] === playerName;
    updateBoard();
    turnDisplay.innerText = `Turno de: ${gameState.players[turn]}`;
    playersDiv.innerHTML = `${gameState.players.X} vs ${gameState.players.O}`;
});

socket.on('gameOver', ({ winner }) => {
    alert(winner === 'Empate' ? '¡Empate!' : `¡${winner} ha ganado!`);
    resetBtn.style.display = 'block';
});

resetBtn.addEventListener('click', () => {
    socket.emit('resetGame', room);
    resetBtn.style.display = 'none';
});

function updateBoard() {
    boardDiv.innerHTML = '';
    board.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.textContent = cell;
        if (cell === null && myTurn) {
            cellDiv.onclick = () => makeMove(index);
        }
        boardDiv.appendChild(cellDiv);
    });
}

function makeMove(index) {
    if (board[index] === null && myTurn) {
        socket.emit('makeMove', { room, index });
        myTurn = false;
    }
}

// Enviar mensaje de chat
sendChatBtn.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit('sendMessage', { room, playerName, message });
        chatInput.value = '';
    }
});

// Recibir mensajes del chat
socket.on('receiveMessage', ({ playerName: sender, message }) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === playerName ? 'my-message' : 'other-message');
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
