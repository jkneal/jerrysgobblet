const GobletGame = require('./GobletGame');
const GameModel = require('../models/GameModel');
const { v4: uuidv4 } = require('uuid');

class GameManager {
    constructor() {
        this.games = new Map();
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

    createGame(playerId, preferredColor) {
        const game = new GobletGame(uuidv4());
        if (playerId) {
            game.addPlayer(playerId, preferredColor);
        }
        this.games.set(game.id, game);
        return game;
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

            // Create a new game instance (this initializes playerHands as {})
            const game = new GobletGame(gameData.id);

            // Restore state - be careful with field names
            game.state = gameData.state;
            game.winner = gameData.winner;
            game.turn = gameData.turn;
            game.board = gameData.board;
            game.playerHands = gameData.playerHands || {}; // Use playerHands from loaded data
            game.lastMove = gameData.lastMove;
            game.players = gameData.players;

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
}

module.exports = new GameManager();
