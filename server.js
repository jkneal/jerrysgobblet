const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameManager = require('./game/GameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? true : "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_game', ({ color } = {}) => {
        const game = gameManager.findGameForPlayer(socket.id, color);
        if (game) {
            socket.join(game.id);
            console.log(`Player ${socket.id} joined game ${game.id} with color ${color}`);
            io.to(game.id).emit('game_update', game.getGameState());
        }
    });
    socket.on('place_piece', ({ stackIndex, row, col }) => {
        const game = gameManager.getGameByPlayerId(socket.id);
        if (game) {
            console.log(`Player ${socket.id} trying to place piece from stack ${stackIndex} to ${row},${col}`);
            if (game.place(socket.id, stackIndex, row, col)) {
                io.to(game.id).emit('game_update', game.getGameState());
            } else {
                console.log('Place failed');
            }
        } else {
            console.log(`Game not found for player ${socket.id}`);
        }
    });

    socket.on('move_piece', ({ fromRow, fromCol, toRow, toCol }) => {
        const game = gameManager.getGameByPlayerId(socket.id);
        if (game) {
            console.log(`Player ${socket.id} trying to move from ${fromRow},${fromCol} to ${toRow},${toCol}`);
            if (game.move(socket.id, fromRow, fromCol, toRow, toCol)) {
                io.to(game.id).emit('game_update', game.getGameState());
            } else {
                console.log('Move failed');
            }
        } else {
            console.log(`Game not found for player ${socket.id}`);
        }
    });

    socket.on('reset_game', () => {
        const game = gameManager.getGameByPlayerId(socket.id);
        if (game) {
            console.log(`Player ${socket.id} requested game reset`);
            game.reset();
            // Ensure state is playing if we have 2 players, or waiting if 1
            if (game.players.length === 2) {
                game.state = 'playing';
            } else {
                game.state = 'waiting';
            }
            io.to(game.id).emit('game_update', game.getGameState());
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle player disconnection logic here if needed
        // For now, we might want to find which game they were in and remove them
        // This is a bit inefficient without a reverse lookup, but fine for bootstrap
        for (const game of gameManager.games.values()) {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                game.removePlayer(socket.id);
                io.to(game.id).emit('game_update', game.getGameState());
                if (game.players.length === 0) {
                    gameManager.removeGame(game.id);
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
