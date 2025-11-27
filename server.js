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
const StatsModel = require('./models/StatsModel'); // Added StatsModel import
require('./config/passport');

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Trust proxy - required for secure cookies behind Render's load balancer
app.set('trust proxy', 1);

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

// Static files - serve built frontend in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, 'client/dist')));
} else {
    app.use(express.static('public'));
}

// ===== AUTH ROUTES =====

// Initiate Google OAuth
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Explicitly save session before redirect to ensure cookie is set
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.redirect('/');
            }
            console.log('User logged in:', req.user.email);
            console.log('Session ID:', req.sessionID);
            // Successful authentication, redirect to home
            res.redirect('/');
        });
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

// Get waiting games for lobby (only public games)
app.get('/api/games/waiting', (req, res) => {
    const waitingGames = [];

    for (const game of gameManager.games.values()) {
        // Only show public games with one player waiting
        if (game.state === 'waiting' && game.players.length === 1 && game.isPublic) {
            waitingGames.push({
                id: game.id,
                players: game.players.map(p => ({
                    displayName: p.displayName,
                    avatarUrl: p.avatarUrl,
                    color: p.color
                }))
                // Don't include joinCode in public listing
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

// Join game by join code
app.post('/api/games/join-by-code', (req, res) => {
    const { joinCode } = req.body;

    if (!joinCode || joinCode.length !== 3) {
        return res.status(400).json({ error: 'Invalid join code format' });
    }

    const game = gameManager.getGameByJoinCode(joinCode);

    if (!game) {
        return res.status(404).json({ error: 'No game found with that code' });
    }

    if (game.players.length >= 2) {
        return res.status(400).json({ error: 'Game is full' });
    }

    res.json({ gameId: game.id });
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

    // Create a new game
    socket.on('create_game', async ({ color, isPublic = true, requestJoinCode = false } = {}) => {
        // Get user data if authenticated
        let userData = null;
        if (user) {
            try {
                const dbUser = await User.findById(user);
                if (dbUser) {
                    const stats = await StatsModel.getPlayerStats(dbUser.id);
                    userData = {
                        id: dbUser.id,
                        displayName: User.getDisplayName(dbUser),
                        avatarUrl: dbUser.avatar_url,
                        rank: stats?.rank || null
                    };
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        }

        // Create new game
        try {
            const game = gameManager.createGame(socket.id, color, userData, isPublic, requestJoinCode);
            game.setPlayerConnected(socket.id, true);

            socket.join(game.id);
            console.log(`Player ${socket.id} created game ${game.id} with color ${color}, public: ${isPublic}, joinCode: ${game.joinCode || 'none'}`);

            // Store game info in session
            if (socket.request.session) {
                if (!socket.request.session.activeGames) {
                    socket.request.session.activeGames = {};
                }
                socket.request.session.activeGames[game.id] = color;
                socket.request.session.save();
            }

            io.to(game.id).emit('game_update', game.getGameState());
        } catch (error) {
            console.error('Error creating game:', error);
            socket.emit('game_error', {
                message: error.message || 'Failed to create game',
                shouldReturnToLobby: true
            });
        }
    });

    // Join an existing game by gameId
    socket.on('join_game', async ({ color, gameId } = {}) => {
        if (!gameId) {
            socket.emit('game_error', {
                message: 'Game ID is required to join a game',
                shouldReturnToLobby: true
            });
            return;
        }

        // Get user data if authenticated
        let userData = null;
        if (user) {
            try {
                const dbUser = await User.findById(user);
                if (dbUser) {
                    const stats = await StatsModel.getPlayerStats(dbUser.id);
                    userData = {
                        id: dbUser.id,
                        displayName: User.getDisplayName(dbUser),
                        avatarUrl: dbUser.avatar_url,
                        rank: stats?.rank || null
                    };
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        }

        const game = gameManager.getGame(gameId);

        if (!game) {
            socket.emit('game_error', {
                message: 'Game not found',
                shouldReturnToLobby: true
            });
            return;
        }

        if (game.state !== 'waiting') {
            socket.emit('game_error', {
                message: 'Game has already started',
                shouldReturnToLobby: true
            });
            return;
        }

        if (game.players.length >= 2) {
            socket.emit('game_error', {
                message: 'Game is full',
                shouldReturnToLobby: true
            });
            return;
        }

        // Add player to game
        if (game.addPlayer(socket.id, color, userData)) {
            game.setPlayerConnected(socket.id, true);
            socket.join(game.id);
            console.log(`Player ${socket.id} joined game ${game.id} with color ${color}`);

            // Store game info in session
            if (socket.request.session) {
                if (!socket.request.session.activeGames) {
                    socket.request.session.activeGames = {};
                }
                socket.request.session.activeGames[game.id] = color;
                socket.request.session.save();
            }

            io.to(game.id).emit('game_update', game.getGameState());
        } else {
            socket.emit('game_error', {
                message: 'Failed to join game',
                shouldReturnToLobby: true
            });
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
                    // Fetch player stats to get rank
                    const stats = await StatsModel.getPlayerStats(dbUser.id);
                    userData = {
                        id: dbUser.id,
                        displayName: User.getDisplayName(dbUser),
                        avatarUrl: dbUser.avatar_url,
                        rank: stats?.rank || null
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

            // Robust turn update: Check if it's this player's turn by ID OR by Color
            // This handles cases where IDs might be out of sync but the turn belongs to this player's color
            const turnPlayer = game.players.find(p => p.id === game.turn);
            const isMyTurn = (turnPlayer && turnPlayer.color === player.color) || game.turn === player.id;

            console.log(`Rejoin debug: game.turn=${game.turn}, player.id=${player.id}, turnPlayer=${turnPlayer?.id}, isMyTurn=${isMyTurn}`);

            if (isMyTurn) {
                console.log(`Updating turn from ${game.turn} to ${socket.id}`);
                game.turn = socket.id;
            }

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
            const wasFinished = game.state === 'finished';
            if (game.place(socket.id, stackIndex, row, col)) {
                io.to(game.id).emit('game_update', game.getGameState());

                // Check for game end
                if (!wasFinished && game.state === 'finished') {
                    handleGameCompletion(game);
                }
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
            const wasFinished = game.state === 'finished';
            if (game.move(socket.id, fromRow, fromCol, toRow, toCol)) {
                io.to(game.id).emit('game_update', game.getGameState());

                // Check for game end
                if (!wasFinished && game.state === 'finished') {
                    handleGameCompletion(game);
                }
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

    // Handle emoji reactions
    socket.on('send_reaction', ({ reaction }) => {
        const game = gameManager.getGameByPlayerId(socket.id);
        if (game) {
            // Broadcast to everyone in the room (including sender, though sender might handle locally)
            // Actually, usually sender handles locally for instant feedback, but broadcasting simplifies sync.
            // Let's broadcast to everyone so they see it at roughly the same time.
            io.to(game.id).emit('receive_reaction', {
                reaction,
                senderId: socket.id
            });
        }
    });

    socket.on('player_heartbeat', () => {
        const game = gameManager.getGameByPlayerId(socket.id);
        if (game) {
            game.setPlayerConnected(socket.id, true);
        }
    });

    socket.on('chat_message', ({ gameId, message }) => {
        // Broadcast message to all players in the game room
        io.to(gameId).emit('chat_message', message);
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

// Helper to handle game completion
async function handleGameCompletion(game) {
    try {
        console.log(`Game ${game.id} finished. Winner: ${game.winner}`);

        // Only record stats if we have two players and a valid result
        if (game.players.length === 2) {
            const p1 = game.players[0];
            const p2 = game.players[1];

            // We need user IDs to record stats. 
            // If users are guests (no userId), we can't record stats for them.
            // But we should try to record for authenticated users even if opponent is guest.

            // However, our schema requires player_id to be a UUID from users table.
            // So we can only record if the player is authenticated.

            let durationSeconds = 0;
            if (game.startTime) {
                durationSeconds = Math.floor((Date.now() - game.startTime) / 1000);
            }

            // We'll use a slightly modified approach: check each player
            if (p1.userId && p2.userId) {
                // Both authenticated - record full game
                await StatsModel.recordGame(game.id, p1.userId, p2.userId,
                    game.winner === p1.color ? p1.userId : (game.winner === p2.color ? p2.userId : null),
                    durationSeconds);
            } else {
                console.log('Skipping stats recording: one or both players are guests');
            }
        }
    } catch (error) {
        console.error('Error handling game completion:', error);
    }
}

// Stats API Endpoints
app.get('/api/stats/me', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const [stats, history] = await Promise.all([
            StatsModel.getPlayerStats(req.user.id),
            StatsModel.getPlayerHistory(req.user.id)
        ]);

        res.json({
            stats: stats || {
                wins: 0, losses: 0, draws: 0, total_games: 0, rank_score: 0, rank: '-'
            },
            history
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/metrics', (req, res) => {
    try {
        const metrics = gameManager.getMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/rankings', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const rankings = await StatsModel.getLeaderboard(limit, offset);
        res.json(rankings);
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Catch-all route for client-side routing (must be last)
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
