require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/database');
const gameManager = require('./game/GameManager');
const User = require('./models/User');
const GameModel = require('./models/GameModel');
require('./config/passport');

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Session configuration
const sessionMiddleware = session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static('public'));

// ===== AUTH ROUTES =====

// Initiate Google OAuth
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173' }),
    (req, res) => {
        // Successful authentication, redirect to client
        res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
    }
);

// Logout
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// ===== API ROUTES =====

// Update user profile
app.put('/api/profile', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const { nickname } = req.body;

        // Check if nickname is already taken
        if (nickname) {
            const existing = await User.findByNickname(nickname);
            if (existing && existing.id !== req.user.id) {
                return res.status(400).json({ error: 'Nickname already taken' });
            }
        }

        const updatedUser = await User.update(req.user.id, { nickname });
        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get waiting games for lobby
app.get('/api/games/waiting', (req, res) => {
    const waitingGames = [];

    for (const game of gameManager.games.values()) {
        if (game.state === 'waiting' && game.players.length === 1) {
            waitingGames.push({
                id: game.id,
                players: game.players.map(p => ({
                    displayName: p.displayName,
                    avatarUrl: p.avatarUrl,
                    color: p.color
                }))
            });
        }
    }

    res.json(waitingGames);
});

// Get specific game by ID
app.get('/api/games/:gameId', (req, res) => {
    const { gameId } = req.params;
    const game = gameManager.getGame(gameId);

    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
        id: game.id,
        state: game.state,
        players: game.players.map(p => ({
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
            color: p.color
        }))
    });
});

// Get active games for authenticated user
app.get('/api/user/games', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const games = await GameModel.getActiveGamesForUser(req.user.id);
        res.json(games);
    } catch (error) {
        console.error('Error getting user games:', error);
        res.status(500).json({ error: 'Failed to get games' });
    }
});

// ===== SOCKET.IO =====

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Share session with socket.io
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
    const session = socket.request.session;
    const user = session.passport?.user ? session.passport.user : null;

    console.log('A user connected:', socket.id, user ? `(User ID: ${user})` : '(Not authenticated)');

    socket.on('join_game', async ({ color, gameId } = {}) => {
        // Get user data if authenticated
        let userData = null;
        if (user) {
            try {
                const dbUser = await User.findById(user);
                if (dbUser) {
                    userData = {
                        id: dbUser.id,
                        displayName: User.getDisplayName(dbUser),
                        avatarUrl: dbUser.avatar_url
                    };
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        }

        let game;

        // If gameId is provided, try to join that specific game
        if (gameId) {
            game = gameManager.getGame(gameId);
            if (game && game.state === 'waiting' && game.players.length < 2) {
                game.addPlayer(socket.id, color, userData);
                game.setPlayerConnected(socket.id, true);
            } else {
                console.log(`Game ${gameId} not available for joining`);
                // Fall back to matchmaking
                game = gameManager.findGameForPlayer(socket.id, color, userData);
            }
        } else {
            // Use matchmaking to find or create a game
            game = gameManager.findGameForPlayer(socket.id, color, userData);
            if (game) {
                game.setPlayerConnected(socket.id, true);
            }
        }

        if (game) {
            socket.join(game.id);
            console.log(`Player ${socket.id} joined game ${game.id} with color ${color}`);

            // Store game info in session for reconnection
            if (socket.request.session) {
                if (!socket.request.session.activeGames) {
                    socket.request.session.activeGames = {};
                }
                socket.request.session.activeGames[game.id] = color;
                socket.request.session.save();
            }

            io.to(game.id).emit('game_update', game.getGameState());
        }
    });

    // Rejoin existing game (for reconnection/page refresh)
    socket.on('rejoin_game', async ({ gameId }) => {
        if (!gameId) {
            console.log('Rejoin failed: no gameId provided');
            return;
        }

        console.log(`Player ${socket.id} attempting to rejoin game ${gameId}`);

        // Check if game is in memory
        let game = gameManager.getGame(gameId);

        // If not in memory, try to load from database
        if (!game) {
            console.log(`Game ${gameId} not in memory, loading from database...`);
            game = await gameManager.loadGameFromDatabase(gameId);
        }

        if (!game) {
            console.log(`Game ${gameId} not found in memory or database`);
            socket.emit('game_error', { message: 'Game not found' });
            return;
        }

        // Get user data if authenticated
        let userData = null;
        if (user) {
            try {
                const dbUser = await User.findById(user);
                if (dbUser) {
                    userData = {
                        id: dbUser.id,
                        displayName: User.getDisplayName(dbUser),
                        avatarUrl: dbUser.avatar_url
                    };
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        }

        // Find player in game and update socket ID
        // Identify player
        let player = null;

        // 1. Try by User ID (Authenticated)
        if (userData) {
            player = game.players.find(p => p.userId === userData.id);
        }

        // 2. Try by Session (Guest or Auth fallback)
        if (!player && socket.request.session?.activeGames) {
            const sessionColor = socket.request.session.activeGames[gameId];
            if (sessionColor) {
                player = game.players.find(p => p.color === sessionColor);
            }
        }

        if (player) {
            console.log(`Updating socket ID for player ${player.displayName || player.color} from ${player.id} to ${socket.id}`);

            // Update connection status before changing ID (if needed, but ID change handles it)
            // Actually we need to update the ID first so setPlayerConnected finds the right player?
            // No, setPlayerConnected uses the ID. If we change the ID, we should use the new one.

            player.id = socket.id;
            game.setPlayerConnected(socket.id, true);

            // Update in database
            await GameModel.save(game);

            // Join socket room
            socket.join(gameId);

            // Send current game state
            socket.emit('game_update', game.getGameState());
            console.log(`Player ${socket.id} rejoined game ${gameId}`);
        } else {
            console.log(`Player not found in game ${gameId} for user ${userData?.id || 'guest'}`);
            socket.emit('game_error', { message: 'You are not a player in this game' });
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
        // Do NOT remove player on disconnect to allow reconnection
        // We rely on the cleanup job to remove old games/players

        // Mark player as disconnected
        const game = gameManager.getGameByPlayerId(socket.id);
        if (game) {
            game.setPlayerConnected(socket.id, false);
            console.log(`Player ${socket.id} marked as disconnected in game ${game.id}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
