const GobletGame = require('./GobletGame');
const GameModel = require('../models/GameModel');
const { v4: uuidv4 } = require('uuid');

class GameManager {
    constructor(maxGames = 1000) {
        this.games = new Map();
        this.maxGames = maxGames;
        this.startCleanupInterval();
    }

    createGame() {
        const id = uuidv4();
        const game = new GobletGame(id);
        this.games.set(id, game);
        return game;
    }

    getGame(id) {
        return this.games.get(id);
    }

    removeGame(id) {
        this.games.delete(id);
    }

    findGameForPlayer(playerId, preferredColor, userData = null) {
        // Check if player is already in a game
        for (const game of this.games.values()) {
            if (game.players.some(p => p.id === playerId)) {
                return game; // Return existing game
            }
        }

        // Find a waiting game or create a new one
        for (const game of this.games.values()) {
            if (game.state === 'waiting' && game.players.length < 2) {
                if (game.addPlayer(playerId, preferredColor, userData)) {
                    return game;
                }
            }
        }

        // No available game, create a new one
        const newGame = new GobletGame(uuidv4());
        newGame.addPlayer(playerId, preferredColor, userData);
        this.games.set(newGame.id, newGame);
        return newGame;
    }

    createGame(playerId, preferredColor, userData = null, isPublic = true, requestJoinCode = false, boardSize = 4) {
        // Check memory limit before creating
        if (!this.enforceMemoryLimit()) {
            throw new Error('Server at capacity. Please try again in a moment.');
        }

        // Generate join code if private game requested
        const joinCode = requestJoinCode ? this.generateJoinCode() : null;

        const game = new GobletGame(uuidv4(), isPublic, joinCode, boardSize);
        if (playerId) {
            game.addPlayer(playerId, preferredColor, userData);
        }
        this.games.set(game.id, game);
        return game;
    }

    // Generate a unique 3-digit join code
    generateJoinCode() {
        let code;
        let attempts = 0;
        const maxAttempts = 1000;

        do {
            // Generate random 3-digit code (000-999)
            code = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            attempts++;

            if (attempts >= maxAttempts) {
                throw new Error('Unable to generate unique join code');
            }
        } while (this.getGameByJoinCode(code));

        return code;
    }

    // Find game by join code
    getGameByJoinCode(code) {
        for (const game of this.games.values()) {
            if (game.joinCode === code && game.state === 'waiting') {
                return game;
            }
        }
        return null;
    }

    getGameByPlayerId(playerId) {
        for (const game of this.games.values()) {
            if (game.players.find(p => p.id === playerId)) {
                return game;
            }
        }
        return null;
    }

    // Load game from database and restore to memory
    async loadGameFromDatabase(gameId) {
        try {
            const gameData = await GameModel.load(gameId);
            if (!gameData) {
                return null;
            }

            // Create a new game instance with correct boardSize
            const boardSize = gameData.boardSize || 4; // Default to 4x4 for old games
            const game = new GobletGame(gameData.id, gameData.isPublic, gameData.joinCode, boardSize);

            // Restore state - be careful with field names
            game.state = gameData.state;
            game.winner = gameData.winner;
            game.turn = gameData.turn;
            game.board = gameData.board;
            game.playerHands = gameData.playerHands || {}; // Use playerHands from loaded data
            game.lastMove = gameData.lastMove;
            game.players = gameData.players;
            game.winningLine = gameData.winningLine;

            // Add to memory
            this.games.set(game.id, game);

            console.log(`Loaded game ${gameId} from database`);
            return game;
        } catch (error) {
            console.error('Error loading game from database:', error);
            return null;
        }
    }

    startCleanupInterval(intervalMs = 5000) {
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        this.cleanupInterval = setInterval(() => this.cleanupAbandonedGames(), intervalMs);
    }

    cleanupAbandonedGames() {
        const now = Date.now();
        let removedCount = 0;

        for (const [id, game] of this.games.entries()) {
            // Skip if game has active players
            if (game.hasActivePlayers()) continue;

            // Calculate time since last activity (all players disconnected)
            const timeSinceActivity = game.getTimeSinceLastActivity();

            let shouldRemove = false;

            if (game.state === 'waiting') {
                // Remove waiting games quickly (10 seconds) if host leaves
                if (timeSinceActivity > 10000) {
                    shouldRemove = true;
                    console.log(`Cleaning up abandoned waiting game ${id}`);
                }
            } else if (game.state === 'playing') {
                // Keep playing games for 5 minutes to allow reconnection
                if (timeSinceActivity > 5 * 60 * 1000) {
                    shouldRemove = true;
                    console.log(`Cleaning up abandoned playing game ${id}`);
                }
            } else if (game.state === 'finished') {
                // Keep finished games for 1 minute
                if (timeSinceActivity > 60 * 1000) {
                    shouldRemove = true;
                    console.log(`Cleaning up finished game ${id}`);
                }
            }

            if (shouldRemove) {
                this.removeGame(id);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            console.log(`Cleanup: Removed ${removedCount} abandoned games`);
        }
    }

    findOldestFinishedGame() {
        let oldestGame = null;
        let oldestTime = Date.now();

        for (const [id, game] of this.games.entries()) {
            if (game.state === 'finished') {
                const lastActivity = game.getLastActivity();
                if (lastActivity < oldestTime) {
                    oldestTime = lastActivity;
                    oldestGame = game;
                }
            }
        }

        return oldestGame;
    }

    enforceMemoryLimit() {
        if (this.games.size >= this.maxGames) {
            console.log(`Memory limit reached (${this.games.size}/${this.maxGames}), removing oldest finished game`);
            const oldestFinished = this.findOldestFinishedGame();
            if (oldestFinished) {
                this.removeGame(oldestFinished.id);
                console.log(`Removed finished game ${oldestFinished.id} to make room`);
                return true;
            } else {
                console.warn(`At memory limit but no finished games to remove`);
                return false;
            }
        }
        return true;
    }

    getMetrics() {
        const games = Array.from(this.games.values());
        return {
            totalGames: this.games.size,
            maxGames: this.maxGames,
            utilizationPercent: Math.round((this.games.size / this.maxGames) * 100),
            waitingGames: games.filter(g => g.state === 'waiting').length,
            playingGames: games.filter(g => g.state === 'playing').length,
            finishedGames: games.filter(g => g.state === 'finished').length,
            totalPlayers: games.reduce((sum, g) => sum + g.players.length, 0)
        };
    }
}

module.exports = new GameManager();
