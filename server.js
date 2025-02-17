const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {}; // Almacena el estado de las partidas

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado:', socket.id);

    socket.on('joinRoom', ({ room, playerName }) => {
        if (!rooms[room]) {
            rooms[room] = { 
                board: Array(9).fill(null), 
                turn: 'X', 
                players: { X: playerName, O: '' },
                scores: { X: 0, O: 0 }
            };
        }

        if (!rooms[room].players.O && rooms[room].players.X !== playerName) {
            rooms[room].players.O = playerName;
        }

        socket.join(room);
        io.to(room).emit('gameState', rooms[room]);
    });

    socket.on('makeMove', ({ room, index }) => {
        if (rooms[room] && rooms[room].board[index] === null) {
            rooms[room].board[index] = rooms[room].turn;
            const winner = checkWinner(rooms[room].board);

            if (winner) {
                rooms[room].scores[winner]++;
                io.to(room).emit('gameOver', { winner, scores: rooms[room].scores });
            } else if (!rooms[room].board.includes(null)) {
                io.to(room).emit('gameOver', { winner: 'Empate', scores: rooms[room].scores });
            } else {
                rooms[room].turn = rooms[room].turn === 'X' ? 'O' : 'X';
                io.to(room).emit('gameState', rooms[room]);
            }
        }
    });

    socket.on('sendMessage', ({ room, playerName, message }) => {
        io.to(room).emit('receiveMessage', { playerName, message });
    });

    socket.on('resetGame', (room) => {
        rooms[room].board = Array(9).fill(null);
        rooms[room].turn = 'X';
        io.to(room).emit('gameState', rooms[room]);
    });

    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
    });
});

function checkWinner(board) {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

server.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
