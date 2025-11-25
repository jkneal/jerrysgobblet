const { pool } = require('../config/database');

class StatsModel {
    // Record a finished game
    static async recordGame(gameId, player1Id, player2Id, winnerId, durationSeconds) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const playedAt = new Date();

            // Determine results
            const p1Result = winnerId ? (player1Id === winnerId ? 'win' : 'loss') : 'draw';
            const p2Result = winnerId ? (player2Id === winnerId ? 'win' : 'loss') : 'draw';

            // Insert game history for Player 1
            await client.query(
                `INSERT INTO game_history (player_id, game_id, opponent_id, result, played_at, duration_seconds)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [player1Id, gameId, player2Id, p1Result, playedAt, durationSeconds]
            );

            // Insert game history for Player 2
            await client.query(
                `INSERT INTO game_history (player_id, game_id, opponent_id, result, played_at, duration_seconds)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [player2Id, gameId, player1Id, p2Result, playedAt, durationSeconds]
            );

            // Update stats for Player 1
            await this.updatePlayerStats(client, player1Id, p1Result);

            // Update stats for Player 2
            await this.updatePlayerStats(client, player2Id, p2Result);

            await client.query('COMMIT');
            console.log(`Recorded stats for game ${gameId}`);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error recording game stats:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Helper to update a single player's stats
    static async updatePlayerStats(client, userId, result) {
        // Ensure player record exists
        await client.query(
            `INSERT INTO player_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        let updateQuery = '';
        if (result === 'win') {
            updateQuery = `UPDATE player_stats SET wins = wins + 1, total_games = total_games + 1 WHERE user_id = $1`;
        } else if (result === 'loss') {
            updateQuery = `UPDATE player_stats SET losses = losses + 1, total_games = total_games + 1 WHERE user_id = $1`;
        } else {
            updateQuery = `UPDATE player_stats SET draws = draws + 1, total_games = total_games + 1 WHERE user_id = $1`;
        }

        await client.query(updateQuery, [userId]);

        // Update rank score: (Wins * 10) + (Draws * 3) + (Games * 1)
        await client.query(
            `UPDATE player_stats 
             SET rank_score = (wins * 10) + (draws * 3) + (total_games * 1)
             WHERE user_id = $1`,
            [userId]
        );
    }

    // Get stats for a specific player
    static async getPlayerStats(userId) {
        const result = await pool.query(
            `WITH ranked_stats AS (
                SELECT ps.*, u.nickname, u.first_name, u.last_name, u.avatar_url,
                       DENSE_RANK() OVER (ORDER BY ps.rank_score DESC) as rank
                FROM player_stats ps
                JOIN users u ON ps.user_id = u.id
             )
             SELECT * FROM ranked_stats WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0];
    }

    // Get recent game history for a player
    static async getPlayerHistory(userId, limit = 10, offset = 0) {
        const result = await pool.query(
            `SELECT gh.*,
                    COALESCE(u.nickname, u.first_name, u.email) as opponent_name,
                    u.avatar_url as opponent_avatar
             FROM game_history gh
             LEFT JOIN users u ON gh.opponent_id = u.id
             WHERE gh.player_id = $1
             ORDER BY gh.played_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }

    // Get global leaderboard
    static async getLeaderboard(limit = 50, offset = 0) {
        const result = await pool.query(
            `SELECT ps.*, u.nickname, u.first_name, u.last_name, u.avatar_url
             FROM player_stats ps
             JOIN users u ON ps.user_id = u.id
             ORDER BY ps.rank_score DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }
}

module.exports = StatsModel;
