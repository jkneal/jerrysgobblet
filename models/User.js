const db = require('../config/database');

class User {
    // Find user by Google ID
    static async findByGoogleId(googleId) {
        const result = await db.query(
            'SELECT * FROM users WHERE google_id = $1',
            [googleId]
        );
        return result.rows[0];
    }

    // Find user by UUID
    static async findById(id) {
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // Find user by nickname
    static async findByNickname(nickname) {
        const result = await db.query(
            'SELECT * FROM users WHERE nickname = $1',
            [nickname]
        );
        return result.rows[0];
    }

    // Create new user
    static async create(userData) {
        const { googleId, email, firstName, lastName, nickname, avatarUrl } = userData;

        const result = await db.query(
            `INSERT INTO users (google_id, email, first_name, last_name, nickname, avatar_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [googleId, email, firstName, lastName, nickname || null, avatarUrl]
        );

        return result.rows[0];
    }

    // Update user profile
    static async update(id, userData) {
        const { firstName, lastName, nickname, avatarUrl } = userData;

        const result = await db.query(
            `UPDATE users 
             SET first_name = COALESCE($2, first_name),
                 last_name = COALESCE($3, last_name),
                 nickname = COALESCE($4, nickname),
                 avatar_url = COALESCE($5, avatar_url)
             WHERE id = $1
             RETURNING *`,
            [id, firstName, lastName, nickname, avatarUrl]
        );

        return result.rows[0];
    }

    // Get display name (nickname or first name)
    static getDisplayName(user) {
        if (!user) return 'Unknown';
        return user.nickname || user.first_name || user.email.split('@')[0];
    }
}

module.exports = User;
