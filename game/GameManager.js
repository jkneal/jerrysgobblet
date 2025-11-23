const GobletGame = require('./GobletGame');
const { v4: uuidv4 } = require('uuid');

class GameManager {
    constructor() {
        this.games = new Map();
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

    findGameForPlayer(playerId, preferredColor) {
        // Simple matchmaking: find first waiting game or create new
        for (const game of this.games.values()) {
            if (game.state === 'waiting') {
                // Check if preferred color is available
                if (game.isColorAvailable(preferredColor)) {
                    game.addPlayer(playerId, preferredColor);
                    return game;
                }
            }
        }
        return this.createGame(playerId, preferredColor);
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
}

module.exports = new GameManager();
