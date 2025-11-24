const { pool } = require('../config/database');

class GameModel {
    // Save or update a game in the database (async, fire-and-forget)
    static async save(game) {
        try {
            const query = `
                INSERT INTO games (id, state, winner, turn_player_id, board, player_hands, last_move)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET
                    state = EXCLUDED.state,
                    winner = EXCLUDED.winner,
                    turn_player_id = EXCLUDED.turn_player_id,
                    board = EXCLUDED.board,
                    player_hands = EXCLUDED.player_hands,
                    last_move = EXCLUDED.last_move,
                    updated_at = CURRENT_TIMESTAMP
            `;

            const values = [
                game.id,
                game.state,
                game.winner,
                game.turn,
                JSON.stringify(game.board),
                JSON.stringify(game.playerHands),
                game.lastMove ? JSON.stringify(game.lastMove) : null
            ];

            await pool.query(query, values);
        } catch (error) {
            console.error('Error saving game to database:', error);
            // Don't throw - this is fire-and-forget
        }
    }

    // Save game players (async, fire-and-forget)
    static async savePlayers(gameId, players) {
        try {
            // Use UPSERT to avoid duplicate key errors
            for (const player of players) {
                const query = `
                    INSERT INTO game_players (game_id, user_id, socket_id, color, display_name, avatar_url)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (game_id, color) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        socket_id = EXCLUDED.socket_id,
                        display_name = EXCLUDED.display_name,
                        avatar_url = EXCLUDED.avatar_url
                `;

                const values = [
                    gameId,
                    player.userId,
                    player.id,
                    player.color,
                    player.displayName,
                    player.avatarUrl
                ];

                await pool.query(query, values);
            }
        } catch (error) {
            console.error('Error saving game players to database:', error);
            // Don't throw - this is fire-and-forget
        }
    }

    // Load a game from the database
    static async load(gameId) {
        try {
            const gameQuery = 'SELECT * FROM games WHERE id = $1';
            const gameResult = await pool.query(gameQuery, [gameId]);

            if (gameResult.rows.length === 0) {
                return null;
            }

            const gameData = gameResult.rows[0];

            // Load players
            const playersQuery = 'SELECT * FROM game_players WHERE game_id = $1 ORDER BY joined_at';
            const playersResult = await pool.query(playersQuery, [gameId]);

            return {
                id: gameData.id,
                state: gameData.state,
                winner: gameData.winner,
                turn: gameData.turn_player_id,
                board: gameData.board,
                playerHands: gameData.player_hands, // Convert to camelCase
                lastMove: gameData.last_move,
                players: playersResult.rows.map(p => ({
                    id: p.socket_id,
                    userId: p.user_id,
                    color: p.color,
                    displayName: p.display_name,
                    avatarUrl: p.avatar_url
                }))
            };
        } catch (error) {
            console.error('Error loading game from database:', error);
            return null;
        }
    }

    // Get active games for a user
    static async getActiveGamesForUser(userId) {
        try {
            const query = `
                SELECT g.id, g.state, g.updated_at,
                       json_agg(
                           json_build_object(
                               'color', gp.color,
                               'displayName', gp.display_name,
                               'avatarUrl', gp.avatar_url,
                               'userId', gp.user_id
                           ) ORDER BY gp.joined_at
                       ) as players
                FROM games g
                JOIN game_players gp ON g.id = gp.game_id
                WHERE g.state IN ('waiting', 'playing')
                AND EXISTS (
                    SELECT 1 FROM game_players 
                    WHERE game_id = g.id AND user_id = $1
                )
                GROUP BY g.id, g.state, g.updated_at
                ORDER BY g.updated_at DESC
            `;

            const result = await pool.query(query, [userId]);
            return result.rows.map(row => ({
                id: row.id,
                state: row.state,
                players: row.players,
                updatedAt: row.updated_at
            }));
        } catch (error) {
            console.error('Error getting active games for user:', error);
            return [];
        }
    }

    // Delete old finished games (cleanup)
    static async deleteOldGames(hoursOld = 24) {
        try {
            const query = `
                DELETE FROM games 
                WHERE state = 'finished' 
                AND updated_at < NOW() - INTERVAL '${hoursOld} hours'
            `;

            const result = await pool.query(query);
            console.log(`Deleted ${result.rowCount} old finished games`);
            return result.rowCount;
        } catch (error) {
            console.error('Error deleting old games:', error);
            return 0;
        }
    }

    // Update player socket ID (for reconnection)
    static async updatePlayerSocketId(gameId, userId, newSocketId) {
        try {
            const query = `
                UPDATE game_players 
                SET socket_id = $1 
                WHERE game_id = $2 AND user_id = $3
            `;

            await pool.query(query, [newSocketId, gameId, userId]);
        } catch (error) {
            console.error('Error updating player socket ID:', error);
        }
    }
}

module.exports = GameModel;
