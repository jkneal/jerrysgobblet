-- Games table to persist game state
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY,
    state VARCHAR(20) NOT NULL CHECK (state IN ('waiting', 'playing', 'finished')),
    winner VARCHAR(7), -- hex color of winner
    turn_player_id VARCHAR(255), -- socket ID of current turn player
    board JSONB NOT NULL DEFAULT '[]',
    player_hands JSONB NOT NULL DEFAULT '{}',
    last_move JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game players table to track players in each game
CREATE TABLE IF NOT EXISTS game_players (
    id SERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    socket_id VARCHAR(255),
    color VARCHAR(7) NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, color)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_socket_id ON game_players(socket_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS games_updated_at_trigger ON games;
CREATE TRIGGER games_updated_at_trigger
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_games_updated_at();
